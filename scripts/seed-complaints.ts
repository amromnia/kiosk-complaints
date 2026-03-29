import db from '../lib/db/schema';
import { generateReferenceNumber } from '../lib/utils/constants';

// Helper function to get random element from array
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper function to get random date in the past 30 days
function randomDate(daysAgo: number = 30): string {
  const now = new Date();
  const past = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(randomTime).toISOString();
}

// Sample data
const firstNames = ['أحمد', 'محمد', 'علي', 'حسن', 'خالد', 'عمر', 'ياسر', 'كريم', 'طارق', 'سامي'];
const lastNames = ['محمود', 'حسين', 'السيد', 'عبدالله', 'إبراهيم', 'صالح', 'عثمان', 'منصور', 'رشيد', 'فاروق'];
const statuses = ['new', 'assigned', 'in_progress', 'resolved', 'closed'];
const priorities = ['high', 'medium', 'low'];
const descriptions = [
  'الماكينة لا تستجيب عند محاولة الطباعة',
  'تم خصم المبلغ ولكن لم يتم طباعة الرخصة',
  'الشاشة لا تعمل بشكل صحيح',
  'مشكلة في قراءة البطاقة الشخصية',
  'جودة الطباعة سيئة جداً والكتابة غير واضحة',
  'الماكينة بطيئة جداً في الاستجابة',
  'لا يمكن إدخال النقود بشكل صحيح',
  'تعطلت الماكينة في منتصف العملية',
  'الطباعة تمت ولكن البيانات غير صحيحة',
  'المكان حول الماكينة غير نظيف',
  'لا يوجد ورق في الطابعة',
  'الصوت مزعج جداً عند التشغيل'
];

async function seedComplaints() {
  try {
    // Get existing data
    const complaintTypes = db.prepare('SELECT id FROM complaint_types').all() as { id: number }[];
    const kiosks = db.prepare('SELECT id FROM kiosks').all() as { id: number }[];
    const users = db.prepare('SELECT id FROM users WHERE role = ? OR role = ?').all('user', 'admin') as { id: number }[];

    if (complaintTypes.length === 0 || kiosks.length === 0) {
      console.error('❌ No complaint types or kiosks found. Please run seed script first.');
      return;
    }

    console.log(`Found ${complaintTypes.length} complaint types, ${kiosks.length} kiosks, ${users.length} users`);

    const stmt = db.prepare(`
      INSERT INTO complaints (
        reference_number,
        client_phone,
        client_national_id,
        client_name,
        complaint_type_id,
        description,
        kiosk_id,
        status,
        priority,
        assigned_user_id,
        created_at,
        closed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const checkRefStmt = db.prepare('SELECT COUNT(*) as count FROM complaints WHERE reference_number = ?');

    let count = 0;

    for (let i = 0; i < 50; i++) {
      // Generate unique reference number
      let referenceNumber: string;
      let attempts = 0;
      do {
        referenceNumber = generateReferenceNumber();
        const result = checkRefStmt.get(referenceNumber) as { count: number };
        if (result.count === 0) break;
        attempts++;
      } while (attempts < 10);

      if (attempts >= 10) {
        console.error('❌ Failed to generate unique reference number');
        continue;
      }

      // Generate random data
      const firstName = randomItem(firstNames);
      const lastName = randomItem(lastNames);
      const clientName = `${firstName} ${lastName}`;
      const clientPhone = `0${Math.floor(1000000000 + Math.random() * 900000000)}`;
      const clientNationalId = `${Math.floor(10000000000000 + Math.random() * 90000000000000)}`;

      const complaintTypeId = randomItem(complaintTypes).id;
      const description = randomItem(descriptions);
      const kioskId = randomItem(kiosks).id;
      const status = randomItem(statuses);
      const priority = randomItem(priorities);

      // Assign to user if status is not 'new'
      const assignedUserId = (status !== 'new' && users.length > 0)
        ? randomItem(users).id
        : null;

      const createdAt = randomDate(30);

      // Set closed_at if status is 'closed'
      const closedAt = status === 'closed'
        ? randomDate(15)
        : null;

      stmt.run(
        referenceNumber,
        clientPhone,
        clientNationalId,
        clientName,
        complaintTypeId,
        description,
        kioskId,
        status,
        priority,
        assignedUserId,
        createdAt,
        closedAt
      );

      count++;
    }

    console.log(`✅ Successfully added ${count} random complaints for testing`);

    // Show summary
    const summary = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM complaints
      GROUP BY status
    `).all();

    console.log('\n📊 Complaints Summary:');
    summary.forEach((row: any) => {
      console.log(`   ${row.status}: ${row.count}`);
    });

  } catch (error) {
    console.error('❌ Error seeding complaints:', error);
  }
}

// Block execution in production unless --force is passed
if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
  console.error('❌ seed-complaints is disabled in production.');
  console.error('   Pass --force to run it anyway: npm run seed-complaints -- --force');
  process.exit(1);
}

seedComplaints();
