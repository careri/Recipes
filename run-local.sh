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
echo "🗄️  Starting Google Cloud Storage emulator (fake-gcs-server)..."

# Check if Docker is running
if docker info >/dev/null 2>&1; then
    echo "🐳 Docker is available, starting fake-gcs-server..."
    # Use fake-gcs-server as the Cloud Storage emulator
    docker run -d --name fake-gcs-server \
      -p 9023:9023 \
      -v /tmp/fake-gcs-server:/data \
      fsouza/fake-gcs-server:latest \
      -scheme http \
      -host 0.0.0.0 \
      -port 9023 \
      -data /data &
    EMULATOR_PID=$!
    USE_DOCKER=true
else
    echo "🐳 Docker not available, falling back to local file storage"
    echo "💡 To use GCP simulator, start Docker Desktop and restart this script"
    USE_DOCKER=false
    # Set a dummy PID for cleanup
    EMULATOR_PID=""
fi

# Wait for emulator to start (only if using Docker)
if [ "$USE_DOCKER" = true ]; then
    echo "⏳ Waiting for emulator to start..."
    sleep 5
else
    # Skip waiting if not using Docker
    echo "⏳ Skipping emulator wait (using local storage)..."
fi

# Wait for emulator to start (longer wait time)
echo "⏳ Waiting for emulator to start..."
sleep 5

# Check if emulator is responding (only if using Docker)
if [ "$USE_DOCKER" = true ]; then
    echo "🔍 Checking emulator status..."
    MAX_RETRIES=10
    RETRY_COUNT=0
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if curl -s "http://localhost:9023/storage/v1/b" >/dev/null 2>&1; then
            echo "✅ Emulator is ready!"
            break
        fi
        echo "⏳ Still waiting for emulator... ($((RETRY_COUNT + 1))/$MAX_RETRIES)"
        sleep 2
        RETRY_COUNT=$((RETRY_COUNT + 1))
    done

    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo "❌ Emulator failed to start after $MAX_RETRIES attempts"
        echo "🛑 Stopping emulator..."
        kill $EMULATOR_PID 2>/dev/null || true
        docker stop fake-gcs-server 2>/dev/null || true
        docker rm fake-gcs-server 2>/dev/null || true
        exit 1
    fi
else
    echo "🔍 Skipping emulator check (using local storage)..."
fi

# Create bucket in emulator (only if using Docker)
if [ "$USE_DOCKER" = true ]; then
    echo "📦 Creating bucket in emulator..."
    if curl -X POST "http://localhost:9023/storage/v1/b/${BUCKET_NAME}?project=${GOOGLE_CLOUD_PROJECT}" 2>/dev/null; then
        echo "✅ Bucket created successfully"
    else
        echo "⚠️  Bucket creation failed or already exists"
    fi
else
    echo "📦 Skipping bucket creation (using local storage)..."
fi

# Start local development server
echo "🚀 Starting Flask development server..."
echo "🌐 Frontend: http://localhost:8080"
echo "🔗 API: http://localhost:8080/api/recipes"
echo "🗄️  Storage Emulator: http://localhost:9023"
echo ""
echo "Press Ctrl+C to stop"
python main.py &
FLASK_PID=$!

# Cleanup function
cleanup() {
    echo "🛑 Stopping services..."
    if [ "$USE_DOCKER" = true ]; then
        docker stop fake-gcs-server 2>/dev/null || true
        docker rm fake-gcs-server 2>/dev/null || true
    fi
    kill $EMULATOR_PID $FLASK_PID 2>/dev/null || true
    exit 0
}

# Set trap to cleanup on exit
trap cleanup INT TERM

# Wait for processes
wait