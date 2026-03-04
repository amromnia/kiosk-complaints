import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getUserById } from '@/lib/db/queries';
import db from '@/lib/db/schema';
import bcrypt from 'bcryptjs';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const { newPassword } = await request.json();
    const targetUserId = parseInt(id);

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' },
        { status: 400 }
      );
    }

    const targetUser: any = getUserById(targetUserId);

    if (!targetUser) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // Permission checks
    if (session.id === targetUserId) {
      // User resetting their own password - allowed for all
    } else if (session.role === 'superadmin') {
      // Superadmin can reset admin and user passwords, but not other superadmins
      if (targetUser.role === 'superadmin') {
        return NextResponse.json(
          { error: 'لا يمكن إعادة تعيين كلمة مرور مدير أعلى آخر' },
          { status: 403 }
        );
      }
    } else if (session.role === 'admin') {
      // Admin can reset users' passwords only, not other admins/superadmins
      if (targetUser.role !== 'user') {
        return NextResponse.json(
          { error: 'المسؤولون يمكنهم فقط إعادة تعيين كلمات مرور الموظفين العاديين' },
          { status: 403 }
        );
      }
    } else {
      // Regular users can only reset their own password
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 403 }
      );
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, targetUserId);

    return NextResponse.json({
      success: true,
      message: 'تم إعادة تعيين كلمة المرور بنجاح'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}
