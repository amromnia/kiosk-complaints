# Enterprise Rate Limiting System

## Overview

This is an enterprise-grade rate limiting implementation for Next.js using:
- **Token Bucket Algorithm** for smooth rate limiting
- **Redis Backend** for distributed, horizontally-scalable limiting
- **Behavioral Abuse Detection** for bot and attack pattern recognition
- **Progressive Authentication Delays** to prevent brute force attacks
- **Endpoint Normalization** for consistent dynamic route handling

## Architecture

```
┌─────────────────┐
│   Middleware    │  ← Entry point for all requests
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   RateLimiter   │  ← Main orchestration class
└────────┬────────┘
         │
         ├──────────────────┬──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ AbuseDetector│   │RateLimitStore│   │  Normalizer  │
└──────────────┘   └──────┬───────┘   └──────────────┘
                          │
                   ┌──────┴──────┐
                   │             │
                   ▼             ▼
            ┌───────────┐  ┌──────────┐
            │Redis Store│  │In-Memory │
            └───────────┘  └──────────┘
```

## Components

### 1. RateLimitStore Interface (`types.ts`)

Abstraction layer for storage backends. Defines:
- `consume(key, config)` - Attempt to consume a token
- `getState(key, config)` - Check current state without consuming
- `recordFailure(key, ttl)` - Record abuse incidents

### 2. Storage Implementations (`store.ts`)

**RedisRateLimitStore**:
- Uses Lua scripts for atomic operations
- Token bucket logic runs in Redis (single atomic operation)
- Automatic TTL-based expiration
- Connection retry logic (3 attempts)
- Graceful fallback on errors

**InMemoryRateLimitStore**:
- Development/testing fallback
- Same interface as Redis store
- Periodic cleanup (5 minutes)
- **Not recommended for production with multiple instances**

### 3. Token Bucket Algorithm

Classic token bucket implementation:
```
tokens = min(maxTokens, currentTokens + (timePassed * refillRate))
allowed = tokens >= 1
if allowed: tokens -= 1
```

**Benefits over Fixed Window**:
- No burst abuse at window boundaries
- Smooth rate limiting experience
- Handles bursty traffic gracefully

### 4. Endpoint Normalizer (`normalizer.ts`)

Converts dynamic routes to patterns:
```
/api/users/123        → /api/users/:id
/api/complaints/abc   → /api/complaints/:id
/api/files/document.pdf → /api/files/:id
```

**Patterns Detected**:
- UUIDs (8-4-4-4-12 format)
- Nanoids (21 characters)
- Numeric IDs (pure digits)
- Alphanumeric IDs (8+ chars)

### 5. Abuse Detector (`abuse-detector.ts`)

Detects malicious patterns:

**Rapid-Fire Detection**:
- Triggers: < 50ms between requests
- Response: 3x stricter limits

**Bot Pattern Detection**:
- Analyzes timing consistency (standard deviation)
- Triggers: stdDev < 10ms && avg < 200ms
- Response: 5x stricter limits

**Authentication Failures**:
- Tracks failed login attempts
- Progressive delays: 0s → 1s → 2s → 4s → 8s → 16s → 30s
- Window: 15 minutes

### 6. Main Rate Limiter (`index.ts`)

Orchestrates all components:
- Determines rate limit tier
- Applies abuse multipliers
- Manages authentication delays
- Returns standardized responses

## Rate Limit Tiers

| Tier         | Max Tokens | Window    | Refill Rate        | Use Case                |
|--------------|------------|-----------|--------------------|-----------------------  |
| **auth**     | 5          | 15 min    | 0.33 tokens/min    | Login, register         |
| **mutation** | 30         | 1 min     | 0.5 tokens/sec     | Submissions, uploads    |
| **query**    | 60         | 1 min     | 1 token/sec        | GET requests            |
| **public**   | 100        | 1 min     | 1.67 tokens/sec    | Public pages            |

## Usage

### Basic Setup

```typescript
import { getRateLimiter } from '@/lib/rate-limit';

const rateLimiter = getRateLimiter();

const result = await rateLimiter.checkLimit(request, userId);

if (!result.allowed) {
  return new Response('Too many requests', { status: 429 });
}
```

### Authentication with Progressive Delays

```typescript
const identifier = `ip:${clientIP}`;
const result = await rateLimiter.checkAuthLimit(request, identifier);

// Apply delay BEFORE processing login
if (result.delay > 0) {
  await new Promise(resolve => setTimeout(resolve, result.delay));
}

// ... process login ...

// If login fails
if (!authenticated) {
  await rateLimiter.recordAuthFailure(identifier);
}
```

### Custom Configuration

Edit tier configs in `lib/rate-limit/index.ts`:

```typescript
const TIER_CONFIGS = {
  auth: {
    maxTokens: 5,
    windowMs: 15 * 60 * 1000,
    refillRate: 5 / (15 * 60),
  },
  // ...
};
```

## Environment Setup

### Production (Redis Required)

```bash
# .env
REDIS_URL=redis://localhost:6379

# Or with authentication
REDIS_URL=redis://username:password@hostname:port
```

### Development (In-Memory Fallback)

```bash
# .env
# Leave REDIS_URL unset
```

System automatically uses in-memory store if Redis not available.

## Response Headers

```
X-RateLimit-Limit: 60           # Max tokens in bucket
X-RateLimit-Remaining: 45       # Remaining tokens
X-RateLimit-Reset: 1234567890   # Unix timestamp of next refill
Retry-After: 15                 # Seconds to wait (if limited)
X-RateLimit-Abuse: true         # Abuse detected (optional)
```

## Error Handling

**Redis Connection Failure**:
- Logs error to console
- Allows request through (fail-open)
- Recommendation: Set up Redis monitoring

**General Errors**:
- Middleware catches all rate limit errors
- Logs to console
- Allows request through (graceful degradation)

## Performance Considerations

**Redis Store**:
- Single Lua script execution per request
- O(1) time complexity
- Minimal network overhead
- ~1-2ms latency per check

**In-Memory Store**:
- O(1) lookups via Map
- No network latency
- ~0.1ms per check
- Memory usage: ~100 bytes per key

**Cleanup**:
- Redis: Automatic via TTL
- In-Memory: Every 5 minutes

## Security Best Practices

1. **Always use Redis in production** with multiple instances
2. **Monitor rate limit violations** via logs
3. **Set up Redis authentication** in production
4. **Use Redis persistence** (AOF or RDB) for critical data
5. **Configure Redis maxmemory** policy (e.g., `allkeys-lru`)
6. **Enable Redis SSL/TLS** for production connections

## Testing

```bash
# Test with curl
curl -i http://localhost:3000/api/test

# Check headers
curl -i http://localhost:3000/api/test | grep X-RateLimit

# Trigger rate limit (spam requests)
for i in {1..100}; do curl http://localhost:3000/api/test; done
```

## Troubleshooting

**"Using in-memory store" warning**:
- Redis not configured
- Check `REDIS_URL` environment variable
- Verify Redis is running: `redis-cli ping`

**Rate limits not working**:
- Check middleware matcher pattern
- Verify route not excluded (static files, `_next/*`)
- Check browser network tab for headers

**Too strict/lenient**:
- Adjust tier configs in `lib/rate-limit/index.ts`
- Consider abuse multipliers affecting limits
- Check for abuse detection false positives

## Advanced Features

### Custom Abuse Detection

Extend `AbuseDetector` class:

```typescript
class CustomAbuseDetector extends AbuseDetector {
  async checkRequest(identifier, endpoint, method) {
    const result = await super.checkRequest(identifier, endpoint, method);
    
    // Add custom logic
    if (myCustomCheck()) {
      return { isAbuse: true, reason: 'Custom rule', multiplier: 2 };
    }
    
    return result;
  }
}
```

### Per-User Rate Limits

Already implemented! When `userId` is provided:
```typescript
const result = await rateLimiter.checkLimit(request, userId);
```

Key format: `ratelimit:user:123:GET:/api/complaints`

### Endpoint-Specific Overrides

Modify `getEndpointTier()` in `normalizer.ts`:

```typescript
if (path === '/api/my-special-endpoint') {
  return 'custom';
}
```

Add tier to `TIER_CONFIGS`.

## License

Part of Kiosk Complaints Management System
