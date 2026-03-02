import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { 
  getComplaintById,
  getComplaintComments,
  createComment,
  createNotification
} from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const comments = getComplaintComments(parseInt(id));
    return NextResponse.json({ comments });
  } catch (error: any) {
    console.error('Get comments error:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ' }, { status: 500 });
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
    
    // Create comment
    createComment(complaintId, session.id, comment_text, !!is_internal);
    
    // Notify relevant users
    if (complaint.assigned_user_id && complaint.assigned_user_id !== session.id) {
      createNotification(
        complaint.assigned_user_id,
        complaintId,
        'comment',
        `تعليق جديد على الشكوى #${complaintId}`
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'تم إضافة التعليق بنجاح'
    });
  } catch (error: any) {
    console.error('Add comment error:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ' },
      { status: 500 }
    );
  }
}
