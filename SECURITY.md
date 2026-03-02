# Security Guidelines

## Implemented Security Measures

### 1. Rate Limiting (Enterprise-Grade Implementation)

**Architecture Overview:**
The system uses a **Token Bucket algorithm** with Redis backend for distributed, horizontally-scalable rate limiting. It includes behavioral abuse detection and progressive delays for authentication attempts.

**Features:**
- ✅ **Token Bucket Algorithm** - Smooth rate limiting that refills tokens over time (prevents burst abuse)
- ✅ **Redis Backend** - Distributed rate limiting across multiple servers/instances
- ✅ **In-Memory Fallback** - Automatic fallback if Redis unavailable (development mode)
- ✅ **Endpoint Normalization** - Dynamic routes normalized (e.g., `/api/user/123` → `/api/user/:id`)
- ✅ **Account + IP Based** - Authenticated users tracked by user ID, others by IP
- ✅ **Behavioral Abuse Detection** - Detects bot patterns, rapid-fire requests, consistent timing
- ✅ **Progressive Auth Delays** - Exponential backoff for failed authentication attempts
- ✅ **Automatic Abuse Escalation** - Stricter limits applied to detected abusers (multiplier)

#### **Rate Limit Tiers**

**1. Authentication Endpoints** (Strictest)
- **5 tokens per 15 minutes** (refills at ~0.33 tokens/min)
- Applies to: `/api/auth/login`, `/api/auth/register`
- Progressive delay on failures: 0s → 1s → 2s → 4s → 8s → 16s → 30s (max)
- **Purpose**: Prevents brute force attacks and credential stuffing

**2. Mutation Endpoints** (Strict)
- **30 tokens per minute** (refills at 0.5 tokens/sec)
- Applies to: Submissions, uploads, assignments, status changes
- Examples: `/api/complaints/submit`, `/api/upload`, `/api/complaints/[id]/assign`
- **Purpose**: Prevents spam and data manipulation abuse

**3. Query Endpoints** (Moderate)
- **60 tokens per minute** (refills at 1 token/sec)
- Applies to: All `/api/*` routes not in other tiers
- Examples: `/api/complaints`, `/api/users`, `/api/kiosks`
- **Purpose**: Normal API usage protection

**4. Public Endpoints** (Lenient)
- **100 tokens per minute** (refills at ~1.67 tokens/sec)
- Applies to: Public complaint forms, static pages
- Examples: `/complaint/[kiosk]`, `/_next/*`
- **Purpose**: Allow legitimate public usage

#### **Abuse Detection**

The system automatically detects and responds to abusive patterns:

**1. Rapid-Fire Detection**
- Triggers when requests arrive < 50ms apart
- **Response**: 3x stricter rate limits for 1 hour

**2. Bot Pattern Detection**
- Detects suspiciously consistent request timing (stdDev < 10ms)
- **Response**: 5x stricter rate limits for 1 hour

**3. Multiple Abuse Violations**
- Tracks abuse incidents across all detection types
- **Response**: Progressive multiplier (2x + count, max 10x)

**4. Authentication Failures**
- Tracks failed login attempts per IP
- **Response**: 
  - Progressive delays (1s → 30s)
  - Also counts toward general abuse tracking

#### **Response Headers**

When rate limited, the following headers are returned:

```
X-RateLimit-Limit: 60           # Maximum tokens in bucket
X-RateLimit-Remaining: 0         # Remaining tokens
X-RateLimit-Reset: 1234567890    # Unix timestamp when bucket refills
Retry-After: 45                  # Seconds until next token available
X-RateLimit-Abuse: true          # (Optional) Abuse detected
```

#### **Implementation Details**

**Redis Store** (`lib/rate-limit/store.ts`):
- Atomic operations using Lua scripts
- TTL-based expiration (no manual cleanup needed)
- Graceful degradation on connection errors
- Token refill calculated on every request

**In-Memory Store** (Development Fallback):
- Same interface as Redis store
- Periodic cleanup (5 minutes)
- **Warning**: NOT suitable for production with multiple instances

**Endpoint Normalizer** (`lib/rate-limit/normalizer.ts`):
- Replaces UUIDs, nanoids, numeric IDs with `:id`
- Caches normalized paths (max 1000 entries)
- Query strings stripped
- Consistent rate limiting across dynamic routes

**Configuration**: Set `REDIS_URL` environment variable:
```bash
# Local Redis
REDIS_URL=redis://localhost:6379

# Redis with auth
REDIS_URL=redis://username:password@hostname:port
```

**Note**: If `REDIS_URL` is not set, system uses in-memory store (not recommended for production).

### 2. HTTP Security Headers

All security headers are configured in `next.config.ts` and automatically applied to all routes:

#### **X-Powered-By: (Removed)**
- Header disabled via `poweredByHeader: false`
- Prevents server fingerprinting
- Attackers cannot easily identify Next.js/Node.js stack

#### **X-Frame-Options: DENY**
- Prevents clickjacking attacks by blocking the page from being embedded in iframes
- No site can embed your application in an iframe

#### **Strict-Transport-Security** (HSTS)
- `max-age=31536000` - Forces HTTPS for 1 year
- `includeSubDomains` - Applies to all subdomains
- `preload` - Qualifies for browser HSTS preload list
- **Note**: Only effective when served over HTTPS

#### **X-Content-Type-Options: nosniff**
- Prevents MIME type sniffing
- Browsers will not try to guess content types
- Reduces XSS attack surface

#### **Referrer-Policy: strict-origin-when-cross-origin**
- Sends full referrer for same-origin requests
- Only sends origin for cross-origin requests
- Protects user privacy while maintaining analytics

#### **X-XSS-Protection: 1; mode=block**
- Enables XSS filter in older browsers
- Blocks page rendering if XSS attack detected

#### **Permissions-Policy**
- Disables unnecessary browser features:
  - Camera access disabled
  - Microphone access disabled
  - Geolocation disabled
  - FLoC/Interest-cohort disabled

#### **Content-Security-Policy** (CSP)
Restricts resource loading to prevent XSS attacks:
- `default-src 'self'` - Only load resources from same origin by default
- `script-src 'self' 'unsafe-inline' 'unsafe-eval'` - Scripts from same origin (unsafe-eval needed for Next.js)
- `style-src 'self' 'unsafe-inline'` - Styles from same origin + inline
- `img-src 'self' data: blob:` - Images from same origin + data URLs
- `frame-ancestors 'none'` - Cannot be embedded (redundant with X-Frame-Options)
- `form-action 'self'` - Forms can only submit to same origin

### 2. Authentication & Session Management

#### **JWT Tokens**
- Tokens expire after 24 hours
- Stored in HttpOnly cookies (not accessible via JavaScript)
- Signed with HS256 algorithm
- Secret key configurable via `JWT_SECRET` environment variable

#### **Cookie Security**
```typescript
{
  httpOnly: true,      // Not accessible via JavaScript
  secure: true,        // Only transmitted over HTTPS (production)
  sameSite: 'lax',     // CSRF protection
  maxAge: 86400,       // 24 hours
  path: '/',           // Available site-wide
}
```

#### **Password Security**
- Hashed with bcrypt (10 rounds)
- Minimum 8 characters enforced
- Passwords never stored in plain text
- Passwords excluded from API responses

### 3. Authorization & Access Control

#### **Role-Based Access Control (RBAC)**
Three roles with hierarchical permissions:
- **Superadmin**: Full system access, cannot be disabled
- **Admin**: Manage users and kiosks, can only manipulate regular users
- **User**: View and manage assigned complaints only

#### **Route Protection**
- `requireAuth()` - Validates session exists
- `requireAdmin()` - Requires admin or superadmin role
- All admin routes protected
- User-specific data filtered by role

#### **Permission Checks**
- Frontend: Buttons hidden when user lacks permission
- Backend: API routes validate permissions before actions
- Prevents privilege escalation attacks

### 4. Database Security

#### **SQL Injection Prevention**
- All queries use parameterized statements
- No raw SQL string concatenation
- Better-sqlite3 prepared statements used throughout

#### **Data Validation**
- Input validation on all API routes
- Type checking with TypeScript
- String trimming and sanitization

### 5. Input Validation & Sanitization

#### **Server-Side Validation**
- All API endpoints validate input
- Email format validation
- Phone number format (Egyptian)
- National ID format (14 digits)
- File upload validation (type, size)

#### **Pagination Limits**
- Maximum page size: 100 items
- Prevents resource exhaustion attacks
- `Math.min(pageSize || 20, 100)` enforced on all queries

### 6. File Upload Security

#### **Upload Restrictions**
- File type validation (images only for complaints)
- File size limits enforced
- Uploaded by field tracked (client/user/admin)
- Files stored outside public root

#### **File Serving**
- Served through API route (`/api/files/[filename]`)
- Access control can be implemented per file
- Prevents directory traversal attacks

---

## Additional Security Recommendations

### For Production Deployment:

#### 1. **Environment Variables**
```bash
# Generate strong JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Set in production environment
JWT_SECRET=<generated-secret-here>
NODE_ENV=production
```

#### 2. **HTTPS Configuration**
- Deploy behind reverse proxy (Nginx/Apache)
- Obtain SSL/TLS certificate (Let's Encrypt)
- Redirect all HTTP traffic to HTTPS
- Enable HTTP/2

#### 3. **Rate Limiting** ✅ IMPLEMENTED
Application-wide rate limiting is now active via Next.js middleware.

**Current Configuration:**
- Login: 5 requests / 15 minutes
- Register: 3 requests / hour
- Complaint submission: 10 requests / hour
- General API: 60 requests / minute
- Public pages: 30-100 requests / minute

**To Adjust Limits:**
Edit the `rateLimits` object in `middleware.ts`:
```typescript
const rateLimits: Record<string, RateLimitConfig> = {
  '/api/auth/login': { maxRequests: 5, windowMs: 15 * 60 * 1000 },
  // Add or modify limits as needed
};
```

**Monitoring Rate Limits:**
Check response headers on any request:
- `X-RateLimit-Limit` - Your limit
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Reset time

**Production Considerations:**
- Current implementation uses in-memory storage
- For multi-server deployments, consider Redis or similar distributed cache
- Memory cleanup runs every 10 minutes automatically
- Rate limits are per-IP address, supports reverse proxy headers

#### 4. **Database Backups**
- Automated daily backups
- Store backups securely offsite
- Test restore procedures regularly
- Encrypt backup files

#### 5. **Logging & Monitoring**
- Log authentication attempts
- Monitor failed login attempts
- Alert on suspicious activity
- Audit trail for admin actions
- Monitor rate limit violations

#### 6. **Security Audits**
- Regular dependency updates (`npm audit`)
- Periodic penetration testing
- Code review for security issues
- OWASP Top 10 compliance check

#### 7. **Additional Headers** (Optional)
If serving through reverse proxy, add:
```nginx
# Nginx example
add_header X-Permitted-Cross-Domain-Policies "none";
add_header X-Download-Options "noopen";
```

#### 8. **Session Management**
- Implement session invalidation on logout
- Detect concurrent sessions
- Auto-logout after inactivity
- Refresh token mechanism for long sessions

#### 9. **API Security**
- Implement request signing for sensitive operations
- Add CORS configuration if needed
- Version your API endpoints
- Document all endpoints

#### 10. **User Registration**
- Email verification for new users
- Captcha on registration page
- Track registration link usage
- Expire registration links appropriately

---

## Security Checklist for Deployment

- [ ] Set strong `JWT_SECRET` in production environment
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure firewall to allow only necessary ports
- [ ] Disable development tools in production
- [ ] Set `NODE_ENV=production`
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Review and update dependencies
- [ ] Set up automated backups
- [ ] Configure monitoring and alerting
- [ ] Test disaster recovery procedures
- [ ] Document incident response plan
- [ ] Change default superadmin password immediately after setup
- [ ] Restrict database access to application only
- [ ] Enable database query logging
- [ ] Set up log rotation and retention
- [ ] Review file permissions on server
- [ ] Disable directory listing
- [ ] Remove test/development files from production
- [ ] Implement fail2ban or similar for brute force protection

---

## Common Vulnerabilities Addressed

### ✅ **OWASP Top 10 Coverage:**

1. **Broken Access Control** - Role-based permissions enforced
2. **Cryptographic Failures** - Bcrypt for passwords, HTTPS for transmission
3. **Injection** - Parameterized queries, input validation
4. **Insecure Design** - Security headers, secure cookies, CSP
5. **Security Misconfiguration** - Secure defaults, headers configured
6. **Vulnerable Components** - Regular updates recommended
7. **Authentication Failures** - Session management, password policies
8. **Data Integrity Failures** - Signed JWTs, validation checks
9. **Logging Failures** - Error logging implemented
10. **SSRF** - Input validation, no external requests from user input

---

## Incident Response

If a security incident is detected:

1. **Immediate Actions**
   - Isolate affected systems
   - Change all passwords and secrets
   - Invalidate all sessions
   - Enable maintenance mode

2. **Investigation**
   - Review logs for suspicious activity
   - Identify breach scope
   - Document all findings
   - Preserve evidence

3. **Remediation**
   - Patch vulnerabilities
   - Update security measures
   - Test fixes thoroughly
   - Deploy updates

4. **Communication**
   - Notify affected users
   - Report to authorities if required
   - Document incident response
   - Update security policies

---

## Support & Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Security Headers Analyzer](https://securityheaders.com/)
