import { NextRequest, NextResponse } from 'next/server';
import { clearSession, getSession } from '@/lib/auth/session';
import { validateCSRF } from '@/lib/utils/csrf';
import { logSecurityEvent, SecurityEventType, getRequestMetadata } from '@/lib/utils/security-logger';

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Validate CSRF
    const session = await getSession();
    if (!validateCSRF(request, session?.id)) {
      return NextResponse.json(
        { error: 'طلب غير صالح' },
        { status: 403 }
      );
    }
    
    // Log logout
    if (session) {
      const metadata = getRequestMetadata(request);
      logSecurityEvent({
        type: SecurityEventType.LOGOUT,
        userId: session.id,
        userEmail: session.email,
        success: true,
        timestamp: new Date().toISOString(),
        ...metadata,
      });
    }
    
    await clearSession();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تسجيل الخروج' },
      { status: 500 }
    );
  }
}
