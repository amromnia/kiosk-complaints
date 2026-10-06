import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getEmployeeAnalytics, getKioskAnalytics } from '@/lib/db/analytics';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const isAdmin = session.role === 'admin' || session.role === 'superadmin';
    const section = request.nextUrl.searchParams.get('section') || (isAdmin ? 'kiosks' : 'employees');
    if (section !== 'kiosks' && section !== 'employees') {
      return NextResponse.json({ error: 'Invalid analytics section' }, { status: 400 });
    }
    if (section === 'kiosks' && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const employeeParam = request.nextUrl.searchParams.get('employee_id');
    const employeeId = employeeParam === null ? undefined : Number(employeeParam);
    if (employeeId !== undefined && (!Number.isSafeInteger(employeeId) || employeeId < 1)) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }
    return NextResponse.json({
      employees: section === 'employees' ? getEmployeeAnalytics(isAdmin ? employeeId : session.id) : [],
      kiosks: section === 'kiosks' ? getKioskAnalytics() : [],
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Get complaint analytics error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
