import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { getUserById, updateUserStatus, getUserStats } from '@/lib/db/queries';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const userId = parseInt(id, 10);
    const user = getUserById(userId) as any;
    
    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }
    
    // Remove password from response
    delete user.password;
    
    // Get user stats
    const stats = getUserStats(userId);
    
    return NextResponse.json({ success: true, user, stats });
  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const userId = parseInt(id, 10);
    
    const targetUser = getUserById(userId) as any;
    if (!targetUser) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }
    
    const { status } = await request.json();
    if (!['active', 'inactive'].includes(status)) {
      return NextResponse.json({ error: 'حالة غير صالحة' }, { status: 400 });
    }
    
    // Check permissions based on role hierarchy
    const currentUserRole = session.role;
    const targetUserRole = targetUser.role;
    
    // Superadmin cannot be disabled
    if (targetUserRole === 'superadmin') {
      return NextResponse.json({ error: 'لا يمكن تعطيل حساب المدير الأعلى' }, { status: 403 });
    }
    
    // Admin can only toggle regular users
    if (currentUserRole === 'admin' && targetUserRole !== 'user') {
      return NextResponse.json({ error: 'ليس لديك صلاحية لتعديل هذا المستخدم' }, { status: 403 });
    }
    
    updateUserStatus(userId, status);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ' }, { status: 500 });
  }
}
