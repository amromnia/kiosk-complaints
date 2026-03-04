import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, setSession } from '@/lib/auth/session';
import { getRateLimiter } from '@/lib/rate-limit';
import { logAuthAttempt } from '@/lib/utils/security-logger';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبة' },
        { status: 400 }
      );
    }
    
    const user = await authenticateUser(email, password);
    
    if (!user) {
      // Record auth failure for progressive delays
      const identifier = `email:${email}`;
      
      const rateLimiter = getRateLimiter();
      await rateLimiter.recordAuthFailure(identifier);
      
      // SECURITY: Log failed login attempt
      logAuthAttempt(email, false, request);
      
      return NextResponse.json(
        { error: 'بيانات الدخول غير صحيحة' },
        { status: 401 }
      );
    }
    
    await setSession(user);
    
    // SECURITY: Log successful login
    logAuthAttempt(email, true, request, user.id, user.role);
    
    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تسجيل الدخول' },
      { status: 500 }
    );
  }
}
