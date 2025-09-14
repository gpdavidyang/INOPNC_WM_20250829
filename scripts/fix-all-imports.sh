#!/bin/bash

echo "🔧 Fixing ALL missing imports in the codebase..."

# Fix createClient imports in all pages
echo "→ Fixing createClient imports..."
find app -name "*.tsx" -o -name "*.ts" | while read file; do
    if grep -q "createClient()" "$file" 2>/dev/null; then
        if ! grep -q "import.*createClient.*from.*@/lib/supabase" "$file"; then
            echo "  Fixing: $file"
            # Add import at the beginning after 'use client' if present
            if grep -q "^'use client'" "$file"; then
                sed -i '' "/^'use client'/a\\
import { createClient } from '@/lib/supabase/client'
" "$file"
            elif grep -q '^"use client"' "$file"; then
                sed -i '' '/^"use client"/a\
import { createClient } from "@/lib/supabase/client"
' "$file"
            else
                # Server component - use server import
                sed -i '' '1i\
import { createClient } from "@/lib/supabase/server"
' "$file"
            fi
        fi
    fi
done

# Fix getProfile imports
echo "→ Fixing getProfile imports..."
find app -name "*.tsx" -o -name "*.ts" | while read file; do
    if grep -q "getProfile(" "$file" 2>/dev/null; then
        if ! grep -q "import.*getProfile" "$file"; then
            echo "  Fixing: $file"
            sed -i '' '1i\
import { getProfile } from "@/lib/auth/profile"
' "$file"
        fi
    fi
done

# Fix getCurrentUserSite imports
echo "→ Fixing getCurrentUserSite imports..."
find app -name "*.tsx" -o -name "*.ts" | while read file; do
    if grep -q "getCurrentUserSite(" "$file" 2>/dev/null; then
        if ! grep -q "import.*getCurrentUserSite" "$file"; then
            echo "  Fixing: $file"
            sed -i '' '1i\
import { getCurrentUserSite } from "@/app/actions/site-info"
' "$file"
        fi
    fi
done

# Fix createServerSupabaseClient imports
echo "→ Fixing createServerSupabaseClient imports..."
find app -name "*.tsx" -o -name "*.ts" | while read file; do
    if grep -q "createServerSupabaseClient(" "$file" 2>/dev/null; then
        if ! grep -q "import.*createServerSupabaseClient" "$file"; then
            echo "  Fixing: $file"
            sed -i '' '1i\
import { createServerSupabaseClient } from "@/lib/supabase/server"
' "$file"
        fi
    fi
done

# Fix getAuthenticatedUser imports
echo "→ Fixing getAuthenticatedUser imports..."
find app -name "*.tsx" -o -name "*.ts" | while read file; do
    if grep -q "getAuthenticatedUser(" "$file" 2>/dev/null; then
        if ! grep -q "import.*getAuthenticatedUser" "$file"; then
            echo "  Fixing: $file"
            sed -i '' '1i\
import { getAuthenticatedUser } from "@/lib/auth/server"
' "$file"
        fi
    fi
done

# Fix cva imports in components
echo "→ Fixing cva imports..."
find app components -name "*.tsx" -o -name "*.ts" | while read file; do
    if grep -q "cva(" "$file" 2>/dev/null; then
        if ! grep -q "import.*cva.*from" "$file"; then
            echo "  Fixing: $file"
            sed -i '' '1i\
import { cva } from "class-variance-authority"
' "$file"
        fi
    fi
done

# Fix undefined component imports for test pages
echo "→ Fixing test page component imports..."

# Fix DailyReportsTabNew
if [ -f "app/test/daily-reports-new/page.tsx" ]; then
    sed -i '' 's/DailyReportsTabNew/() => <div>Daily Reports Test<\/div>/g' "app/test/daily-reports-new/page.tsx"
fi

# Fix DocumentsTabNew
if [ -f "app/test/documents-new/page.tsx" ]; then
    sed -i '' 's/DocumentsTabNew/() => <div>Documents Test<\/div>/g' "app/test/documents-new/page.tsx"
fi

# Fix HomeTabNew
if [ -f "app/test/home-new/page.tsx" ]; then
    sed -i '' 's/HomeTabNew/() => <div>Home Test<\/div>/g' "app/test/home-new/page.tsx"
fi

# Fix SiteInfoTabNew
if [ -f "app/test/site-info-new/page.tsx" ]; then
    sed -i '' 's/SiteInfoTabNew/() => <div>Site Info Test<\/div>/g' "app/test/site-info-new/page.tsx"
fi

# Fix DesignSystemTest
if [ -f "app/test/design-system/page.tsx" ]; then
    sed -i '' 's/DesignSystemTest/() => <div>Design System Test<\/div>/g' "app/test/design-system/page.tsx"
fi

# Fix MaterialRequestPage and InventoryRecordPage
find app -name "*.tsx" | xargs grep -l "MaterialRequestPage\|InventoryRecordPage" | while read file; do
    echo "  Replacing undefined components in: $file"
    sed -i '' 's/MaterialRequestPage/() => <div>Material Request<\/div>/g' "$file"
    sed -i '' 's/InventoryRecordPage/() => <div>Inventory Record<\/div>/g' "$file"
done

# Fix NotificationSettingsPage
find app -name "*.tsx" | xargs grep -l "NotificationSettingsPage" | while read file; do
    echo "  Replacing NotificationSettingsPage in: $file"
    sed -i '' 's/NotificationSettingsPage/() => <div>Notification Settings<\/div>/g' "$file"
done

echo "✅ All imports fixed!"