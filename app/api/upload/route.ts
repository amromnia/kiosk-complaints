import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';
import { 
  validateFileType, 
  validateFileMagicNumber,
  validateFileSize, 
  sanitizeInput 
} from '@/lib/utils/security';
import { 
  ALLOWED_IMAGE_TYPES, 
  ALLOWED_DOCUMENT_TYPES, 
  MAX_FILE_SIZE_MB 
} from '@/lib/utils/constants';
import { logFileUpload } from '@/lib/utils/security-logger';
import { getSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  let userId: number | undefined;
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadedBy = formData.get('uploadedBy') as string || 'client';
    
    // Get user session if available (for logging)
    const session = await getSession();
    userId = session?.id;
    
    if (!file) {
      return NextResponse.json(
        { error: 'لم يتم تحديد ملف' },
        { status: 400 }
      );
    }
    
    // Determine allowed types based on uploader
    const allowedTypes = uploadedBy === 'client' 
      ? ALLOWED_IMAGE_TYPES 
      : [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];
    
    // Validate file type by extension
    if (!validateFileType(file.name, allowedTypes)) {
      logFileUpload(userId, file.name, file.size, false, request);
      return NextResponse.json(
        { error: 'نوع الملف غير مسموح به' },
        { status: 400 }
      );
    }
    
    // Validate file size
    if (!validateFileSize(file.size, MAX_FILE_SIZE_MB)) {
      logFileUpload(userId, file.name, file.size, false, request);
      return NextResponse.json(
        { error: `حجم الملف يجب أن لا يتجاوز ${MAX_FILE_SIZE_MB} ميجابايت` },
        { status: 400 }
      );
    }
    
    // SECURITY: Validate file content (magic numbers)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    if (!validateFileMagicNumber(buffer, allowedTypes)) {
      logFileUpload(userId, file.name, file.size, false, request);
      return NextResponse.json(
        { error: 'محتوى الملف غير صالح أو لا يطابق الامتداد' },
        { status: 400 }
      );
    }
    
    // Generate unique filename
    const ext = file.name.split('.').pop();
    const filename = `${nanoid()}.${ext}`;
    
    // Save file
    const uploadDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);
    
    // Log successful upload
    logFileUpload(userId, filename, file.size, true, request);
    
    return NextResponse.json({
      success: true,
      filename,
      path: filename,
      size: file.size,
      type: ext
    });
  } catch (error) {
    console.error('File upload error:', error);
    logFileUpload(userId, 'unknown', 0, false, request);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء رفع الملف' },
      { status: 500 }
    );
  }
}
