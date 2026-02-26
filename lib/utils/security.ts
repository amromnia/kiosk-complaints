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
  // Remove potentially dangerous characters
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

export function validateFileType(filename: string, allowedTypes: string[]): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? allowedTypes.includes(ext) : false;
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
