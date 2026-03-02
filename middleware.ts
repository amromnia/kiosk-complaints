import { NextRequest, NextResponse } from 'next/server';
import { getRateLimiter } from './lib/rate-limit';
import { verifyToken } from './lib/auth/jwt';

/**
 * Enterprise-grade Rate Limiting Middleware
 * - Token Bucket algorithm (prevents burst abuse)
 * - Redis-backed with in-memory fallback
 * - Behavioral abuse detection
 * - Progressive delays for authentication
 * - Account + IP based limits
 * - Endpoint normalization (dynamic routes)
 */

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip rate limiting for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  try {
    const rateLimiter = getRateLimiter();

    // Get user ID if authenticated (for account-based limits)
    let userId: string | undefined;
    try {
      const token = request.cookies.get('session')?.value;
      if (token) {
        const session = await verifyToken(token);
        if (session) {
          userId = String(session.id);
        }
      }
    } catch {
      // Not authenticated, will use IP-based limits
    }

    // Special handling for authentication endpoints
    if (pathname.includes('/auth/login') || pathname.includes('/auth/register')) {
      const forwarded = request.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
      const identifier = `ip:${ip}`;

      const result = await rateLimiter.checkAuthLimit(request, identifier);

      // Apply progressive delay if needed
      if (result.delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, result.delay));
      }

      if (!result.allowed) {
        const response = NextResponse.json(
          {
            error: 'تم تجاوز الحد المسموح من محاولات تسجيل الدخول. يرجى الانتظار.',
            error_en: 'Too many authentication attempts. Please wait.',
          },
          { status: 429 }
        );

        // Copy rate limit headers
        result.headers.forEach((value, key) => {
          response.headers.set(key, value);
        });

        return response;
      }

      // Continue with request (will check result on response)
      const response = NextResponse.next();
      result.headers.forEach((value, key) => {
        response.headers.set(key, value);
      });
      
      return response;
    }

    // Normal rate limit check
    const result = await rateLimiter.checkLimit(request, userId);

    if (!result.allowed) {
      const response = NextResponse.json(
        {
          error: 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.',
          error_en: 'Too many requests. Please try again later.',
        },
        { status: 429 }
      );

      // Copy rate limit headers
      result.headers.forEach((value, key) => {
        response.headers.set(key, value);
      });

      return response;
    }

    // Request allowed, add rate limit headers
    const response = NextResponse.next();
    result.headers.forEach((value, key) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    // On error, allow the request but log the issue
    console.error('[Middleware] Rate limit error:', error);
    return NextResponse.next();
  }
}

// Configure which routes the middleware should run on
export const config = {
  // Use Node.js runtime to support ioredis, fs, and other Node.js APIs
  runtime: 'nodejs',
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
