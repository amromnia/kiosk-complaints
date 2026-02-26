import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { 
  getComplaintById,
  updateComplaintStatus, 
  createStatusHistory,
  createNotification
} from '@/lib/db/queries';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const { status, description } = await request.json();
    const complaintId = parseInt(id);
    
    if (!status || !description) {
      return NextResponse.json(
        { error: 'الحالة والوصف مطلوبان' },
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
        { error: 'غير مصرح لك بتعديل هذه الشكوى' },
        { status: 403 }
      );
    }
    
    const oldStatus = complaint.status;
    
    // Update status
    updateComplaintStatus(complaintId, status);
    
    // Create history record
    createStatusHistory(complaintId, session.id, oldStatus, status, description);
    
    // Notify assigned user if admin changed status
    if (complaint.assigned_user_id && session.role === 'admin') {
      createNotification(
        complaint.assigned_user_id,
        complaintId,
        'status_change',
        `تم تغيير حالة الشكوى #${complaintId} إلى ${status}`
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'تم تحديث الحالة بنجاح'
    });
  } catch (error: any) {
    console.error('Update status error:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ' },
      { status: 500 }
    );
  }
}
