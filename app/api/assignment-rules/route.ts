import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getAllAutoAssignmentRules, createAutoAssignmentRule, deleteAutoAssignmentRule } from '@/lib/db/queries';

// GET - Get all assignment rules
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    
    // Only admins and superadmins can view assignment rules
    if (session.role !== 'admin' && session.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const rules = getAllAutoAssignmentRules();
    return NextResponse.json({ rules });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Get assignment rules error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// POST - Create a new assignment rule
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    
    // Only admins and superadmins can create assignment rules
    if (session.role !== 'admin' && session.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { complaint_type_id, user_id } = body;

    if (!complaint_type_id || !user_id) {
      return NextResponse.json({ error: 'Complaint type and user are required' }, { status: 400 });
    }

    const result = createAutoAssignmentRule(complaint_type_id, user_id);
    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Handle unique constraint violation
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: 'هذا الموظف مُكلف بالفعل بهذا النوع من الشكاوى' }, { status: 400 });
    }
    console.error('Create assignment rule error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// DELETE - Delete an assignment rule
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth();
    
    // Only admins and superadmins can delete assignment rules
    if (session.role !== 'admin' && session.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Rule ID required' }, { status: 400 });
    }

    deleteAutoAssignmentRule(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Delete assignment rule error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
