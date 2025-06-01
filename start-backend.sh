#!/bin/bash

# Start Backend Server
echo "🚀 Starting NHS Care Management Platform Backend..."

cd /Users/valentinechideme/Documents/shift-hero/nhs-care-homes-app/backend

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    exit 1
fi

# Start the server
echo "📡 Starting server on port 5000..."
node src/app.js
