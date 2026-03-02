import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';
import { 
  validateFileType, 
  validateFileSize, 
  sanitizeInput 
} from '@/lib/utils/security';
import { 
  ALLOWED_IMAGE_TYPES, 
  ALLOWED_DOCUMENT_TYPES, 
  MAX_FILE_SIZE_MB 
} from '@/lib/utils/constants';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadedBy = formData.get('uploadedBy') as string || 'client';
    
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
    
    // Validate file type
    if (!validateFileType(file.name, allowedTypes)) {
      return NextResponse.json(
        { error: 'نوع الملف غير مسموح به' },
        { status: 400 }
      );
    }
    
    // Validate file size
    if (!validateFileSize(file.size, MAX_FILE_SIZE_MB)) {
      return NextResponse.json(
        { error: `حجم الملف يجب أن لا يتجاوز ${MAX_FILE_SIZE_MB} ميجابايت` },
        { status: 400 }
      );
    }
    
    // Generate unique filename
    const ext = file.name.split('.').pop();
    const filename = `${nanoid()}.${ext}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Save file
    const uploadDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);
    
    return NextResponse.json({
      success: true,
      filename,
      path: filename,
      size: file.size,
      type: ext
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء رفع الملف' },
      { status: 500 }
    );
  }
}
