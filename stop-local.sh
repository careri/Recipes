#!/bin/bash

# Stop script for local development services

echo "🛑 Stopping local development services..."

# Stop fake-gcs-server if running
if docker ps | grep -q fake-gcs-server; then
    echo "🐳 Stopping fake-gcs-server..."
    docker stop fake-gcs-server
    docker rm fake-gcs-server
else
    echo "🐳 fake-gcs-server not running"
fi

# Stop Flask processes
if pgrep -f "python main.py" >/dev/null; then
    echo "🐍 Stopping Flask development server..."
    pkill -f "python main.py"
else
    echo "🐍 Flask development server not running"
fi

echo "✅ All services stopped"