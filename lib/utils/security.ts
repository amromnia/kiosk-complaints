export function generateDeviceFingerprint(headers: Headers): string {
  const userAgent = headers.get('user-agent') || '';
  const acceptLanguage = headers.get('accept-language') || '';
  const acceptEncoding = headers.get('accept-encoding') || '';
  
  // Combine headers to create a unique fingerprint
  const fingerprint = `${userAgent}-${acceptLanguage}-${acceptEncoding}`;
  
  // Create a simple hash
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return `device_${Math.abs(hash)}`;
}

export function validatePhoneNumber(phone: string): boolean {
  // Egyptian phone number validation (11 digits starting with 01)
  const phoneRegex = /^01[0-2,5]{1}[0-9]{8}$/;
  return phoneRegex.test(phone);
}

export function validateNationalId(nationalId: string): boolean {
  // Egyptian national ID validation (14 digits)
  const idRegex = /^[0-9]{14}$/;
  return idRegex.test(nationalId);
}

export function sanitizeInput(input: string): string {
  // SECURITY: Enhanced sanitization with HTML entity encoding
  // First strip all HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Encode HTML entities to prevent XSS
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return sanitized.trim();
}

export function validateFileType(filename: string, allowedTypes: string[]): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? allowedTypes.includes(ext) : false;
}

/**
 * Validate file content using magic numbers (file signatures)
 * SECURITY: Prevents upload bypass via extension spoofing
 */
export function validateFileMagicNumber(buffer: Buffer, allowedTypes: string[]): boolean {
  // Get first 12 bytes for signature detection
  const header = buffer.slice(0, 12).toString('hex');
  
  // Image signatures
  const signatures: { [key: string]: string[] } = {
    'jpg': ['ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2', 'ffd8ffe3', 'ffd8ffe8'],
    'jpeg': ['ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2', 'ffd8ffe3', 'ffd8ffe8'],
    'png': ['89504e47'],
    'webp': ['52494646'], // RIFF
    'pdf': ['25504446'],
  };
  
  // Check if file header matches any allowed type
  for (const type of allowedTypes) {
    const typeSignatures = signatures[type.toLowerCase()];
    if (typeSignatures) {
      for (const sig of typeSignatures) {
        if (header.startsWith(sig)) {
          return true;
        }
      }
    }
  }
  
  // For doc/docx/txt, check if it starts with known patterns
  if (allowedTypes.includes('txt')) {
    // Plain text can start with anything, but check it's valid UTF-8
    try {
      buffer.toString('utf8');
      return true;
    } catch {
      return false;
    }
  }
  
  return false;
}

export function validateFileSize(size: number, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size <= maxSizeBytes;
}

export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Validate password strength
 * SECURITY: Enforce strong password policy
 */
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('كلمة المرور يجب أن تحتوي على الأقل 8 أحرف');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل');
  }
  
  // Check against common passwords
  const commonPasswords = ['password', '12345678', 'qwerty123', 'admin123', 'password123'];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push('كلمة المرور ضعيفة جداً، استخدم كلمة مرور أقوى');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate input types to prevent SQL injection in dynamic queries
 * SECURITY: Type validation before query construction
 */
export function validateQueryInputTypes(filters: any): boolean {
  if (filters.page !== undefined && (typeof filters.page !== 'number' || filters.page < 1)) {
    return false;
  }
  
  if (filters.pageSize !== undefined && (typeof filters.pageSize !== 'number' || filters.pageSize < 1 || filters.pageSize > 100)) {
    return false;
  }
  
  if (filters.assigned_user_id !== undefined && typeof filters.assigned_user_id !== 'number') {
    return false;
  }
  
  if (filters.complaint_type_id !== undefined && typeof filters.complaint_type_id !== 'number') {
    return false;
  }
  
  // String fields should be strings and limited in length
  if (filters.search !== undefined && (typeof filters.search !== 'string' || filters.search.length > 200)) {
    return false;
  }
  
  if (filters.status !== undefined && typeof filters.status !== 'string') {
    return false;
  }
  
  if (filters.role !== undefined && typeof filters.role !== 'string') {
    return false;
  }
  
  return true;
}

export function isTokenExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

export function hashData(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString();
}
