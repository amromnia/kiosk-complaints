import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { 
  getComplaintById,
  assignComplaintWithNotification
} from '@/lib/db/queries';
import { validateCSRF } from '@/lib/utils/csrf';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    
    // SECURITY: Validate CSRF
    if (!validateCSRF(request, session.id)) {
      return NextResponse.json(
        { error: 'طلب غير صالح' },
        { status: 403 }
      );
    }
    
    const { id } = await params;
    const { user_id } = await request.json();
    const complaintId = parseInt(id);
    
    if (!user_id) {
      return NextResponse.json(
        { error: 'معرف الموظف مطلوب' },
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
    
    const oldStatus = complaint.status;
    
    // Assign complaint with status history and notification in a transaction
    assignComplaintWithNotification({
      complaintId,
      userId: user_id,
      adminId: session.id,
      oldStatus,
      complaint
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'تم تكليف الشكوى بنجاح'
    });
  } catch (error: any) {
    console.error('Assign complaint error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}
