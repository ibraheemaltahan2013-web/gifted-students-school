# 📋 Supabase Setup - Free PostgreSQL (500MB)

## **1. إنشاء المشروع (2 دقيقة)**

1. اذهب إلى **[supabase.com](https://supabase.com)** → `Start your project`
2. سجل دخول بـ GitHub
3. `New Project`:
   - **Name:** `nineveh-gifted-school`
   - **Database Password:** أنشئ كلمة مرور قوية (احفظها!)
   - **Region:** `Europe West (Frankfurt)` أو أقرب منطقة
   - **Pricing Plan:** `Free` (افتراضي)
4. اضغط `Create new project` → انتظر 2 دقيقة

## **2. الحصول على Connection String**

1. في Dashboard المشروع → `Settings` (أيقونة الترس) → `Database`
2. تحت **Connection string** → اختر **URI** (وليس Transaction)
3. انسخ الـ URI، سيظهر كالتالي:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```
4. **استبدل `[YOUR-PASSWORD]`** بكلمة المرور التي أنشأتها

## **3. تفعيل Connection Pooling (مهم لـ Render)**

1. نفس الصفحة `Database` → انزل لـ **Connection Pooling**
2. **Mode:** `Transaction` (افتراضي)
3. **Port:** `6543`
4. انسخ الـ **Pooled connection string**:
   ```
   postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
5. **هذا هو الرابط الذي ستستخدمه في Render**

## **4. تشغيل Migrations (اختياري - Render سيفعلها تلقائياً)**

إذا أردت تشغيلها يدوياً:
```bash
# محلياً
cd server
DATABASE_URL="postgresql://postgres.xxx:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true" npx prisma migrate deploy
```

## **5. تفعيل Realtime (للرسائل الفورية)**

1. `Settings` → `Database` → `Realtime`
2. فعّل `Enable Realtime` للجداول:
   - `messages`
   - `notifications` (إذا أضفتها لاحقاً)

## **6. إعدادات Auth (اختياري)**

إذا أردت استخدام Supabase Auth بدلاً من JWT الخاص:
1. `Authentication` → `Providers` → فعّل `Email`
2. `Authentication` → `URL Configuration`:
   - **Site URL:** `https://your-app.vercel.app`
   - **Redirect URLs:** `https://your-app.vercel.app/auth/callback`

---

## **🔗 ملخص المتغيرات لـ Render:**

```env
DATABASE_URL=postgresql://postgres.xxx:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true
JWT_SECRET=your-generated-secret
CLIENT_URL=https://your-app.vercel.app
NODE_ENV=production
PORT=3001
```

---

## **💡 نصائح مهمة:**

| الأمر | السبب |
|-------|-------|
| استخدم **Pooled connection** (port 6543) | Render يفتح اتصالات كثيرة، الـ Pooler يديرها |
| أضف `?pgbouncer=true` | مطلوب لـ Supabase Pooler |
| لا تستخدم `Transaction pooler` للـ Prisma Migrate | استخدم Direct connection للـ migrate فقط |
| احفظ **Database Password** | لا يمكن استعادتها، فقط إعادة تعيين |

---

## **🆘 استكشاف الأخطاء:**

| الخطأ | الحل |
|-------|-------|
| `P1001: Can't reach database` | تأكد من استخدام Pooled URL مع `?pgbouncer=true` |
| `P1008: Connection timeout` | Render المجاني ينام، أول طلب يوقظه (30-60ث) |
| `Prisma Client not generated` | تأكد من `npx prisma generate` في build command |
| `CORS error` | تأكد من `CLIENT_URL` يطابق Vercel URL بالضبط |