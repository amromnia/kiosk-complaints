import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { 
  getAllComplaints, 
  getUserComplaints 
} from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    
    const filters = {
      status: searchParams.get('status') || undefined,
      assigned_user_id: searchParams.get('assigned_user_id') ? parseInt(searchParams.get('assigned_user_id')!) : undefined,
      complaint_type_id: searchParams.get('complaint_type_id') ? parseInt(searchParams.get('complaint_type_id')!) : undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
    };
    
    let complaints;
    
    if (session.role === 'admin' || session.role === 'superadmin') {
      complaints = getAllComplaints(filters);
    } else {
      // Users can only see their assigned complaints
      complaints = getUserComplaints(session.id);
    }
    
    return NextResponse.json({ complaints });
  } catch (error: any) {
    console.error('Get complaints error:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ' },
      { status: 500 }
    );
  }
}
