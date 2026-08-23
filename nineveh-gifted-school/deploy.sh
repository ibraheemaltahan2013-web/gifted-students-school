#!/bin/bash
# deploy.sh - Quick deploy script for Google Cloud Run
# Usage: ./deploy.sh [PROJECT_ID] [REGION]

set -e

PROJECT_ID=${1:-$GCP_PROJECT_ID}
REGION=${2:-us-central1}
SERVICE_NAME_API="nineveh-api"
SERVICE_NAME_WEB="nineveh-web"

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: PROJECT_ID required"
    echo "Usage: ./deploy.sh YOUR_PROJECT_ID [REGION]"
    exit 1
fi

echo "🚀 Deploying to Google Cloud Run"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"

# Check gcloud
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Install: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "📋 Enabling APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

# Build and deploy backend
echo "🔨 Building Backend..."
gcloud builds submit ./server \
  --tag gcr.io/$PROJECT_ID/$SERVICE_NAME_API \
  --project=$PROJECT_ID

echo "🚀 Deploying Backend..."
gcloud run deploy $SERVICE_NAME_API \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME_API \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 3001 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=production,DATABASE_URL=$DATABASE_URL,JWT_SECRET=$JWT_SECRET,CLIENT_URL=https://$SERVICE_NAME_WEB-$PROJECT_ID.$REGION.run.app

# Get backend URL
BACKEND_URL=$(gcloud run services describe $SERVICE_NAME_API --region=$REGION --format='value(status.url)')
echo "✅ Backend deployed: $BACKEND_URL"

# Build and deploy frontend
echo "🔨 Building Frontend..."
gcloud builds submit ./client \
  --tag gcr.io/$PROJECT_ID/$SERVICE_NAME_WEB \
  --project=$PROJECT_ID

echo "🚀 Deploying Frontend..."
gcloud run deploy $SERVICE_NAME_WEB \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME_WEB \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --memory 256Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe $SERVICE_NAME_WEB --region=$REGION --format='value(status.url)')
echo "✅ Frontend deployed: $FRONTEND_URL"

# Update backend CORS
echo "🔗 Updating Backend CORS..."
gcloud run services update $SERVICE_NAME_API \
  --region=$REGION \
  --update-env-vars CLIENT_URL=$FRONTEND_URL

echo ""
echo "🎉 Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Frontend: $FRONTEND_URL"
echo "🔌 Backend:  $BACKEND_URL"
echo "📊 Prisma Studio: Run locally with: npx prisma studio"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"