#!/bin/bash

echo "🔍 Testing production build configuration..."

# Set production environment
export NODE_ENV=production
export NEXT_PUBLIC_ENABLE_FIXED_UI_MODE=false

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf out

# Build the application
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Start production server
echo "🚀 Starting production server on port 3001..."
echo "Visit http://localhost:3001 to test"
npm run start -- -p 3001