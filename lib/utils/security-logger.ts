/**
 * Security Event Logging Utility
 * SECURITY: Comprehensive logging for monitoring and audit trails
 */

export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  REGISTRATION = 'REGISTRATION',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  CSRF_VIOLATION = 'CSRF_VIOLATION',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  FILE_UPLOAD = 'FILE_UPLOAD',
  FILE_ACCESS = 'FILE_ACCESS',
  DATA_EXPORT = 'DATA_EXPORT',
  CONFIG_CHANGE = 'CONFIG_CHANGE',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
}

export interface SecurityEvent {
  type: SecurityEventType;
  userId?: number;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  details?: any;
  success: boolean;
  timestamp: string;
}

/**
 * Log security event
 */
export function logSecurityEvent(event: SecurityEvent): void {
  const logEntry = {
    timestamp: event.timestamp || new Date().toISOString(),
    level: event.success ? 'INFO' : 'WARN',
    eventType: event.type,
    userId: event.userId,
    userEmail: event.userEmail,
    userRole: event.userRole,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
    endpoint: event.endpoint,
    method: event.method,
    details: event.details,
    success: event.success,
  };

  // In production, this should write to a secure log file or SIEM
  console.log('[SECURITY]', JSON.stringify(logEntry));

  // For critical events, could also:
  // - Write to separate security log file
  // - Send to SIEM/log aggregation service
  // - Trigger alerts for administrators
  // - Store in database for audit trail
}

/**
 * Extract request metadata for logging
 */
export function getRequestMetadata(req: Request): { ipAddress: string; userAgent: string; endpoint: string; method: string } {
  const url = new URL(req.url);
  
  return {
    ipAddress: req.headers.get('x-real-ip') || 'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
    endpoint: url.pathname,
    method: req.method,
  };
}

/**
 * Log authentication attempt
 */
export function logAuthAttempt(
  email: string,
  success: boolean,
  req: Request,
  userId?: number,
  userRole?: string
): void {
  const metadata = getRequestMetadata(req);
  
  logSecurityEvent({
    type: success ? SecurityEventType.LOGIN_SUCCESS : SecurityEventType.LOGIN_FAILURE,
    userId,
    userEmail: email,
    userRole,
    success,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

/**
 * Log unauthorized access attempt
 */
export function logUnauthorizedAccess(
  userId: number | undefined,
  requiredRole: string,
  req: Request
): void {
  const metadata = getRequestMetadata(req);
  
  logSecurityEvent({
    type: SecurityEventType.UNAUTHORIZED_ACCESS,
    userId,
    success: false,
    details: { requiredRole },
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

/**
 * Log file upload
 */
export function logFileUpload(
  userId: number | undefined,
  filename: string,
  size: number,
  success: boolean,
  req: Request
): void {
  const metadata = getRequestMetadata(req);
  
  logSecurityEvent({
    type: SecurityEventType.FILE_UPLOAD,
    userId,
    success,
    details: { filename, size },
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

/**
 * Log CSRF violation
 */
export function logCSRFViolation(userId: number | undefined, req: Request): void {
  const metadata = getRequestMetadata(req);
  
  logSecurityEvent({
    type: SecurityEventType.CSRF_VIOLATION,
    userId,
    success: false,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}
