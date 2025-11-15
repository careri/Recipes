#!/bin/bash

# Migrate existing recipes to Google Cloud Storage

set -e

echo "📤 Migrating recipes to Google Cloud Storage..."

BUCKET_NAME="recipes-storage-bucket"
PROJECT_ID="carlkatrin-com"

# Set project
gcloud config set project $PROJECT_ID

# Upload all recipe files
echo "📦 Uploading recipe files..."
gsutil -m cp recipes/*.json gs://$BUCKET_NAME/

echo "✅ Migration completed!"
echo "📊 Recipes uploaded to: gs://$BUCKET_NAME/"