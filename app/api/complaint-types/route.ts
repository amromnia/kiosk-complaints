import { NextResponse } from 'next/server';
import { getAllComplaintTypes } from '@/lib/db/queries';

export async function GET() {
  try {
    const complaintTypes = getAllComplaintTypes();
    return NextResponse.json({ complaintTypes });
  } catch (error) {
    console.error('Get complaint types error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}
