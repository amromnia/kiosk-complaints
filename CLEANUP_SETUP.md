# تنظيف الروابط المنتهية تلقائياً

## نظرة عامة
يحتوي النظام على آلية لحذف روابط التسجيل المنتهية والقديمة تلقائياً لتجنب تراكم البيانات غير المستخدمة في قاعدة البيانات.

## الطرق المتاحة

### 1. Cron Job على السيرفر (ينصح به للإنتاج)

#### Linux/Ubuntu
أضف المهمة التالية إلى crontab:
```bash
# تشغيل كل ساعة
0 * * * * curl -X POST http://localhost:3000/api/auth/cleanup -H "Authorization: Bearer YOUR_SECRET_TOKEN" >> /var/log/cleanup.log 2>&1

# أو تشغيل كل يوم عند منتصف الليل
0 0 * * * curl -X POST http://localhost:3000/api/auth/cleanup -H "Authorization: Bearer YOUR_SECRET_TOKEN" >> /var/log/cleanup.log 2>&1
```

لتعديل crontab:
```bash
crontab -e
```

#### Windows Task Scheduler
1. افتح Task Scheduler
2. أنشئ مهمة جديدة (Create Task)
3. في Triggers: اختر الجدول الزمني (مثلاً كل يوم)
4. في Actions: أضف:
   - Program: `curl.exe`
   - Arguments: `-X POST http://localhost:3000/api/auth/cleanup -H "Authorization: Bearer YOUR_SECRET_TOKEN"`

### 2. استخدام خدمات Cron خارجية (للاستضافة السحابية)

#### cron-job.org
1. سجل حساب على https://cron-job.org
2. أنشئ مهمة جديدة:
   - URL: `https://yourdomain.com/api/auth/cleanup`
   - Method: POST
   - Headers: `Authorization: Bearer YOUR_SECRET_TOKEN`
   - Schedule: حسب الحاجة (يومي/أسبوعي)

#### EasyCron
1. سجل على https://www.easycron.com
2. أنشئ Cron Job جديد
3. نفس الإعدادات أعلاه

### 3. استخدام Vercel Cron (إذا كنت تستخدم Vercel)

أضف الملف `vercel.json` في جذر المشروع:
```json
{
  "crons": [
    {
      "path": "/api/auth/cleanup",
      "schedule": "0 0 * * *"
    }
  ]
}
```

ثم عدل الـ route handler لدعم GET requests:
```typescript
export async function GET(request: NextRequest) {
  // نفس منطق POST
  // تأكد من إضافة authorization header check
}
```

## إعداد المفتاح السري

أضف المتغير التالي إلى `.env`:
```
CLEANUP_TOKEN=your-very-secret-token-here-change-this
```

**مهم**: غيّر القيمة الافتراضية لمفتاح أكثر أماناً في الإنتاج!

يمكنك إنشاء مفتاح عشوائي باستخدام:
```bash
# Linux/Mac
openssl rand -hex 32

# أو باستخدام Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## التحقق من عمل التنظيف

لتشغيل التنظيف يدوياً للاختبار:
```bash
curl -X POST http://localhost:3000/api/auth/cleanup \
  -H "Authorization: Bearer YOUR_SECRET_TOKEN"
```

يجب أن ترى رد مثل:
```json
{
  "success": true,
  "message": "تم حذف 5 رابط منتهي و 12 رابط مستخدم قديم",
  "expired_deleted": 5,
  "old_used_deleted": 12
}
```

## ماذا يتم حذفه؟

1. **روابط التسجيل المنتهية**: الروابط التي تجاوزت تاريخ انتهاء صلاحيتها
2. **روابط مستخدمة قديمة**: الروابط المستخدمة التي مر عليها أكثر من 30 يوم

## التوصيات

- **للتطوير**: تشغيل يدوي عند الحاجة
- **للإنتاج**: 
  - إذا كان لديك عدد قليل من المستخدمين: تشغيل يومي
  - إذا كان لديك عدد كبير من المستخدمين: تشغيل كل ساعة
