# قائمة التحقق للنشر - Deployment Checklist

## ✅ قبل النشر للإنتاج

### الأمان
- [ ] تغيير JWT_SECRET في `.env.local`
  ```bash
  # استخدم مولد عشوائي قوي
  JWT_SECRET=your-super-secret-random-string-here-min-32-chars
  ```

- [ ] تغيير كلمة مرور المسؤول الافتراضية
  - سجل دخول كمسؤول
  - غيّر كلمة المرور

- [ ] تأكد من HTTPS في الإنتاج
  ```bash
  NEXT_PUBLIC_BASE_URL=https://kiosk.traffic.gov.eg
  ```

- [ ] فحص جميع المدخلات
- [ ] تفعيل rate limiting (إن أمكن)
- [ ] مراجعة الصلاحيات

### قاعدة البيانات
- [ ] نسخة احتياطية دورية لـ `data/kiosk-complaints.db`
- [ ] إعداد جدولة backup
- [ ] اختبار استعادة البيانات
- [ ] التأكد من صلاحيات الملف

### الملفات
- [ ] التأكد من وجود مجلد `uploads/`
- [ ] التأكد من صلاحيات المجلد
- [ ] إعداد حد أقصى لحجم التخزين
- [ ] نسخ احتياطي للملفات المرفوعة

### الأداء
- [ ] بناء التطبيق للإنتاج
  ```bash
  npm run build
  ```
- [ ] اختبار البناء
  ```bash
  npm start
  ```
- [ ] تفعيل compression
- [ ] تحسين الصور
- [ ] إعداد CDN (اختياري)

### المراقبة
- [ ] إعداد logging للأخطاء
- [ ] مراقبة استخدام القرص
- [ ] مراقبة استخدام الذاكرة
- [ ] إعداد تنبيهات

### الاختبار
- [ ] اختبار تقديم شكاوى
- [ ] اختبار تكليف الموظفين
- [ ] اختبار رفع الملفات
- [ ] اختبار على أجهزة مختلفة
- [ ] اختبار المتصفحات المختلفة

## 📋 النشر على خادم

### 1. تحضير الخادم

```bash
# تثبيت Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# تثبيت PM2 (لإدارة العمليات)
sudo npm install -g pm2
```

### 2. رفع الملفات

```bash
# من جهازك المحلي
scp -r kiosk-complaints user@server:/var/www/

# أو استخدم Git
cd /var/www/
git clone <repository-url> kiosk-complaints
cd kiosk-complaints
```

### 3. التثبيت

```bash
cd /var/www/kiosk-complaints
npm install --production
npm run init-db
npm run build
```

### 4. إعداد المتغيرات البيئية

```bash
nano .env.local
```

أضف:
```
NEXT_PUBLIC_BASE_URL=https://kiosk.traffic.gov.eg
JWT_SECRET=your-super-secret-key-here
NODE_ENV=production
```

### 5. تشغيل بـ PM2

```bash
# إنشاء ملف ecosystem
nano ecosystem.config.js
```

محتوى الملف:
```javascript
module.exports = {
  apps: [{
    name: 'kiosk-complaints',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/kiosk-complaints',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

```bash
# تشغيل
pm2 start ecosystem.config.js

# حفظ للبدء التلقائي
pm2 save
pm2 startup
```

### 6. إعداد Nginx (Reverse Proxy)

```bash
sudo nano /etc/nginx/sites-available/kiosk-complaints
```

محتوى الملف:
```nginx
server {
    listen 80;
    server_name kiosk.traffic.gov.eg;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 10M;
}
```

```bash
# تفعيل
sudo ln -s /etc/nginx/sites-available/kiosk-complaints /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. إعداد SSL (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d kiosk.traffic.gov.eg
```

## 🔄 التحديثات

### تحديث النظام:

```bash
cd /var/www/kiosk-complaints
git pull
npm install
npm run build
pm2 restart kiosk-complaints
```

### النسخ الاحتياطي قبل التحديث:

```bash
# نسخ قاعدة البيانات
cp data/kiosk-complaints.db data/kiosk-complaints.db.backup.$(date +%Y%m%d)

# نسخ الملفات
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/
```

## 📊 المراقبة

### مراقبة PM2:

```bash
# حالة التطبيق
pm2 status

# السجلات
pm2 logs kiosk-complaints

# الأداء
pm2 monit
```

### مراقبة القرص:

```bash
# حجم قاعدة البيانات
du -h data/kiosk-complaints.db

# حجم الملفات المرفوعة
du -h uploads/

# المساحة المتاحة
df -h
```

## 🛠️ الصيانة الدورية

### يومياً:
- [ ] فحص السجلات للأخطاء
- [ ] مراقبة عدد الشكاوى الجديدة

### أسبوعياً:
- [ ] نسخة احتياطية لقاعدة البيانات
- [ ] نسخة احتياطية للملفات المرفوعة
- [ ] مراجعة أداء النظام

### شهرياً:
- [ ] تحديث المكتبات (إن لزم)
- [ ] مراجعة السجلات الأمنية
- [ ] تنظيف الملفات القديمة
- [ ] مراجعة استخدام المساحة

## 🆘 استكشاف الأخطاء

### التطبيق لا يعمل:
```bash
pm2 logs kiosk-complaints --lines 100
```

### قاعدة البيانات تالفة:
```bash
# استعادة من النسخة الاحتياطية
cp data/kiosk-complaints.db.backup.YYYYMMDD data/kiosk-complaints.db
pm2 restart kiosk-complaints
```

### مشاكل الذاكرة:
```bash
# زيادة حد الذاكرة في PM2
pm2 start ecosystem.config.js --max-memory-restart 500M
```

### مساحة القرص ممتلئة:
```bash
# حذف السجلات القديمة
pm2 flush

# ضغط الملفات القديمة
find uploads/ -mtime +90 -name "*.jpg" -exec gzip {} \;
```

## 📱 جهات الاتصال

### الدعم الفني:
- الاسم: _______________
- الهاتف: _______________
- البريد: _______________

### مسؤول النظام:
- الاسم: _______________
- الهاتف: _______________
- البريد: _______________

---

© 2026 وزارة الداخلية - جمهورية مصر العربية
