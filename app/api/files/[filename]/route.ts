import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { getSession } from '@/lib/auth/session';
import { getComplaintAttachments } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    // Verify user is authenticated (for security)
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }
    
    // Read file
    const filePath = path.join(process.cwd(), 'uploads', filename);
    const fileBuffer = await readFile(filePath);
    
    // Determine content type
    const ext = filename.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
    else if (ext === 'png') contentType = 'image/png';
    else if (ext === 'webp') contentType = 'image/webp';
    else if (ext === 'pdf') contentType = 'application/pdf';
    else if (ext === 'doc') contentType = 'application/msword';
    else if (ext === 'docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, max-age=3600'
      }
    });
  } catch (error: any) {
    console.error('File serve error:', error);
    
    if (error.code === 'ENOENT') {
      return NextResponse.json(
        { error: 'الملف غير موجود' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحميل الملف' },
      { status: 500 }
    );
  }
}
