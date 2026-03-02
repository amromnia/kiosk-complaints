import Redis from 'ioredis';
import { RateLimitStore, TokenBucketConfig, TokenBucketState } from './types';

/**
 * Redis-based Token Bucket Rate Limiter
 * Horizontally scalable, atomic operations
 */
export class RedisRateLimitStore implements RateLimitStore {
  private redis: Redis;

  constructor(redisUrl?: string) {
    this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 3) return null; // Stop retrying
        return Math.min(times * 100, 2000);
      },
    });

    this.redis.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message);
    });

    // Try to connect
    this.redis.connect().catch((err) => {
      console.warn('[Redis] Failed to connect, will use in-memory fallback:', err.message);
    });
  }

  async consume(key: string, config: TokenBucketConfig): Promise<TokenBucketState> {
    const now = Date.now();
    const refillRate = config.refillRate || config.maxTokens / (config.windowMs / 1000);

    try {
      // Lua script for atomic token bucket operation
      const script = `
        local key = KEYS[1]
        local max_tokens = tonumber(ARGV[1])
        local refill_rate = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])
        
        local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
        local tokens = tonumber(bucket[1]) or max_tokens
        local last_refill = tonumber(bucket[2]) or now
        
        -- Calculate refill
        local time_passed = (now - last_refill) / 1000
        local tokens_to_add = time_passed * refill_rate
        tokens = math.min(max_tokens, tokens + tokens_to_add)
        
        -- Try to consume
        local allowed = tokens >= 1
        if allowed then
          tokens = tokens - 1
        end
        
        -- Save state
        redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
        redis.call('EXPIRE', key, math.ceil(max_tokens / refill_rate))
        
        return {allowed and 1 or 0, tokens, now + math.ceil((1 - tokens) / refill_rate) * 1000}
      `;

      const result = await this.redis.eval(
        script,
        1,
        key,
        config.maxTokens,
        refillRate,
        now
      ) as [number, number, number];

      const [allowed, tokens, resetTime] = result;

      return {
        allowed: allowed === 1,
        tokens: Math.floor(tokens),
        maxTokens: config.maxTokens,
        resetTime: resetTime,
        retryAfter: allowed === 1 ? 0 : Math.ceil((resetTime - now) / 1000),
      };
    } catch (err) {
      console.error('[Redis] Token bucket consume error:', err);
      // Fallback: allow the request on error
      return {
        allowed: true,
        tokens: config.maxTokens,
        maxTokens: config.maxTokens,
        resetTime: now + config.windowMs,
        retryAfter: 0,
      };
    }
  }

  async getState(key: string, config: TokenBucketConfig): Promise<TokenBucketState> {
    const now = Date.now();
    const refillRate = config.refillRate || config.maxTokens / (config.windowMs / 1000);

    try {
      const bucket = await this.redis.hmget(key, 'tokens', 'last_refill');
      const tokens = parseFloat(bucket[0] || String(config.maxTokens));
      const lastRefill = parseInt(bucket[1] || String(now));

      const timePassed = (now - lastRefill) / 1000;
      const tokensToAdd = timePassed * refillRate;
      const currentTokens = Math.min(config.maxTokens, tokens + tokensToAdd);

      return {
        allowed: currentTokens >= 1,
        tokens: Math.floor(currentTokens),
        maxTokens: config.maxTokens,
        resetTime: now + Math.ceil((1 - currentTokens) / refillRate) * 1000,
        retryAfter: currentTokens >= 1 ? 0 : Math.ceil((1 - currentTokens) / refillRate),
      };
    } catch (err) {
      console.error('[Redis] Get state error:', err);
      return {
        allowed: true,
        tokens: config.maxTokens,
        maxTokens: config.maxTokens,
        resetTime: now + config.windowMs,
        retryAfter: 0,
      };
    }
  }

  async recordFailure(key: string, ttl: number): Promise<number> {
    try {
      const count = await this.redis.incr(key);
      await this.redis.expire(key, Math.ceil(ttl / 1000));
      return count;
    } catch (err) {
      console.error('[Redis] Record failure error:', err);
      return 0;
    }
  }

  async close() {
    await this.redis.quit();
  }
}

/**
 * In-Memory Fallback Store (for development/testing)
 * NOT RECOMMENDED for production with multiple instances
 */
export class InMemoryRateLimitStore implements RateLimitStore {
  private buckets: Map<string, { tokens: number; lastRefill: number }> = new Map();
  private failures: Map<string, { count: number; expiry: number }> = new Map();

  constructor() {
    // Cleanup every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  async consume(key: string, config: TokenBucketConfig): Promise<TokenBucketState> {
    const now = Date.now();
    const refillRate = config.refillRate || config.maxTokens / (config.windowMs / 1000);

    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = { tokens: config.maxTokens, lastRefill: now };
      this.buckets.set(key, bucket);
    }

    // Refill tokens
    const timePassed = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = timePassed * refillRate;
    bucket.tokens = Math.min(config.maxTokens, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    // Consume token
    const allowed = bucket.tokens >= 1;
    if (allowed) {
      bucket.tokens -= 1;
    }

    const resetTime = now + Math.ceil((1 - bucket.tokens) / refillRate) * 1000;

    return {
      allowed,
      tokens: Math.floor(bucket.tokens),
      maxTokens: config.maxTokens,
      resetTime,
      retryAfter: allowed ? 0 : Math.ceil((resetTime - now) / 1000),
    };
  }

  async getState(key: string, config: TokenBucketConfig): Promise<TokenBucketState> {
    const now = Date.now();
    const refillRate = config.refillRate || config.maxTokens / (config.windowMs / 1000);

    const bucket = this.buckets.get(key);
    if (!bucket) {
      return {
        allowed: true,
        tokens: config.maxTokens,
        maxTokens: config.maxTokens,
        resetTime: now + config.windowMs,
        retryAfter: 0,
      };
    }

    const timePassed = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = timePassed * refillRate;
    const currentTokens = Math.min(config.maxTokens, bucket.tokens + tokensToAdd);

    return {
      allowed: currentTokens >= 1,
      tokens: Math.floor(currentTokens),
      maxTokens: config.maxTokens,
      resetTime: now + Math.ceil((1 - currentTokens) / refillRate) * 1000,
      retryAfter: currentTokens >= 1 ? 0 : Math.ceil((1 - currentTokens) / refillRate),
    };
  }

  async recordFailure(key: string, ttl: number): Promise<number> {
    const now = Date.now();
    let failure = this.failures.get(key);
    
    if (!failure || now > failure.expiry) {
      failure = { count: 0, expiry: now + ttl };
      this.failures.set(key, failure);
    }
    
    failure.count += 1;
    return failure.count;
  }

  async cleanup() {
    const now = Date.now();
    
    // Clean up expired failures
    for (const [key, failure] of this.failures.entries()) {
      if (now > failure.expiry) {
        this.failures.delete(key);
      }
    }
    
    // Clean up old buckets (no activity for 1 hour)
    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > 60 * 60 * 1000) {
        this.buckets.delete(key);
      }
    }
  }
}

// Factory function to create appropriate store
export function createRateLimitStore(): RateLimitStore {
  if (process.env.REDIS_URL || process.env.NODE_ENV === 'production') {
    console.log('[RateLimit] Using Redis store');
    return new RedisRateLimitStore();
  } else {
    console.warn('[RateLimit] Using in-memory store (NOT RECOMMENDED for production)');
    return new InMemoryRateLimitStore();
  }
}
