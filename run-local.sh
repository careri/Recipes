#!/bin/bash

# Local development script for Google App Engine

set -e

echo "🏠 Starting local Google App Engine development server..."

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

# Set environment variables for local development
export BUCKET_NAME=recipes-storage-bucket
export GOOGLE_CLOUD_PROJECT=carlkatrin-com

# Start local development server
echo "🚀 Starting Flask development server..."
echo "🌐 Frontend: http://localhost:8080"
echo "🔗 API: http://localhost:8080/api/recipes"
echo ""
echo "Press Ctrl+C to stop"
python main.py