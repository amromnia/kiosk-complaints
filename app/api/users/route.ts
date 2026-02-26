import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { getAllUsers } from '@/lib/db/queries';

export async function GET() {
  try {
    await requireAdmin();
    const users = getAllUsers();
    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ' },
      { status: 500 }
    );
  }
}
