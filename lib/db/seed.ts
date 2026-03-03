import db from './schema';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

export const seedDatabase = async () => {
  // Check if superadmin already exists
  const existingSuperAdmin = db.prepare('SELECT * FROM users WHERE role = ?').get('superadmin');
  
  if (!existingSuperAdmin) {
    // Create default superadmin user
    const hashedPassword = await bcrypt.hash('Admin@123!', 10);
    
    db.prepare(`
      INSERT INTO users (name, email, password, role, status)
      VALUES (?, ?, ?, ?, ?)
    `).run('المسؤول الرئيسي', 'admin@traffic.gov.eg', hashedPassword, 'superadmin', 'active');
    
    console.log('✅ SuperAdmin user created');
    console.log('   Email: admin@traffic.gov.eg');
    console.log('   Password: Admin@123!');
    console.log('   Role: superadmin');
  }

  // Check if complaint types exist
  const existingTypes = db.prepare('SELECT COUNT(*) as count FROM complaint_types').get() as { count: number };
  
  if (existingTypes.count === 0) {
    // Seed complaint types with hierarchical structure
    const complaintTypesData = [
      // ====== 1️⃣ شكاوى مالية ======
      { id: 1, name: 'شكاوى مالية', parent_id: null, level: 1, priority: 1, requires_image: 0, display_order: 1 },
      
      // مشاكل الخصم والدفع
      { id: 2, name: 'مشاكل الخصم والدفع', parent_id: 1, level: 2, priority: 1, requires_image: 0, display_order: 1 },
      { id: 3, name: 'تم الخصم ولم تصدر الرخصة', parent_id: 2, level: 3, priority: 1, requires_image: 1, display_order: 1 },
      { id: 4, name: 'تم الخصم مرتين لنفس العملية', parent_id: 2, level: 3, priority: 1, requires_image: 1, display_order: 2 },
      { id: 5, name: 'فشل العملية لكن تم سحب مبلغ', parent_id: 2, level: 3, priority: 1, requires_image: 1, display_order: 3 },
      { id: 6, name: 'اختلاف قيمة المبلغ المعروض عن المخصوم', parent_id: 2, level: 3, priority: 1, requires_image: 1, display_order: 4 },
      { id: 7, name: 'عملية مرفوضة من البنك رغم وجود رصيد', parent_id: 2, level: 3, priority: 1, requires_image: 1, display_order: 5 },
      
      // مشاكل الاسترداد
      { id: 8, name: 'مشاكل الاسترداد', parent_id: 1, level: 2, priority: 1, requires_image: 0, display_order: 2 },
      { id: 9, name: 'تأخر رد المبلغ', parent_id: 8, level: 3, priority: 2, requires_image: 0, display_order: 1 },
      { id: 10, name: 'لم يتم استرداد المبلغ رغم قبول الشكوى', parent_id: 8, level: 3, priority: 1, requires_image: 0, display_order: 2 },
      
      // ====== 2️⃣ شكاوى فنية ======
      { id: 11, name: 'شكاوى فنية (أعطال الماكينة أو النظام)', parent_id: null, level: 1, priority: 1, requires_image: 0, display_order: 2 },
      
      // أعطال تشغيلية
      { id: 12, name: 'أعطال تشغيلية', parent_id: 11, level: 2, priority: 1, requires_image: 0, display_order: 1 },
      { id: 13, name: 'الماكينة توقفت أثناء الاستخدام', parent_id: 12, level: 3, priority: 1, requires_image: 1, display_order: 1 },
      { id: 14, name: 'الشاشة لا تستجيب', parent_id: 12, level: 3, priority: 1, requires_image: 1, display_order: 2 },
      { id: 15, name: 'ماكينة الدفع لا تستجيب', parent_id: 12, level: 3, priority: 1, requires_image: 1, display_order: 3 },
      { id: 16, name: 'انقطاع الكهرباء أثناء العملية', parent_id: 12, level: 3, priority: 1, requires_image: 0, display_order: 4 },
      
      // أعطال الطباعة
      { id: 17, name: 'أعطال الطباعة', parent_id: 11, level: 2, priority: 1, requires_image: 0, display_order: 2 },
      { id: 18, name: 'لم تطبع الرخصة', parent_id: 17, level: 3, priority: 1, requires_image: 1, display_order: 1 },
      { id: 19, name: 'طبعت الرخصة بشكل غير واضح', parent_id: 17, level: 3, priority: 2, requires_image: 1, display_order: 2 },
      
      // أعطال الشبكة
      { id: 20, name: 'أعطال الشبكة', parent_id: 11, level: 2, priority: 2, requires_image: 0, display_order: 3 },
      { id: 21, name: 'انقطاع الشبكة', parent_id: 20, level: 3, priority: 2, requires_image: 0, display_order: 1 },
      { id: 22, name: 'بطء شديد أثناء التنفيذ', parent_id: 20, level: 3, priority: 3, requires_image: 0, display_order: 2 },
      { id: 23, name: 'Timeout أثناء الدفع', parent_id: 20, level: 3, priority: 1, requires_image: 1, display_order: 3 },
      
      // ====== 3️⃣ شكاوى تسجيل الدخول و OTP ======
      { id: 24, name: 'شكاوى تسجيل الدخول و OTP', parent_id: null, level: 1, priority: 2, requires_image: 0, display_order: 3 },
      
      // إنشاء حساب
      { id: 25, name: 'إنشاء حساب', parent_id: 24, level: 2, priority: 2, requires_image: 0, display_order: 1 },
      { id: 26, name: 'غير قادر على التسجيل', parent_id: 25, level: 3, priority: 2, requires_image: 0, display_order: 1 },
      { id: 27, name: 'الرقم القومي غير مقبول', parent_id: 25, level: 3, priority: 2, requires_image: 0, display_order: 2 },
      { id: 28, name: 'رقم الموبايل غير مقبول', parent_id: 25, level: 3, priority: 2, requires_image: 0, display_order: 3 },
      
      // تسجيل الدخول
      { id: 29, name: 'تسجيل الدخول', parent_id: 24, level: 2, priority: 2, requires_image: 0, display_order: 2 },
      { id: 30, name: 'كلمة المرور غير صحيحة', parent_id: 29, level: 3, priority: 3, requires_image: 0, display_order: 1 },
      { id: 31, name: 'الحساب مقفول', parent_id: 29, level: 3, priority: 2, requires_image: 0, display_order: 2 },
      
      // OTP
      { id: 32, name: 'OTP', parent_id: 24, level: 2, priority: 2, requires_image: 0, display_order: 3 },
      { id: 33, name: 'OTP لم يصل', parent_id: 32, level: 3, priority: 2, requires_image: 0, display_order: 1 },
      { id: 34, name: 'OTP وصل متأخر', parent_id: 32, level: 3, priority: 3, requires_image: 0, display_order: 2 },
      { id: 35, name: 'OTP غير صحيح', parent_id: 32, level: 3, priority: 3, requires_image: 0, display_order: 3 },
      { id: 36, name: 'OTP انتهت صلاحيته', parent_id: 32, level: 3, priority: 3, requires_image: 0, display_order: 4 },
      { id: 37, name: 'لا يمكن طلب OTP جديد', parent_id: 32, level: 3, priority: 2, requires_image: 0, display_order: 5 },
      { id: 38, name: 'تم إرسال OTP لرقم خاطئ', parent_id: 32, level: 3, priority: 2, requires_image: 0, display_order: 6 },
      
      // ====== 4️⃣ شكاوى أمنية ======
      { id: 39, name: 'شكاوى أمنية', parent_id: null, level: 1, priority: 1, requires_image: 0, display_order: 4 },
      { id: 40, name: 'محاولة دخول غير مصرح بها', parent_id: 39, level: 2, priority: 1, requires_image: 0, display_order: 1 },
      { id: 41, name: 'وصول رسالة OTP بدون طلب', parent_id: 39, level: 2, priority: 1, requires_image: 0, display_order: 2 },
    ];

    const stmt = db.prepare(`
      INSERT INTO complaint_types (id, name_ar, parent_id, level, priority, requires_image, auto_assignment_enabled, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const type of complaintTypesData) {
      stmt.run(type.id, type.name, type.parent_id, type.level, type.priority, type.requires_image, 0, type.display_order);
    }

    console.log('✅ Complaint types seeded (41 hierarchical types)');
  }

  // Check if kiosks exist
  const existingKiosks = db.prepare('SELECT COUNT(*) as count FROM kiosks').get() as { count: number };
  
  if (existingKiosks.count === 0) {
    // Seed kiosks
    const kiosks = [
      { location: 'سيتي سنتر' },
      { location: 'سيتي ستارز مول' },
      { location: 'مول مصر' },
      { location: 'القاهرة فيستيفال' },
      { location: 'أركان بلازا' },
      { location: 'مول العرب' }
    ];

    const stmt = db.prepare(`
      INSERT INTO kiosks (unique_link, location)
      VALUES (?, ?)
    `);

    for (const kiosk of kiosks) {
      const uniqueLink = nanoid(12);
      stmt.run(uniqueLink, kiosk.location);
    }

    console.log('✅ Kiosks seeded');
  }

  console.log('✅ Database seeded successfully');
};
