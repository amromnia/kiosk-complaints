import { NextResponse } from 'next/server';
import { getAllComplaintTypes } from '@/lib/db/queries';

export async function GET() {
  try {
    const types = getAllComplaintTypes();
    return NextResponse.json({ types });
  } catch (error) {
    console.error('Get complaint types error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}
