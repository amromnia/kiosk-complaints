/**
 * Rate Limiting Types and Interfaces
 * Production-ready, horizontally scalable
 */

export interface RateLimitStore {
  /**
   * Attempt to consume a token from the bucket
   * @returns Token bucket state
   */
  consume(key: string, config: TokenBucketConfig): Promise<TokenBucketState>;
  
  /**
   * Get current state without consuming
   */
  getState(key: string, config: TokenBucketConfig): Promise<TokenBucketState>;
  
  /**
   * Record a failed attempt (for progressive delays)
   */
  recordFailure(key: string, ttl: number): Promise<number>;
  
  /**
   * Clean up expired keys (for in-memory fallback)
   */
  cleanup?(): Promise<void>;
}

export interface TokenBucketConfig {
  maxTokens: number;        // Maximum tokens in bucket
  refillRate: number;       // Tokens per second
  windowMs: number;         // Time window for stats
}

export interface TokenBucketState {
  allowed: boolean;         // Whether request is allowed
  tokens: number;           // Current tokens remaining
  maxTokens: number;        // Maximum tokens
  resetTime: number;        // Unix timestamp when bucket refills
  retryAfter: number;       // Seconds until next allowed request
}

export interface RateLimitConfig {
  maxRequests: number;      // Legacy: converted to tokens
  windowMs: number;         // Time window
  refillRate?: number;      // Optional custom refill rate
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;            // Unix timestamp in seconds
  retryAfter?: number;      // Seconds
}

export interface AbuseDetectionResult {
  isAbuse: boolean;
  reason?: string;
  multiplier: number;       // Rate limit multiplier (1.0 = normal)
}

export interface RateLimitLogEntry {
  timestamp: number;
  ip: string;
  userId?: number;
  endpoint: string;
  allowed: boolean;
  remaining: number;
  userAgent?: string;
  abuse?: AbuseDetectionResult;
}
