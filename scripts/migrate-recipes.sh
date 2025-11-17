#!/bin/bash

# Migrate existing recipes to the application via API

set -e

echo "📤 Migrating recipes to application via API..."

API_BASE="http://localhost:8080/api"

# Check if Flask server is running
echo "🔍 Checking if Flask server is running..."
if ! curl -s "$API_BASE/config" >/dev/null 2>&1; then
    echo "❌ Flask server is not running at $API_BASE"
    echo "Please start the server with: ./gradlew runLocal"
    exit 1
fi

echo "✅ Flask server is running"

# Upload all recipe files via API
echo "📦 Uploading recipe files via API..."
uploaded=0
failed=0

for file in recipes/*.json; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        echo "Uploading $filename..."

        # Post the recipe to the API
        response=$(curl -s -w "%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -d @"$file" \
            "$API_BASE/recipes" 2>/dev/null)

        http_code=${response: -3}
        response_body=${response:0:${#response}-3}

        if [ "$http_code" = "201" ]; then
            echo "✅ Successfully uploaded $filename"
            uploaded=$((uploaded + 1))
        else
            echo "❌ Failed to upload $filename (HTTP $http_code): $response_body"
            failed=$((failed + 1))
        fi
    fi
done

echo ""
echo "� Migration completed!"
echo "✅ Successfully uploaded: $uploaded recipes"
if [ "$failed" -gt 0 ]; then
    echo "❌ Failed to upload: $failed recipes"
    exit 1
fi