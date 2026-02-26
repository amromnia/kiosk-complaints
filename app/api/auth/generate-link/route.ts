import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { requireAdmin } from '@/lib/auth/session';
import { createRegistrationLink } from '@/lib/db/queries';
import { addMinutes } from '@/lib/utils/security';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    
    const token = nanoid(32);
    const expiresAt = addMinutes(new Date(), 10).toISOString();
    
    createRegistrationLink(token, expiresAt);
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const registrationUrl = `${baseUrl}/register/${token}`;
    
    return NextResponse.json({
      success: true,
      token,
      url: registrationUrl,
      expiresAt
    });
  } catch (error: any) {
    console.error('Generate registration link error:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء إنشاء رابط التسجيل' },
      { status: 500 }
    );
  }
}
