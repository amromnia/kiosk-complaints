import { NextRequest, NextResponse } from 'next/server';
import { getSystemSetting, setSystemSetting } from '@/lib/db/queries';
import { requireAdmin } from '@/lib/auth/session';

// GET - Get auto-assignment status
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const enabled = getSystemSetting('auto_assignment_enabled') === 'true';

    return NextResponse.json({ enabled });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error getting auto-assignment setting:', error);
    return NextResponse.json({ error: 'Failed to get setting' }, { status: 500 });
  }
}

// POST - Toggle auto-assignment
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    setSystemSetting('auto_assignment_enabled', enabled ? 'true' : 'false');

    return NextResponse.json({ 
      success: true, 
      enabled,
      message: enabled ? 'تم تفعيل التكليف التلقائي' : 'تم تعطيل التكليف التلقائي'
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error toggling auto-assignment:', error);
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
  }
}
