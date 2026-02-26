import db from './schema';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

export const seedDatabase = async () => {
  // Check if admin already exists
  const existingAdmin = db.prepare('SELECT * FROM users WHERE role = ?').get('admin');
  
  if (!existingAdmin) {
    // Create default admin user
    const hashedPassword = await bcrypt.hash('Admin@123!', 10);
    
    db.prepare(`
      INSERT INTO users (name, email, password, role, status)
      VALUES (?, ?, ?, ?, ?)
    `).run('المسؤول الرئيسي', 'admin@traffic.gov.eg', hashedPassword, 'admin', 'active');
    
    console.log('✅ Admin user created');
    console.log('   Email: admin@traffic.gov.eg');
    console.log('   Password: Admin@123!');
  }

  // Check if complaint types exist
  const existingTypes = db.prepare('SELECT COUNT(*) as count FROM complaint_types').get() as { count: number };
  
  if (existingTypes.count === 0) {
    // Seed complaint types
    const complaintTypes = [
      { name: 'الدفع تم ولكن الرخصة لم تطبع', priority: 1, requires_image: 1 },
      { name: 'عطل في الماكينة', priority: 1, requires_image: 0 },
      { name: 'مشكلة في قراءة البطاقة', priority: 2, requires_image: 0 },
      { name: 'جودة الطباعة سيئة', priority: 2, requires_image: 1 },
      { name: 'بطء في الاستجابة', priority: 3, requires_image: 0 },
      { name: 'الماكينة لا تقبل النقود', priority: 1, requires_image: 0 },
      { name: 'شكوى أخرى', priority: 3, requires_image: 0 }
    ];

    const stmt = db.prepare(`
      INSERT INTO complaint_types (name_ar, priority, requires_image, auto_assignment_enabled)
      VALUES (?, ?, ?, ?)
    `);

    for (const type of complaintTypes) {
      stmt.run(type.name, type.priority, type.requires_image, 0);
    }

    console.log('✅ Complaint types seeded');
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
