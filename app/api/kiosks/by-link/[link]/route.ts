import { NextRequest, NextResponse } from 'next/server';
import { getKioskByLink } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ link: string }> }
) {
  try {
    const { link } = await params;
    const kiosk = getKioskByLink(link) as any;
    
    if (!kiosk) {
      return NextResponse.json(
        { error: 'الماكينة غير موجودة' },
        { status: 404 }
      );
    }
    
    if (kiosk.is_disabled) {
      return NextResponse.json(
        { error: 'هذه الماكينة معطلة حالياً' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, kiosk });
  } catch (error: any) {
    console.error('Get kiosk by link error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}
