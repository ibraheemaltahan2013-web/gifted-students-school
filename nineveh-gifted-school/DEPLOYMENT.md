# 🚀 Deployment Guide - Nineveh Gifted School

## **Quick Start (Local Docker)**

```bash
# 1. Clone and navigate
cd nineveh-gifted-school

# 2. Create environment file
cp .env.deploy.example .env.local
# Edit .env.local with your values

# 3. Run with Docker Compose
docker-compose up -d

# 4. Access
# Frontend: http://localhost:8080
# Backend:  http://localhost:3001
# Prisma Studio: http://localhost:5555 (run with --profile tools)
```

---

## **Google Cloud Run Deployment**

### **Prerequisites**
- Google Cloud Account with billing enabled
- `gcloud` CLI installed and authenticated
- Project with Cloud Run, Cloud Build, Artifact Registry APIs enabled

### **Option 1: Automated Script (Recommended)**

```bash
# 1. Set environment variables
export GCP_PROJECT_ID="your-project-id"
export DATABASE_URL="postgresql://..."
export JWT_SECRET="your-secret"

# 2. Run deploy script
chmod +x deploy.sh
./deploy.sh $GCP_PROJECT_ID us-central1
```

### **Option 2: Manual Step-by-Step**

```bash
# 1. Set project
gcloud config set project YOUR_PROJECT_ID

# 2. Enable APIs
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com sqladmin.googleapis.com

# 3. Create Cloud SQL Instance (PostgreSQL 15)
gcloud sql instances create nineveh-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=YOUR_DB_PASSWORD

# 4. Create database
gcloud sql databases create nineveh_gifted_school --instance=nineveh-db

# 5. Get connection name
gcloud sql instances describe nineveh-db --format="value(connectionName)"
# Output: project:region:instance-name

# 6. Build & Deploy Backend
gcloud builds submit ./server --tag gcr.io/$PROJECT_ID/nineveh-api

gcloud run deploy nineveh-api \
  --image gcr.io/$PROJECT_ID/nineveh-api \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3001 \
  --add-cloudsql-instances PROJECT:REGION:INSTANCE \
  --set-env-vars NODE_ENV=production,DATABASE_URL="postgresql://postgres:PASSWORD@/nineveh_gifted_school?host=/cloudsql/PROJECT:REGION:INSTANCE",JWT_SECRET=YOUR_SECRET

# 7. Build & Deploy Frontend
gcloud builds submit ./client --tag gcr.io/$PROJECT_ID/nineveh-web

gcloud run deploy nineveh-web \
  --image gcr.io/$PROJECT_ID/nineveh-web \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080

# 8. Update Backend CORS with Frontend URL
FRONTEND_URL=$(gcloud run services describe nineveh-web --region=us-central1 --format='value(status.url)')
gcloud run services update nineveh-api --region=us-central1 --update-env-vars CLIENT_URL=$FRONTEND_URL
```

### **Option 3: GitHub Actions (CI/CD)**

1. **Add Repository Secrets:**
   - `GCP_PROJECT_ID` - Your Google Cloud Project ID
   - `GCP_REGION` - e.g., `us-central1`
   - `GCP_SA_KEY` - Service Account JSON key (with Cloud Run Admin, Cloud Build Editor, Artifact Registry Writer)
   - `DATABASE_URL` - Cloud SQL connection string
   - `JWT_SECRET` - Your JWT secret
   - `FRONTEND_URL` - Will be auto-updated

2. **Push to main branch** - Automatic deployment triggers

---

## **Cloud SQL Setup Details**

### **Create Service Account for Cloud Run**
```bash
# Create service account
gcloud iam service-accounts create nineveh-runner \
  --display-name="Nineveh Cloud Run Runner"

# Grant permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:nineveh-runner@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# Use in Cloud Run deploy
gcloud run deploy nineveh-api \
  --service-account=nineveh-runner@$PROJECT_ID.iam.gserviceaccount.com \
  ...
```

### **Database Migrations**
```bash
# Run migrations after deploy
gcloud run jobs create nineveh-migrate \
  --image gcr.io/$PROJECT_ID/nineveh-api \
  --region us-central1 \
  --command "npx" --args "prisma,migrate,deploy" \
  --add-cloudsql-instances PROJECT:REGION:INSTANCE \
  --set-env-vars DATABASE_URL="postgresql://..."

# Execute
gcloud run jobs execute nineveh-migrate --region us-central1 --wait
```

---

## **Custom Domain (Optional)**

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service nineveh-web \
  --domain school.nineveh.edu.iq \
  --region us-central1

# Update DNS with provided records
```

---

## **Monitoring & Logs**

```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=nineveh-api" --limit 50

# Stream logs
gcloud run services logs tail nineveh-api --region us-central1

# Metrics in Cloud Console: Monitoring > Dashboards > Cloud Run
```

---

## **Rollback**

```bash
# List revisions
gcloud run revisions list --service nineveh-api --region us-central1

# Rollback to previous
gcloud run services update-traffic nineveh-api \
  --to-revisions=REVISION_NAME=100 \
  --region us-central1
```

---

## **Cost Estimation (Monthly)**

| Service | Tier | Est. Cost |
|---------|------|-----------|
| Cloud Run (Frontend) | 256MiB, 0-10 instances | ~$0-5 |
| Cloud Run (Backend) | 512MiB, 0-10 instances | ~$0-10 |
| Cloud SQL (db-f1-micro) | 1 vCPU, 0.6GB RAM | ~$7-15 |
| Artifact Registry | Storage + Network | ~$1-2 |
| **Total** | | **~$8-32/month** |

*Free tier covers first 2M requests, 360M vCPU-seconds, 180M GiB-seconds*

---

## **Troubleshooting**

| Issue | Solution |
|-------|----------|
| `Database connection failed` | Check Cloud SQL Auth Proxy, connection name, firewall |
| `CORS error` | Verify `CLIENT_URL` matches frontend URL exactly |
| `Prisma migrate failed` | Run migration job manually, check DATABASE_URL |
| `Socket.io not working` | Ensure WebSocket upgrade headers in nginx.conf |
| `Build timeout` | Increase Cloud Build timeout: `--timeout=20m` |

---

## **Security Checklist**

- [ ] Strong JWT_SECRET (32+ chars)
- [ ] Cloud SQL: Private IP only, SSL required
- [ ] Cloud Run: Min instances = 0 (cost), Max = 10 (protection)
- [ ] Service Account: Least privilege (Cloud SQL Client only)
- [ ] Secrets: Use Secret Manager for production
- [ ] Custom Domain: HTTPS enforced, HSTS headers