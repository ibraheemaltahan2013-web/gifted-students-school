# 🚀 Free Deployment Guide - Vercel + Render + Supabase

## **المتطلبات المسبقة:**
- [ ] حساب **GitHub** (لربط المستودع)
- [ ] حساب **Vercel** (مجاني، سجل بـ GitHub)
- [ ] حساب **Render** (مجاني، سجل بـ GitHub)
- [ ] حساب **Supabase** (مجاني، سجل بـ GitHub)

---

## **الخطوة 1: رفع الكود لـ GitHub (2 دقيقة)**

```bash
cd nineveh-gifted-school

# 1. تهيئة Git
git init
git add .
git commit -m "Initial commit: Nineveh Gifted School"

# 2. إنشاء مستودع على GitHub.com → New Repository
#    اسم المستودع: nineveh-gifted-school
#    Public أو Private (كلاهما مجاني)

# 3. ربط ورفع
git remote add origin https://github.com/YOUR_USERNAME/nineveh-gifted-school.git
git branch -M main
git push -u origin main
```

---

## **الخطوة 2: قاعدة البيانات - Supabase (3 دقائق)**

**اتبع `SUPABASE_SETUP.md`** للحصول على:
- `DATABASE_URL` (Pooled connection مع `?pgbouncer=true`)

---

## **الخطوة 3: الباك إند - Render (5 دقائق)**

### **الطريقة أ: عبر Render Dashboard (أسهل)**

1. ادخل **[dashboard.render.com](https://dashboard.render.com)** → `New +` → `Web Service`
2. **Connect Repository** → اختر `nineveh-gifted-school`
3. إعدادات الخدمة:
   ```
   Name: nineveh-api
   Root Directory: server
   Runtime: Node
   Build Command: npm install && npx prisma generate && npx prisma migrate deploy
   Start Command: npm start
   Plan: Free
   Region: Oregon (US West) أو Frankfurt (EU)
   ```
4. **Environment Variables** (اضغط `Add Environment Variable`):
   ```
   NODE_ENV = production
   PORT = 3001
   DATABASE_URL = [your-supabase-pooled-url]
   JWT_SECRET = [سيولد تلقائياً إذا تركته فارغاً]
   JWT_EXPIRES_IN = 7d
   CLIENT_URL = https://nineveh-gifted.vercel.app
   ```
5. **Create Web Service** → انتظر البناء (3-5 دقائق)

### **الطريقة ب: باستخدام render.yaml (أسرع)**

إذا رفعت `server/render.yaml`، Render سيكتشفه تلقائياً:
1. `New +` → `Blueprint` → اختر المستودع
2. سيقرأ `render.yaml` وينشئ الخدمة + قاعدة البيانات

---

## **الخطوة 4: الفرونت إند - Vercel (3 دقائق)**

### **الطريقة أ: عبر Vercel Dashboard**

1. ادخل **[vercel.com/new](https://vercel.com/new)** → `Import Git Repository`
2. اختر `nineveh-gifted-school`
3. إعدادات المشروع:
   ```
   Framework Preset: Vite
   Root Directory: client
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```
4. **Environment Variables**:
   ```
   VITE_API_URL = https://nineveh-api.onrender.com
   ```
5. **Deploy** → انتظر (1-2 دقيقة)

### **الطريقة ب: Vercel CLI (أسرع)**

```bash
cd client
npx vercel --prod
# سيطلب: Link to existing project? N
# Project name: nineveh-gifted
# Directory: ./
# Override settings? N
```

---

## **الخطوة 5: ربط CORS (مهم!)**

بعد الحصول على **Vercel URL** (مثلاً: `https://nineveh-gifted.vercel.app`):

1. في **Render Dashboard** → خدمة `nineveh-api` → `Environment`
2. عدل `CLIENT_URL`:
   ```
   CLIENT_URL = https://nineveh-gifted.vercel.app
   ```
3. **Save Changes** → سيعيد النشر تلقائياً

---

## **الخطوة 6: اختبار التطبيق**

| الخدمة | الرابط المتوقع |
|----------|---------------|
| **Frontend** | `https://nineveh-gifted.vercel.app` |
| **Backend API** | `https://nineveh-api.onrender.com/api/health` |
| **WebSocket** | `wss://nineveh-api.onrender.com/socket.io/` |

### **اختبار سريع:**
1. افتح Vercel URL
2. سجل دخول: `admin@school.com` / `password123` (بعد إنشاء مستخدم)
3. اختبر: الرسائل، الواجبات، الحضور

---

## **🔧 حل المشاكل الشائعة:**

### **1. "Network Error" أو CORS:**
```bash
# تأكد من:
# 1. CLIENT_URL في Render يطابق Vercel URL بالضبط (بدون / في النهاية)
# 2. لا يوجد trailing slash في كليهما
# 3. Vercel URL يبدأ بـ https://
```

### **2. "Database connection failed":**
```bash
# في Render Environment Variables:
# DATABASE_URL يجب أن يكون Pooled URL من Supabase
# ويحتوي على ?pgbouncer=true في النهاية
# مثال: postgresql://postgres.xxx:pass@pooler.supabase.com:6543/postgres?pgbouncer=true
```

### **3. "Prisma migrate failed":**
```bash
# في Render Build Command:
npm install && npx prisma generate && npx prisma migrate deploy
# تأكد من وجود migrate deploy
```

### **4. "Service sleeping" (أول طلب بطيء):**
- Render Free ينام بعد 15 دقيقة عدم استخدام
- الحل: استخدم **UptimeRobot** (مجاني) → أضف Monitor لـ `https://nineveh-api.onrender.com/api/health` كل 5 دقائق

### **5. "WebSocket connection failed":**
```bash
# في client/vercel.json تأكد من rewrites
# في server/src/index.js: CORS origin يطابق CLIENT_URL
# Render يدعم WebSocket تلقائياً على Free plan
```

---

## **📊 المراقبة المجانية:**

| الأداة | الاستخدام |
|--------|-----------|
| **Render Logs** | `Dashboard → Service → Logs` |
| **Vercel Analytics** | `Project → Analytics` (مجاني) |
| **Supabase Logs** | `Dashboard → Logs → Database` |
| **UptimeRobot** | مراقبة uptime + إيقاظ الخدمة |

---

## **💰 التكلفة: $0/شهر للأبد**

| الخدمة | الخطة المجانية |
|----------|---------------|
| Vercel | 100GB bandwidth، builds غير محدودة |
| Render | 750 ساعة/شهر، PostgreSQL مجاني |
| Supabase | 500MB DB، 2GB bandwidth، Auth |
| **المجموع** | **$0** |

---

## **🔄 التحديثات المستقبلية:**

```bash
# أي تعديل في الكود:
git add .
git commit -m "Update: feature description"
git push origin main
# Vercel + Render سيعيدان النشر تلقائياً!
```

---

## **📞 الدعم:**

- **Vercel Docs:** vercel.com/docs
- **Render Docs:** render.com/docs
- **Supabase Docs:** supabase.com/docs
- **Prisma Deploy:** prisma.io/docs/guides/deployment