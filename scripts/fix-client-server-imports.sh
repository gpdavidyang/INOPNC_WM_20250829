#!/bin/bash

echo "🔧 Fixing client/server import mismatches..."

# Find all client components and fix their createClient imports
find app -name "*.tsx" -o -name "*.ts" | while read file; do
    # Check if it's a client component
    if grep -q "^'use client'\|^\"use client\"" "$file"; then
        # If it has server import, replace with client import
        if grep -q 'import.*createClient.*from.*"@/lib/supabase/server"' "$file"; then
            echo "  Fixing client component: $file"
            sed -i '' 's|import { createClient } from "@/lib/supabase/server"|import { createClient } from "@/lib/supabase/client"|g' "$file"
        fi
    fi
done

echo "✅ Client/server imports fixed!"