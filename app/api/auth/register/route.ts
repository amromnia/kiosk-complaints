import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { 
  getRegistrationLink, 
  useRegistrationLink, 
  createUser,
  registerDevice
} from '@/lib/db/queries';
import { isTokenExpired, generateDeviceFingerprint } from '@/lib/utils/security';

export async function POST(request: NextRequest) {
  try {
    const { token, name, email, password } = await request.json();
    
    if (!token || !name || !email || !password) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
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
    
    // Generate device fingerprint
    const deviceFingerprint = generateDeviceFingerprint(request.headers);
    
    // Create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = createUser(name, email, hashedPassword, 'user');
    const userId = result.lastInsertRowid as number;
    
    // Mark registration link as used
    useRegistrationLink(token, userId, deviceFingerprint);
    
    // Register device
    registerDevice(userId, deviceFingerprint, token);
    
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
