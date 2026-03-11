import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getComplaintsStats } from '@/lib/db/queries';

export async function GET() {
  try {
    const session = await requireAuth();
    if (session.role !== 'admin' && session.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const stats = getComplaintsStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Get complaints stats error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
