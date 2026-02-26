import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { 
  getComplaintById,
  assignComplaint,
  createNotification
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
    
    // Assign complaint
    assignComplaint(complaintId, user_id);
    
    // Notify user
    createNotification(
      user_id,
      complaintId,
      'assignment',
      `تم تكليفك بالشكوى #${complaintId}`
    );
    
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
