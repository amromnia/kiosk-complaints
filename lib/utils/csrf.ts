/**
 * CSRF Protection Utility
 * SECURITY: Protect against Cross-Site Request Forgery attacks
 * 
 * Uses multiple strategies:
 * 1. Origin/Referer header validation
 * 2. Custom header validation (X-Requested-With)
 * 3. SameSite cookie attribute (already in place)
 */

import { NextRequest } from 'next/server';
import { logCSRFViolation } from './security-logger';

/**
 * Validate CSRF protection for state-changing requests
 * SECURITY: Prevents CSRF attacks by validating request origin
 */
export function validateCSRF(req: NextRequest, userId?: number): boolean {
  // Only check for state-changing methods
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return true; // Safe methods don't need CSRF protection
  }

  // Strategy 1: Check for custom header (AJAX requests always send this)
  const requestedWith = req.headers.get('x-requested-with');
  if (requestedWith === 'XMLHttpRequest') {
    return true; // Valid fetch/AJAX request
  }

  // Strategy 2: Validate Origin/Referer headers
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const host = req.headers.get('host');

  // Get expected origins
  const expectedOrigins = [
    `http://${host}`,
    `https://${host}`,
    process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:3000`,
  ];

  // Check origin header (most reliable for POST requests)
  if (origin) {
    const isValidOrigin = expectedOrigins.some(expectedOrigin => 
      origin === expectedOrigin || origin.startsWith(expectedOrigin)
    );
    
    if (isValidOrigin) {
      return true;
    }
  }

  // Fallback: Check referer header
  if (referer) {
    const isValidReferer = expectedOrigins.some(expectedOrigin => 
      referer.startsWith(expectedOrigin)
    );
    
    if (isValidReferer) {
      return true;
    }
  }

  // If we get here, it's a potential CSRF attack
  logCSRFViolation(userId, req);
  return false;
}

/**
 * Create CSRF-safe response headers
 */
export function getCSRFHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'same-origin',
  };
}
