import { NextResponse } from 'next/server';
import { getAllKiosks } from '@/lib/db/queries';

export async function GET() {
  try {
    const kiosks = getAllKiosks();
    return NextResponse.json({ kiosks });
  } catch (error) {
    console.error('Get kiosks error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}
