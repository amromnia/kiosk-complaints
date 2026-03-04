import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { requireAdmin } from '@/lib/auth/session';
import { createKiosk, getKiosksPaginated } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    
    const { searchParams } = new URL(request.url);
    
    const filters = {
      search: searchParams.get('search') || undefined,
      is_disabled: searchParams.get('is_disabled') ? searchParams.get('is_disabled') === 'true' : undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 20,
    };
    
    const result = getKiosksPaginated(filters);
    return NextResponse.json(result);
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
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
