import { NextRequest, NextResponse } from 'next/server';
import { 
  submitComplaintWithAttachments,
  getKioskByLink,
  getComplaintTypeById,
  getAutoAssignmentRules,
  getActiveUsers,
  getActiveAdmins
} from '@/lib/db/queries';
import { 
  validatePhoneNumber, 
  validateNationalId, 
  sanitizeInput 
} from '@/lib/utils/security';
import { getPriorityFromType, DESCRIPTION_MAX_LENGTH } from '@/lib/utils/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      client_phone, 
      client_national_id, 
      client_name, 
      complaint_type_id,
      description,
      kiosk_link,
      attachments 
    } = body;
    
    // Validate required fields
    if (!client_phone || !client_national_id || !client_name || !complaint_type_id || !description || !kiosk_link) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      );
    }
    
    // Validate phone number
    if (!validatePhoneNumber(client_phone)) {
      return NextResponse.json(
        { error: 'رقم الهاتف غير صالح' },
        { status: 400 }
      );
    }
    
    // Validate national ID
    if (!validateNationalId(client_national_id)) {
      return NextResponse.json(
        { error: 'الرقم القومي غير صالح' },
        { status: 400 }
      );
    }
    
    // Validate description length
    if (description.length > DESCRIPTION_MAX_LENGTH) {
      return NextResponse.json(
        { error: `الوصف يجب أن لا يتجاوز ${DESCRIPTION_MAX_LENGTH} حرف` },
        { status: 400 }
      );
    }
    
    // Get kiosk
    const kiosk: any = getKioskByLink(kiosk_link);
    if (!kiosk) {
      return NextResponse.json(
        { error: 'رابط الماكينة غير صالح' },
        { status: 400 }
      );
    }
    
    // Check if kiosk is disabled
    if (kiosk.is_disabled) {
      return NextResponse.json(
        { error: 'هذه الماكينة معطلة حالياً. يرجى استخدام ماكينة أخرى أو التواصل مع الدعم.' },
        { status: 403 }
      );
    }
    
    // Get complaint type
    const complaintType: any = getComplaintTypeById(complaint_type_id);
    if (!complaintType) {
      return NextResponse.json(
        { error: 'نوع الشكوى غير صالح' },
        { status: 400 }
      );
    }
    
    // Check if image is required
    if (complaintType.requires_image && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: 'صورة مرفقة مطلوبة لهذا النوع من الشكاوى' },
        { status: 400 }
      );
    }
    
    // Sanitize inputs
    const sanitizedDescription = sanitizeInput(description);
    const sanitizedName = sanitizeInput(client_name);
    
    // Get priority from complaint type
    const priority = getPriorityFromType(complaintType.priority);
    
    // Get auto-assignment rules and active users/admins
    const autoAssignmentRules = complaintType.auto_assignment_enabled ? getAutoAssignmentRules(complaint_type_id) : undefined;
    const activeUsers = getActiveUsers();
    const activeAdmins = getActiveAdmins();
    
    // Create complaint with attachments and auto-assignment in a transaction
    const result = submitComplaintWithAttachments({
      client_phone,
      client_national_id,
      client_name: sanitizedName,
      complaint_type_id,
      description: sanitizedDescription,
      kiosk_id: kiosk.id,
      priority,
      attachments,
      complaintType,
      autoAssignmentRules,
      activeUsers,
      activeAdmins
    });
    
    return NextResponse.json({
      success: true,
      reference_number: result.referenceNumber,
      message: 'تم تسجيل الشكوى بنجاح'
    });
  } catch (error) {
    console.error('Complaint submission error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تسجيل الشكوى' },
      { status: 500 }
    );
  }
}
