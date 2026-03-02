import { RateLimitStore, TokenBucketConfig, TokenBucketState } from './types';
import { createRateLimitStore } from './store';
import { AbuseDetector } from './abuse-detector';
import {
  normalizeEndpoint,
  getEndpointTier,
  generateRateLimitKey,
  getClientIdentifier,
} from './normalizer';

/**
 * Rate Limit Configuration by Tier
 */
const TIER_CONFIGS: Record<string, TokenBucketConfig> = {
  auth: {
    maxTokens: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    refillRate: 5 / (15 * 60), // 5 tokens per 15 minutes
  },
  mutation: {
    maxTokens: 30,
    windowMs: 60 * 1000, // 1 minute
    refillRate: 30 / 60, // 30 tokens per minute
  },
  query: {
    maxTokens: 60,
    windowMs: 60 * 1000, // 1 minute
    refillRate: 60 / 60, // 60 tokens per minute
  },
  public: {
    maxTokens: 100,
    windowMs: 60 * 1000, // 1 minute
    refillRate: 100 / 60, // 100 tokens per minute
  },
};

/**
 * Main Rate Limiter Class
 */
export class RateLimiter {
  private store: RateLimitStore;
  private abuseDetector: AbuseDetector;

  constructor(store?: RateLimitStore) {
    this.store = store || createRateLimitStore();
    this.abuseDetector = new AbuseDetector(this.store);
  }

  /**
   * Check rate limit for a request
   */
  async checkLimit(
    req: Request,
    userId?: string
  ): Promise<{ allowed: boolean; state: TokenBucketState; headers: Headers }> {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const method = req.method;

    // Determine identifier (user ID or IP)
    const identifier = getClientIdentifier(req, userId);

    // Check for abuse patterns
    const abuseCheck = await this.abuseDetector.checkRequest(identifier, pathname, method);

    // Get tier and config
    const tier = getEndpointTier(pathname);
    let config = { ...TIER_CONFIGS[tier] };

    // Apply abuse multiplier (stricter limits for abusers)
    if (abuseCheck.multiplier > 1) {
      config.maxTokens = Math.floor(config.maxTokens / abuseCheck.multiplier);
      config.refillRate = config.refillRate / abuseCheck.multiplier;
    }

    // Generate rate limit key
    const key = generateRateLimitKey(identifier, pathname, method);

    // Consume token
    const state = await this.store.consume(key, config);

    // Prepare headers
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', String(state.maxTokens));
    headers.set('X-RateLimit-Remaining', String(Math.max(0, state.tokens)));
    headers.set('X-RateLimit-Reset', String(Math.floor(state.resetTime / 1000)));
    
    if (!state.allowed) {
      headers.set('Retry-After', String(state.retryAfter));
    }

    if (abuseCheck.isAbuse) {
      headers.set('X-RateLimit-Abuse', abuseCheck.reason || 'true');
    }

    return {
      allowed: state.allowed,
      state,
      headers,
    };
  }

  /**
   * Check auth rate limit with progressive delay
   */
  async checkAuthLimit(
    req: Request,
    identifier: string
  ): Promise<{
    allowed: boolean;
    delay: number;
    state: TokenBucketState;
    headers: Headers;
  }> {
    // Check for required delay first
    const delay = await this.abuseDetector.getAuthDelay(identifier);

    // Check rate limit
    const result = await this.checkLimit(req);

    return {
      ...result,
      delay,
    };
  }

  /**
   * Record authentication failure
   */
  async recordAuthFailure(identifier: string): Promise<void> {
    await this.abuseDetector.recordAuthFailure(identifier);
  }

  /**
   * Get current state without consuming
   */
  async getState(
    req: Request,
    userId?: string
  ): Promise<TokenBucketState> {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const method = req.method;

    const identifier = getClientIdentifier(req, userId);
    const tier = getEndpointTier(pathname);
    const config = TIER_CONFIGS[tier];
    const key = generateRateLimitKey(identifier, pathname, method);

    return await this.store.getState(key, config);
  }
}

// Global instance
let globalRateLimiter: RateLimiter | null = null;

/**
 * Get global rate limiter instance
 */
export function getRateLimiter(): RateLimiter {
  if (!globalRateLimiter) {
    globalRateLimiter = new RateLimiter();
  }
  return globalRateLimiter;
}
