import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { 
  getAllComplaints, 
  getUserComplaints,
  getComplaintsPaginated
} from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    
    const filters = {
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      assigned_user_id: searchParams.get('assigned_user_id') ? parseInt(searchParams.get('assigned_user_id')!) : undefined,
      complaint_type_id: searchParams.get('complaint_type_id') ? parseInt(searchParams.get('complaint_type_id')!) : undefined,
      kiosk_id: searchParams.get('kiosk_id') ? parseInt(searchParams.get('kiosk_id')!) : undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 20,
    };
    
    let result;
    
    if (session.role === 'admin' || session.role === 'superadmin') {
      result = getComplaintsPaginated(filters);
    } else {
      // Users can only see their assigned complaints
      const complaints = getUserComplaints(session.id);
      result = {
        complaints,
        total: complaints.length,
        page: 1,
        pageSize: complaints.length,
        totalPages: 1,
      };
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Get complaints error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}
