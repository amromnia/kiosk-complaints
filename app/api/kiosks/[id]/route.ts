import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { getKioskById, updateKiosk, toggleKioskStatus } from '@/lib/db/queries';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const kioskId = parseInt(id, 10);
    const existing = getKioskById(kioskId);
    if (!existing) return NextResponse.json({ error: 'الماكينة غير موجودة' }, { status: 404 });
    const { location } = await request.json();
    if (!location?.trim()) return NextResponse.json({ error: 'الموقع مطلوب' }, { status: 400 });
    updateKiosk(kioskId, location.trim());
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update kiosk error:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const kioskId = parseInt(id, 10);
    const existing: any = getKioskById(kioskId);
    if (!existing) return NextResponse.json({ error: 'الماكينة غير موجودة' }, { status: 404 });
    
    const { is_disabled } = await request.json();
    if (typeof is_disabled !== 'boolean') {
      return NextResponse.json({ error: 'حالة غير صالحة' }, { status: 400 });
    }
    
    toggleKioskStatus(kioskId, is_disabled);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Toggle kiosk status error:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ' }, { status: 500 });
  }
}
