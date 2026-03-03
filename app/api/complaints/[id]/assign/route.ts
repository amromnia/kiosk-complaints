import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { 
  getComplaintById,
  assignComplaintWithNotification
} from '@/lib/db/queries';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
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
    
    const session = await requireAdmin();
    const oldStatus = complaint.status;
    
    // Assign complaint with status history and notification in a transaction
    assignComplaintWithNotification({
      complaintId,
      userId: user_id,
      adminId: session.id,
      oldStatus
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'تم تكليف الشكوى بنجاح'
    });
  } catch (error: any) {
    console.error('Assign complaint error:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ' },
      { status: 500 }
    );
  }
}
