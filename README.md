# نظام شكاوى ماكينات التجديد الذاتي

نظام متكامل لإدارة شكاوى ماكينات تجديد رخص تسيير المركبات - وزارة الداخلية

## المميزات

### بوابة العملاء (Client Portal)
- تقديم الشكاوى بدون تسجيل دخول
- التحقق من رقم الهاتف والرقم القومي
- رفع صور توضيحية للمشكلة
- دعم أنواع متعددة من الشكاوى
- واجهة عربية كاملة

### لوحة تحكم المسؤول (Admin Dashboard)
- عرض جميع الشكاوى
- تكليف الموظفين بالشكاوى
- إدارة الموظفين
- إنشاء روابط تسجيل للموظفين (صالحة لمدة 10 دقائق)
- تكليف تلقائي حسب نوع الشكوى
- إحصائيات وتقارير
- تصفية وبحث متقدم

### لوحة تحكم الموظف (User Dashboard)
- عرض الشكاوى المكلف بها
- تحديث حالة الشكاوى
- إضافة تعليقات داخلية
- رفع ملفات ومستندات
- تتبع تاريخ الشكوى

## المتطلبات

- Node.js 20+
- npm أو yarn

## التثبيت والإعداد

### 1. استنساخ المشروع

```bash
git clone <repository-url>
cd kiosk-complaints
```

### 2. تثبيت المكتبات

```bash
npm install
```

### 3. إنشاء قاعدة البيانات

```bash
npm run init-db -- --email <email> --password <password>
```

مثال:
```bash
npm run init-db -- --email admin@example.com --password MySecurePass!
```

سيتم إنشاء:
- قاعدة بيانات SQLite3
- مستخدم مسؤول بالبيانات المُدخلة
- أنواع الشكاوى
- بيانات الماكينات

> **ملاحظة:** يجب تحديد `--email` و`--password` عند تشغيل الأمر، وإلا سيفشل.

### 4. تشغيل التطبيق

#### وضع التطوير:
```bash
npm run dev
```

الموقع متاح على: `http://localhost:3000`

#### وضع الإنتاج:
```bash
npm run build
npm start
```

## هيكل المشروع

```
kiosk-complaints/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── complaints/           # Complaint management
│   │   ├── files/                # Secure file serving
│   │   └── upload/               # File upload
│   ├── complaint/[kiosk]/        # Client complaint portal
│   ├── dashboard/
│   │   ├── admin/                # Admin dashboard
│   │   └── user/                 # User dashboard
│   ├── login/                    # Login page
│   └── register/[token]/         # Employee registration
├── lib/
│   ├── auth/                     # Authentication utilities
│   ├── db/                       # Database schema & queries
│   └── utils/                    # Helper functions
├── components/                   # Reusable React components
├── data/                         # SQLite database
└── uploads/                      # Uploaded files
```

## الاستخدام

### للعملاء (تقديم شكوى)

1. الوصول إلى رابط الماكينة: `/complaint/[kiosk-link]`
2. إدخال البيانات:
   - رقم الهاتف (11 رقم)
   - الرقم القومي (14 رقم)
   - الاسم الكامل
   - نوع الشكوى
   - وصف المشكلة
   - رفع صور (إن لزم الأمر)
3. تقديم الشكوى
4. الحصول على رقم الشكوى

### للمسؤولين

1. تسجيل الدخول: `/login`
2. لوحة التحكم: `/dashboard/admin`
3. إنشاء حساب موظف:
   - الضغط على "إنشاء رابط تسجيل موظف"
   - نسخ الرابط وإرساله للموظف
   - صلاحية الرابط: 10 دقائق
4. تكليف الشكاوى:
   - فتح الشكوى
   - اختيار الموظف
   - الضغط على "تكليف"

### للموظفين

1. التسجيل من خلال رابط المسؤول
2. تسجيل الدخول: `/login`
3. لوحة التحكم: `/dashboard/user`
4. معالجة الشكاوى:
   - فتح الشكوى المكلف بها
   - تحديث الحالة
   - إضافة تعليقات
   - رفع مستندات
   - إغلاق الشكوى

## الأمان

- تشفير كلمات المرور باستخدام bcrypt
- JWT tokens لجلسات المستخدم
- روابط تسجيل محدودة الوقت والاستخدام
- بصمة الجهاز لربط الحسابات
- رفع الملفات بشكل آمن (خارج public)
- التحقق من صلاحيات الوصول
- التحقق من أنواع وأحجام الملفات

## قاعدة البيانات

### الجداول الرئيسية:
- `users` - المستخدمين (مسؤولين وموظفين)
- `complaints` - الشكاوى
- `complaint_types` - أنواع الشكاوى
- `kiosks` - الماكينات
- `attachments` - المرفقات
- `comments` - التعليقات
- `status_history` - تاريخ تغيير الحالات
- `auto_assignment_rules` - قواعد التكليف التلقائي
- `notifications` - الإشعارات
- `registration_links` - روابط التسجيل
- `user_devices` - أجهزة الموظفين

## API Endpoints

### المصادقة
- `POST /api/auth/login` - تسجيل الدخول
- `POST /api/auth/logout` - تسجيل الخروج
- `GET /api/auth/session` - الحصول على الجلسة
- `POST /api/auth/register` - تسجيل موظف جديد
- `POST /api/auth/generate-link` - إنشاء رابط تسجيل

### الشكاوى
- `POST /api/complaints/submit` - تقديم شكوى
- `GET /api/complaints` - عرض الشكاوى
- `GET /api/complaints/[id]` - تفاصيل شكوى
- `PUT /api/complaints/[id]/status` - تحديث الحالة
- `POST /api/complaints/[id]/assign` - تكليف موظف
- `POST /api/complaints/[id]/comments` - إضافة تعليق

### الملفات
- `POST /api/upload` - رفع ملف
- `GET /api/files/[filename]` - تحميل ملف

### بيانات النظام
- `GET /api/kiosks` - قائمة الماكينات
- `GET /api/complaint-types` - أنواع الشكاوى
- `GET /api/users` - قائمة الموظفين

## الألوان والتصميم

النظام يتبع الألوان الحكومية المصرية:

- **الأزرق الرئيسي:** #1a5490
- **الأحمر:** #c8102e
- **البرتقالي/الذهبي:** #f4a034

## الدعم

للدعم الفني أو الاستفسارات، يرجى التواصل مع فريق التطوير.

---

© 2026 وزارة الداخلية - جمهورية مصر العربية. جميع الحقوق محفوظة.

