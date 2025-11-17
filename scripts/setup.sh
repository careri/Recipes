#!/bin/bash

# Setup script for Google App Engine development environment

set -e

echo "🔧 Setting up Google App Engine development environment..."

# Check if Google Cloud SDK is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud SDK not found!"
    echo "Please install Google Cloud SDK first:"
    echo "  curl https://sdk.cloud.google.com | bash"
    echo "  exec -l \$SHELL"
    echo ""
    echo "Then initialize it:"
    echo "  gcloud init"
    exit 1
fi

# Check if gcloud is initialized
if ! gcloud config get-value project &>/dev/null; then
    echo "⚠️  Google Cloud SDK not initialized!"
    echo "Please run: gcloud init"
    echo "Continuing anyway..."
fi

cd recipes-app

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "🐍 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

echo "✅ Setup complete!"
echo ""
echo "To start the development server, run:"
echo "  ../scripts/run-local.sh"