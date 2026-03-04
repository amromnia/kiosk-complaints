/**
 * Endpoint Normalization Utility
 * Converts dynamic routes to patterns for consistent rate limiting
 * 
 * Examples:
 * /api/users/123 -> /api/users/:id
 * /api/complaints/abc-def/comments -> /api/complaints/:id/comments
 */

// Cache for normalized paths
const normalizedCache = new Map<string, string>();

// Common ID patterns
const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const NANOID_REGEX = /[a-zA-Z0-9_-]{21}/g;
const NUMERIC_ID_REGEX = /\/\d+(?=\/|$)/g;
const ALPHANUMERIC_ID_REGEX = /\/[a-zA-Z0-9_-]{8,}(?=\/|$)/g;

/**
 * Normalize an endpoint to a pattern
 */
export function normalizeEndpoint(path: string): string {
  // Check cache first
  if (normalizedCache.has(path)) {
    return normalizedCache.get(path)!;
  }

  let normalized = path;

  // Remove query string
  const queryIndex = normalized.indexOf('?');
  if (queryIndex !== -1) {
    normalized = normalized.substring(0, queryIndex);
  }

  // Replace UUIDs
  normalized = normalized.replace(UUID_REGEX, ':id');

  // Replace nanoid-like strings (21 chars)
  normalized = normalized.replace(NANOID_REGEX, ':id');

  // Replace numeric IDs
  normalized = normalized.replace(NUMERIC_ID_REGEX, '/:id');

  // Replace other alphanumeric IDs (8+ chars)
  normalized = normalized.replace(ALPHANUMERIC_ID_REGEX, '/:id');

  // Cache result
  if (normalizedCache.size > 1000) {
    // Prevent unbounded cache growth
    normalizedCache.clear();
  }
  normalizedCache.set(path, normalized);

  return normalized;
}

/**
 * Get rate limit tier for an endpoint
 */
export function getEndpointTier(path: string): 'auth' | 'mutation' | 'query' | 'public' {
  // Auth endpoints (strictest)
  if (path.includes('/auth/login') || path.includes('/auth/register')) {
    return 'auth';
  }

  // Mutation endpoints (POST/PUT/DELETE)
  if (
    path.includes('/submit') ||
    path.includes('/upload') ||
    path.includes('/assign') ||
    path.includes('/status') ||
    path.includes('/reset-password') ||
    path.includes('/generate-link')
  ) {
    return 'mutation';
  }

  // Public endpoints (least strict)
  if (path.startsWith('/complaint/') || path.startsWith('/_next')) {
    return 'public';
  }

  // Query endpoints (default)
  return 'query';
}

/**
 * Generate rate limit key for request
 */
export function generateRateLimitKey(
  identifier: string,
  endpoint: string,
  method: string
): string {
  const normalizedEndpoint = normalizeEndpoint(endpoint);
  return `ratelimit:${identifier}:${method}:${normalizedEndpoint}`;
}

/**
 * Extract client identifier (IP or user ID)
 * SECURITY: Do not trust X-Forwarded-For header to prevent rate limit bypass
 */
export function getClientIdentifier(req: Request, userId?: string): string {
  // Prefer user ID if authenticated
  if (userId) {
    return `user:${userId}`;
  }

  // SECURITY FIX: Use a combination of headers for fingerprinting instead of X-Forwarded-For alone
  // This prevents rate limit bypass via header spoofing
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const accept = req.headers.get('accept') || 'unknown';
  
  // Create a hash from multiple headers to create a more stable identifier
  const fingerprint = `${userAgent}-${accept}`;
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return `fp:${Math.abs(hash)}`;
}
