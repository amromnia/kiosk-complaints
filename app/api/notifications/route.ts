import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getUserNotifications, deleteNotification, getUnreadNotificationCount, deleteAllUserNotifications } from '@/lib/db/queries';

// GET - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const countOnly = searchParams.get('countOnly') === 'true';

    if (countOnly) {
      const count = getUnreadNotificationCount(session.id);
      return NextResponse.json({ count });
    }

    const notifications = getUserNotifications(session.id, unreadOnly);
    return NextResponse.json({ notifications });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Get notifications error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// DELETE - Delete a notification (mark as read)
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const deleteAll = searchParams.get('all') === 'true';

    if (deleteAll) {
      deleteAllUserNotifications(session.id);
      return NextResponse.json({ success: true, message: 'تم حذف جميع الإشعارات' });
    }

    if (!id) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

    // Verify the notification belongs to the user
    const notifications = getUserNotifications(session.id, false);
    const notification = notifications.find((n: any) => n.id === parseInt(id));

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    deleteNotification(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Delete notification error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
