import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { requireAdmin } from '@/lib/auth/session';
import { getAllKiosks, createKiosk } from '@/lib/db/queries';

export async function GET() {
  try {
    const kiosks = getAllKiosks();
    return NextResponse.json({ kiosks });
  } catch (error) {
    console.error('Get kiosks error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const { location } = await request.json();
    if (!location?.trim()) return NextResponse.json({ error: 'الموقع مطلوب' }, { status: 400 });
    const uniqueLink = nanoid(12);
    const result = createKiosk(uniqueLink, location.trim());
    return NextResponse.json({ success: true, id: result.lastInsertRowid, uniqueLink });
  } catch (error: any) {
    console.error('Create kiosk error:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ' }, { status: 500 });
  }
}
