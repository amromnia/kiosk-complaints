import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { 
  getComplaintById,
  updateComplaintStatusWithHistory
} from '@/lib/db/queries';
import { isValidStatusTransition, getStatusTransitionError } from '@/lib/utils/status-workflow';
import { validateCSRF } from '@/lib/utils/csrf';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    
    // SECURITY: Validate CSRF
    if (!validateCSRF(request, session.id)) {
      return NextResponse.json(
        { error: 'طلب غير صالح' },
        { status: 403 }
      );
    }
    
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
    
    // Validate status transition
    if (!isValidStatusTransition(oldStatus, status)) {
      return NextResponse.json(
        { error: getStatusTransitionError(oldStatus, status) },
        { status: 400 }
      );
    }
    
    // Update status with history and notifications in a transaction
    updateComplaintStatusWithHistory({
      complaintId,
      userId: session.id,
      oldStatus,
      newStatus: status,
      description,
      complaint
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'تم تحديث الحالة بنجاح'
    });
  } catch (error: any) {
    console.error('Update status error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}
