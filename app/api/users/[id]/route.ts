import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { getUserById, updateUserStatus } from '@/lib/db/queries';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const userId = parseInt(id, 10);
    const existing = getUserById(userId) as any;
    if (!existing) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    const { status } = await request.json();
    if (!['active', 'inactive'].includes(status)) return NextResponse.json({ error: 'حالة غير صالحة' }, { status: 400 });
    updateUserStatus(userId, status);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ' }, { status: 500 });
  }
}
