import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { getSession } from '@/lib/auth/session';
import db from '@/lib/db/schema';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    // Verify user is authenticated
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }
    
    // Extract just the filename without path separators
    const cleanFilename = path.basename(filename);
    
    // Check if user has permission to access this file
    // Find which complaint this attachment belongs to
    const attachment = db.prepare(`
      SELECT a.*, c.assigned_user_id 
      FROM attachments a
      JOIN complaints c ON a.complaint_id = c.id
      WHERE a.file_path LIKE ?
    `).get(`%${cleanFilename}%`) as any;
    
    if (!attachment) {
      return NextResponse.json(
        { error: 'الملف غير موجود' },
        { status: 404 }
      );
    }
    
    // Authorization check:
    // - Admins can access all files
    // - Users can only access files for complaints assigned to them
    if (session.role !== 'admin' && attachment.assigned_user_id !== session.id) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول لهذا الملف' },
        { status: 403 }
      );
    }
    
    // Read file
    const filePath = path.join(process.cwd(), 'uploads', cleanFilename);
    const fileBuffer = await readFile(filePath);
    
    // Determine content type
    const ext = cleanFilename.split('.').pop()?.toLowerCase();
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
        'Content-Disposition': `inline; filename="${cleanFilename}"`,
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
