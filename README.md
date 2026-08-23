# مدرسة نينوى الموهوبين - Nineveh Gifted School

منصة تواصل مدرسية عربية تشمل مشروعين:

| المشروع | الوصف | التقنيات |
|---------|-------|----------|
| `public/` | تطبيق بسيط يعمل مباشرة بدون سيرفر | HTML, CSS, JS |
| `nineveh-gifted-school/` | منصة كاملة: واجهة + سيرفر + قاعدة بيانات | React (Vite) + Express + Prisma + Socket.IO |

---

## النشر على المنصات المجانية

### 1) GitHub
المستودع يحتوي كل شيء. ارفعه بأمر:
```bash
git push origin main
```

### 2) Vercel - التطبيق البسيط والواجهة الأمامية

**أ) التطبيق البسيط (public/index.html):**
1. Vercel > Add New Project > استورد مستودع GitHub
2. Root Directory: `public`
3. Framework Preset: Other > Deploy

**ب) واجهة React (nineveh-gifted-school/client):**
1. Vercel > Add New Project > نفس المستودع
2. Root Directory: `nineveh-gifted-school/client`
3. Framework Preset: Vite (يكتشفه تلقائياً)
4. Environment Variables:
   - `VITE_API_URL` = رابط السيرفر على Render (مثال: https://nineveh-api.onrender.com)
5. Deploy

### 3) Supabase - قاعدة البيانات PostgreSQL مجاناً
1. أنشئ مشروعاً جديداً على supabase.com
2. من Project Settings > Database > Connection string انسخ الرابط
3. استخدمه كـ `DATABASE_URL` في Render
4. نفّذ الهجرة محلياً مرة واحدة:
```bash
cd nineveh-gifted-school/server
# ضع رابط Supabase في ملف .env ثم:
npx prisma migrate deploy
```

### 4) Render - السيرفر (Node.js + Socket.IO)
1. render.com > New > Web Service > اربط مستودع GitHub
2. Root Directory: `nineveh-gifted-school/server`
3. Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
4. Start Command: `npm start`
5. Environment Variables:
   - `DATABASE_URL` = رابط Supabase
   - `JWT_SECRET` = سر عشوائي طويل (32+ حرف)
   - `CLIENT_URL` = رابط الواجهة على Vercel
   - `NODE_ENV` = production
6. Create Web Service

ملاحظة: الخطة المجانية في Render توقف السيرفر بعد فترة خمول؛ أول طلب بعدها يتاخر حوالي 30 ثانية.

---

## التشغيل المحلي

**التطبيق البسيط:** افتح `public/index.html` في المتصفح مباشرة، أو شغّل `node server.js` ثم افتح http://localhost:3000

**المنصة الكاملة:**
```bash
cd nineveh-gifted-school/client && npm install && npm run dev
cd nineveh-gifted-school/server && npm install && npm run dev
```
