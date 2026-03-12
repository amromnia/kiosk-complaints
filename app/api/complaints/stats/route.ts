import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getComplaintsStats, getUserComplaintsStats } from '@/lib/db/queries';

export async function GET() {
  try {
    const session = await requireAuth();

    if (session.role === 'admin' || session.role === 'superadmin') {
      const stats = getComplaintsStats();
      return NextResponse.json(stats);
    }

    // Regular users get stats scoped to their own assigned complaints
    const stats = getUserComplaintsStats(session.id);
    return NextResponse.json(stats);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Get complaints stats error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
