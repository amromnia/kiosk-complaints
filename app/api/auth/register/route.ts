import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { 
  getRegistrationLink, 
  useRegistrationLink, 
  createUser,
  registerDevice
} from '@/lib/db/queries';
import { isTokenExpired, validatePasswordStrength } from '@/lib/utils/security';
import { logSecurityEvent, SecurityEventType, getRequestMetadata } from '@/lib/utils/security-logger';

export async function POST(request: NextRequest) {
  try {
    const { token, name, email, password } = await request.json();
    
    if (!token || !name || !email || !password) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      );
    }
    
    // SECURITY: Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.errors.join(', ') },
        { status: 400 }
      );
    }
    
    // Verify registration link
    const link: any = getRegistrationLink(token);
    
    if (!link) {
      return NextResponse.json(
        { error: 'رابط التسجيل غير صالح' },
        { status: 400 }
      );
    }
    
    if (link.is_used) {
      return NextResponse.json(
        { error: 'تم استخدام رابط التسجيل بالفعل' },
        { status: 400 }
      );
    }
    
    if (isTokenExpired(link.expires_at)) {
      return NextResponse.json(
        { error: 'انتهت صلاحية رابط التسجيل' },
        { status: 400 }
      );
    }
    
    // SECURITY: Generate device fingerprint server-side
    const userAgent = request.headers.get('user-agent') || '';
    const accept = request.headers.get('accept') || '';
    const deviceFingerprint = `${userAgent}-${accept}`;
    let hash = 0;
    for (let i = 0; i < deviceFingerprint.length; i++) {
      const char = deviceFingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const finalFingerprint = `device_${Math.abs(hash)}`;
    
    // Create user with role from registration link
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = createUser(name, email, hashedPassword, link.role || 'user');
    const userId = result.lastInsertRowid as number;
    
    // Mark registration link as used
    useRegistrationLink(token, userId, finalFingerprint);
    
    // Register device
    registerDevice(userId, finalFingerprint, token);
    
    // SECURITY: Log registration
    const metadata = getRequestMetadata(request);
    logSecurityEvent({
      type: SecurityEventType.REGISTRATION,
      userId,
      userEmail: email,
      userRole: link.role || 'user',
      success: true,
      timestamp: new Date().toISOString(),
      ...metadata,
    });
    
    return NextResponse.json({
      success: true,
      message: 'تم التسجيل بنجاح'
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مسجل بالفعل' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'حدث خطأ أثناء التسجيل' },
      { status: 500 }
    );
  }
}
