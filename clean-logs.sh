#!/bin/bash

echo "🧹 Starting log cleanup..."

# Next.js build cache and logs
if [ -d ".next" ]; then
    echo "Cleaning Next.js cache and traces..."
    rm -rf .next/cache
    rm -f .next/trace
    rm -rf .next/server/app-paths-manifest.json
    echo "✅ Next.js cache cleaned"
fi

# Node modules logs
echo "Cleaning node_modules logs..."
find ./node_modules -name "*.log" -type f -delete 2>/dev/null
find ./node_modules -name "debug.log" -type f -delete 2>/dev/null
find ./node_modules -name "error.log" -type f -delete 2>/dev/null
echo "✅ Node modules logs cleaned"

# Root directory logs
echo "Cleaning root directory logs..."
rm -f npm-debug.log* 2>/dev/null
rm -f yarn-error.log* 2>/dev/null
rm -f pnpm-debug.log* 2>/dev/null
rm -f lerna-debug.log* 2>/dev/null
echo "✅ Root logs cleaned"

# Temp files
echo "Cleaning temp files..."
rm -rf /tmp/next-* 2>/dev/null
rm -rf /tmp/.next-* 2>/dev/null
echo "✅ Temp files cleaned"

# Check disk space saved
echo ""
echo "📊 Cleanup complete!"
echo "Current .next directory size: $(du -sh .next 2>/dev/null | cut -f1)"
echo "Current project size: $(du -sh . 2>/dev/null | cut -f1)"