import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getSession } from '@/lib/auth/session';
import { createRegistrationLink } from '@/lib/db/queries';
import { addMinutes } from '@/lib/utils/security';
import { validateCSRF } from '@/lib/utils/csrf';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || (session.role !== 'superadmin' && session.role !== 'admin')) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 403 }
      );
    }

    // SECURITY: Validate CSRF
    if (!validateCSRF(request, session.id)) {
      return NextResponse.json(
        { error: 'طلب غير صالح' },
        { status: 403 }
      );
    }

    const { role = 'user' } = await request.json().catch(() => ({ role: 'user' }));

    // Validate role permissions
    if (session.role === 'admin') {
      // Admins can only create users and admins
      if (role === 'superadmin') {
        return NextResponse.json(
          { error: 'المسؤولون لا يمكنهم إنشاء مسؤولين رئيسيين' },
          { status: 403 }
        );
      }
    }
    // Superadmins can create any role

    const token = nanoid(32);
    const expiresAt = addMinutes(new Date(), 10).toISOString();
    
    createRegistrationLink(token, expiresAt, role);
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const registrationUrl = `${baseUrl}/register/${token}`;
    
    return NextResponse.json({
      success: true,
      token,
      url: registrationUrl,
      role,
      expiresAt
    });
  } catch (error: any) {
    console.error('Generate registration link error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء رابط التسجيل' },
      { status: 500 }
    );
  }
}
