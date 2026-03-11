import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { 
  getComplaintById,
  getComplaintComments,
  createCommentWithNotification
} from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const complaintId = parseInt(id);

    const complaint: any = getComplaintById(complaintId);
    if (!complaint) {
      return NextResponse.json({ error: 'الشكوى غير موجودة' }, { status: 404 });
    }

    // Users can only access comments on their assigned complaints
    if (session.role === 'user' && complaint.assigned_user_id !== session.id) {
      return NextResponse.json({ error: 'غير مصرح لك' }, { status: 403 });
    }

    const allComments = getComplaintComments(complaintId);
    // Strip internal comments from user role responses
    const comments = session.role === 'user'
      ? allComments.filter((c: any) => !c.is_internal)
      : allComments;

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const { comment_text, is_internal } = await request.json();
    const complaintId = parseInt(id);
    
    if (!comment_text) {
      return NextResponse.json(
        { error: 'نص التعليق مطلوب' },
        { status: 400 }
      );
    }
    
    const complaint: any = getComplaintById(complaintId);
    
    if (!complaint) {
      return NextResponse.json(
        { error: 'الشكوى غير موجودة' },
        { status: 404 }
      );
    }
    
    // Check permissions
    if (session.role === 'user' && complaint.assigned_user_id !== session.id) {
      return NextResponse.json(
        { error: 'غير مصرح لك بالتعليق على هذه الشكوى' },
        { status: 403 }
      );
    }
    
    // Create comment with notification in a transaction
    createCommentWithNotification({
      complaintId,
      userId: session.id,
      commentText: comment_text,
      isInternal: !!is_internal,
      complaint
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'تم إضافة التعليق بنجاح'
    });
  } catch (error) {
    console.error('Add comment error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}
