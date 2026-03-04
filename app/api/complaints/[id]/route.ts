import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { 
  getComplaintById, 
  getComplaintAttachments,
  getComplaintComments,
  getComplaintStatusHistory
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
      return NextResponse.json(
        { error: 'الشكوى غير موجودة' },
        { status: 404 }
      );
    }
    
    // Check permissions
    if (session.role === 'user' && complaint.assigned_user_id !== session.id) {
      return NextResponse.json(
        { error: 'غير مصرح لك بعرض هذه الشكوى' },
        { status: 403 }
      );
    }
    
    const attachments = getComplaintAttachments(complaintId);
    const comments = getComplaintComments(complaintId);
    const history = getComplaintStatusHistory(complaintId);
    
    return NextResponse.json({
      complaint,
      attachments,
      comments,
      history
    });
  } catch (error) {
    console.error('Get complaint error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}
