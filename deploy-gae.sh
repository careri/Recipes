#!/bin/bash

# Google App Engine Deployment Script for carlkatrin.com

set -e

echo "🚀 Starting Google App Engine Deployment to carlkatrin.com"

# Check prerequisites
echo "📋 Checking prerequisites..."
command -v gcloud >/dev/null 2>&1 || { echo "❌ Google Cloud SDK is required but not installed. Aborting."; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "❌ Python 3 is required but not installed. Aborting."; exit 1; }

# Check if authenticated
echo "🔐 Checking Google Cloud authentication..."
gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1 >/dev/null || {
    echo "❌ Not authenticated with Google Cloud. Run: gcloud auth login"
    exit 1
}

# Set project
PROJECT_ID="carlkatrin-com"
echo "🔧 Setting project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔌 Enabling required Google Cloud APIs..."
gcloud services enable appengine.googleapis.com
gcloud services enable storage-api.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Create storage bucket if it doesn't exist
BUCKET_NAME="recipes-storage-bucket"
echo "📦 Creating storage bucket: $BUCKET_NAME"
gsutil mb -p $PROJECT_ID gs://$BUCKET_NAME || echo "Bucket may already exist"

# Set bucket permissions for public access (for frontend static files)
echo "🔓 Setting bucket permissions..."
gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME

# Deploy to App Engine
echo "🚀 Deploying to Google App Engine..."
gcloud app deploy --quiet

# Get the service URL
SERVICE_URL=$(gcloud app describe --format="value(defaultHostname)")
echo ""
echo "✅ Deployment completed!"
echo ""
echo "🌐 Your app is available at:"
echo "   Frontend: https://$SERVICE_URL"
echo "   API: https://$SERVICE_URL/api/recipes"
echo ""
echo "📋 DNS Configuration (Google Domains):"
echo "======================================"
echo ""
echo "You need to add these DNS records in Google Domains:"
echo ""
echo "1. For www.carlkatrin.com:"
echo "   Type: CNAME"
echo "   Name: www"
echo "   Value: ghs.googlehosted.com"
echo ""
echo "2. For api.carlkatrin.com:"
echo "   Type: CNAME"
echo "   Name: api"
echo "   Value: ghs.googlehosted.com"
echo ""
echo "📍 Go to: https://domains.google.com"
echo "   Select carlkatrin.com → DNS → Add the records above"
echo ""
echo "⚠️  Note: App Engine URLs will be different until DNS propagates."
echo "   Use the URLs above for testing immediately after deployment."