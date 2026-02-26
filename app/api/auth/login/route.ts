import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, setSession } from '@/lib/auth/session';

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
      return NextResponse.json(
        { error: 'بيانات الدخول غير صحيحة' },
        { status: 401 }
      );
    }
    
    await setSession(user);
    
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
