# الماكينات المتاحة - روابط QR Code

## كيفية الحصول على الروابط الفعلية

بعد تشغيل `npm run init-db`، تم إنشاء 6 ماكينات مع روابط فريدة.

### للحصول على الروابط:

#### الطريقة 1: من قاعدة البيانات
```bash
cd data
sqlite3 kiosk-complaints.db
SELECT id, location, unique_link FROM kiosks;
.quit
```

#### الطريقة 2: من API
افتح المتصفح على:
```
http://localhost:3000/api/kiosks
```

سترى JSON مثل:
```json
{
  "kiosks": [
    {
      "id": 1,
      "unique_link": "abc123xyz",
      "location": "سيتي سنتر"
    },
    ...
  ]
}
```

## رابط الشكوى الكامل

استخدم الصيغة التالية:
```
http://localhost:3000/complaint/[unique_link]
```

### مثال:
إذا كان `unique_link` هو `abc123xyz`:
```
http://localhost:3000/complaint/abc123xyz
```

## إنشاء QR Codes

يمكنك استخدام أي موقع لإنشاء QR Code:
- [QR Code Generator](https://www.qr-code-generator.com/)
- [QRCode Monkey](https://www.qrcode-monkey.com/)

أدخل الرابط الكامل واطبع QR Code.

## طباعة ولصق على الماكينات

1. أنشئ QR Code لكل ماكينة
2. اطبعه مع شرح بسيط:
   ```
   امسح الرمز لتقديم شكوى
   أو زر الرابط: kiosk.traffic.gov.eg/complaint/abc123xyz
   ```
3. الصق على الماكينة في مكان واضح

## ملاحظات

- كل ماكينة لها رابط فريد
- الرابط يُستخدم لتحديد موقع الماكينة تلقائياً
- لا يمكن للعميل تغيير الرابط
- النظام يتعرف على الماكينة من URL

## للإنتاج

في الإنتاج، غيّر الرابط الأساسي في `.env.local`:
```
NEXT_PUBLIC_BASE_URL=https://kiosk.traffic.gov.eg
```

الروابط ستصبح:
```
https://kiosk.traffic.gov.eg/complaint/[unique_link]
```

---

© 2026 وزارة الداخلية
