# ForexYemeni Pro - تطبيق إشارات التداول

## 📋 الوصف
تطبيق احترافي لعرض إشارات التداول من مؤشر FOREXYEMENI-PRO-v1.10
يتضمن لوحة تحكم للمدير وواجهة مستخدم متجاوبة مع الجوال

## 🚀 التشغيل المحلي

```bash
# تثبيت الحزم
npm install

# تهيئة قاعدة البيانات
npx prisma db push

# تشغيل الخادم
npm run dev
```

افتح http://localhost:3000

## 🔐 بيانات المدير الافتراضية
- **اسم المستخدم**: admin
- **كلمة المرور**: forex2024

## 📡 ربط TradingView
راجع ملف `google-apps-script-webhook.js` وملف الدليل المرفق

## 🛠️ التقنيات
- Next.js 16
- TypeScript
- Tailwind CSS 4
- Prisma ORM
- SQLite
