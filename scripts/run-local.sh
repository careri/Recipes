#!/bin/bash

# Check if Google Cloud SDK is installed and initialized
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud SDK not found!"
    echo "Please install Google Cloud SDK first:"
    echo "  curl https://sdk.cloud.google.com | bash"
    echo "  exec -l \$SHELL"
    echo "  gcloud init"
    exit 1
fi

# Check if gcloud is initialized
if ! gcloud config get-value project &>/dev/null; then
    echo "⚠️  Google Cloud SDK not initialized!"
    echo "Please run: gcloud init"
    echo "For now, continuing with default project..."
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

# Set environment variables for local development
export BUCKET_NAME=recipes-storage-bucket
export GOOGLE_CLOUD_PROJECT=carlkatrin-com
export STORAGE_EMULATOR_HOST=http://localhost:9023

# Start Google Cloud Storage emulator in background
echo "🗄️  Starting Google Cloud Storage emulator..."

# Check if Docker is running
if docker info >/dev/null 2>&1; then
    echo "🐳 Docker is available, starting fake-gcs-server..."
    # Clean up any existing container
    docker stop fake-gcs-server 2>/dev/null || true
    docker rm fake-gcs-server 2>/dev/null || true

    # Use fake-gcs-server as the Cloud Storage emulator
    docker run -d --name fake-gcs-server \
      -p 9023:9023 \
      -v /tmp/fake-gcs-server:/data \
      fsouza/fake-gcs-server:latest \
      -scheme http \
      -host 0.0.0.0 \
      -port 9023 \
      -data /data
    sleep 3

    # Check if emulator is responding
    echo "🔍 Checking emulator status..."
    if curl -s "http://localhost:9023/storage/v1/b" >/dev/null 2>&1; then
        echo "✅ Emulator is ready!"

        # Create bucket in emulator
        echo "📦 Creating bucket in emulator..."
        curl -X POST "http://localhost:9023/storage/v1/b/${BUCKET_NAME}?project=${GOOGLE_CLOUD_PROJECT}" 2>/dev/null || echo "⚠️  Bucket creation failed or already exists"
    else
        echo "❌ Emulator failed to start"
        docker stop fake-gcs-server 2>/dev/null || true
        docker rm fake-gcs-server 2>/dev/null || true
        exit 1
    fi
else
    echo "� Docker not available, using local file storage"
    echo "� To use GCP simulator, start Docker Desktop and restart this script"
fi

# Start local development server
echo "🚀 Starting Flask development server..."
echo "🌐 Frontend: http://localhost:8080"
echo "🔗 API: http://localhost:8080/api/recipes"
if docker info >/dev/null 2>&1; then
    echo "🗄️  Storage Emulator: http://localhost:9023"
fi
echo ""
echo "Services are running in background. To stop them, run:"
echo "  ./stop-local.sh"
echo ""
echo "Or press Ctrl+C to stop Flask (emulator will keep running)"

# Start Flask with nohup so it keeps running after script exits
nohup python main.py > flask.log 2>&1 &
FLASK_PID=$!

echo "✅ Flask started with PID: $FLASK_PID"
echo "📝 Logs available in: recipes-app/flask.log"

# Wait a moment then exit (services keep running)
sleep 2