#!/bin/bash

echo "🔍 Fixing missing imports in page files..."

# Fix tasks pages
for file in app/tasks/*.tsx app/tasks/**/*.tsx; do
    if [ -f "$file" ] && grep -q "createClient()" "$file" && ! grep -q "import.*createClient" "$file"; then
        echo "→ Adding createClient import to: $file"
        # Check if it's a client component
        if grep -q "'use client'" "$file"; then
            sed -i '' "/'use client'/a\\
\\
import { createClient } from '@/lib/supabase/client'
" "$file"
        else
            sed -i '' "1s/^/import { createClient } from '@\/lib\/supabase\/server'\n/" "$file"
        fi
    fi
done

# Fix other pages
for file in app/**/*.tsx; do
    if [ -f "$file" ] && grep -q "createClient()" "$file" && ! grep -q "import.*createClient" "$file"; then
        # Skip already processed files
        if [[ "$file" == app/tasks/* ]]; then
            continue
        fi
        
        echo "→ Adding createClient import to: $file"
        # Check if it's a client component
        if grep -q "'use client'" "$file"; then
            sed -i '' "/'use client'/a\\
\\
import { createClient } from '@/lib/supabase/client'
" "$file"
        else
            sed -i '' "1s/^/import { createClient } from '@\/lib\/supabase\/server'\n/" "$file"
        fi
    fi
done

echo "✅ Page imports fixed!"