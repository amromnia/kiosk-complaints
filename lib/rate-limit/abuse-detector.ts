import { RateLimitStore } from './types';

/**
 * Abuse Detection Module
 * Detects suspicious patterns and escalates rate limits
 */

export interface AbuseDetectionResult {
  isAbuse: boolean;
  reason?: string;
  multiplier: number; // Rate limit multiplier (1 = normal, 2+ = stricter)
}

export class AbuseDetector {
  private store: RateLimitStore;
  private lastRequestTime: Map<string, number> = new Map();
  private requestSpacing: Map<string, number[]> = new Map();

  constructor(store: RateLimitStore) {
    this.store = store;
  }

  /**
   * Check if request pattern indicates abuse
   */
  async checkRequest(
    identifier: string,
    endpoint: string,
    method: string
  ): Promise<AbuseDetectionResult> {
    const now = Date.now();
    const key = `${identifier}:${endpoint}`;

    // Check 1: Rapid-fire requests (< 10ms spacing = likely bot)
    const lastTime = this.lastRequestTime.get(key);
    if (lastTime && now - lastTime < 10) {
      await this.recordAbuse(identifier, 'rapid-fire');
      return {
        isAbuse: true,
        reason: 'Rapid-fire requests detected',
        multiplier: 2,
      };
    }
    this.lastRequestTime.set(key, now);

    // Check 2: Consistent timing pattern (bot detection)
    let spacing = this.requestSpacing.get(key) || [];
    if (lastTime) {
      spacing.push(now - lastTime);
      if (spacing.length > 10) spacing.shift();
      this.requestSpacing.set(key, spacing);

      // Check for suspiciously consistent timing (more lenient)
      if (spacing.length >= 10) {
        const avg = spacing.reduce((a, b) => a + b, 0) / spacing.length;
        const variance =
          spacing.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / spacing.length;
        const stdDev = Math.sqrt(variance);

        // If timing is extremely consistent (stdDev < 5ms) and very fast, likely a bot
        if (stdDev < 5 && avg < 50) {
          await this.recordAbuse(identifier, 'bot-pattern');
          return {
            isAbuse: true,
            reason: 'Automated request pattern detected',
            multiplier: 3,
          };
        }
      }
    }

    // Check 3: Recent abuse history (more lenient threshold)
    const abuseCount = await this.getAbuseCount(identifier);
    if (abuseCount >= 10) {
      return {
        isAbuse: true,
        reason: 'Multiple abuse violations',
        multiplier: Math.min(5, 2 + Math.floor(abuseCount / 3)),
      };
    }

    return {
      isAbuse: false,
      multiplier: 1,
    };
  }

  /**
   * Record abuse incident
   */
  private async recordAbuse(identifier: string, type: string): Promise<void> {
    const key = `abuse:${identifier}:${type}`;
    const ttl = 60 * 60 * 1000; // 1 hour
    await this.store.recordFailure(key, ttl);
  }

  /**
   * Get total abuse count for identifier
   */
  private async getAbuseCount(identifier: string): Promise<number> {
    const types = ['rapid-fire', 'bot-pattern', 'auth-failure'];
    let total = 0;

    for (const type of types) {
      const key = `abuse:${identifier}:${type}`;
      try {
        const count = await this.store.recordFailure(key, 0); // Get without incrementing
        total += count;
      } catch {
        // Ignore errors
      }
    }

    return total;
  }

  /**
   * Progressive delay for authentication failures (more forgiving)
   */
  async getAuthDelay(identifier: string): Promise<number> {
    const key = `auth-failures:${identifier}`;
    const ttl = 15 * 60 * 1000; // 15 minutes

    // Get failure count
    try {
      const count = await this.store.recordFailure(key, 0);

      // Progressive delay: Allow 10 free attempts, then gradually increase
      if (count < 10) return 0;
      if (count === 10) return 500;
      if (count === 11) return 1000;
      if (count === 12) return 2000;
      if (count === 13) return 4000;
      if (count === 14) return 8000;
      return 15000; // Max 15 seconds
    } catch {
      return 0;
    }
  }

  /**
   * Record authentication failure
   */
  async recordAuthFailure(identifier: string): Promise<number> {
    const key = `auth-failures:${identifier}`;
    const ttl = 15 * 60 * 1000; // 15 minutes
    
    // Record in abuse tracking too
    await this.recordAbuse(identifier, 'auth-failure');
    
    return await this.store.recordFailure(key, ttl);
  }

  /**
   * Clear authentication failures (on successful login)
   */
  async clearAuthFailures(identifier: string): Promise<void> {
    // Note: This would require a delete method on RateLimitStore
    // For now, failures will expire naturally
  }
}
