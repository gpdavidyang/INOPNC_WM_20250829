#!/bin/bash

# Fix missing imports in API routes
echo "🔍 Fixing missing imports in API routes..."

# Find files that use createClient or NextResponse without importing them
find app/api -name "*.ts" -type f | while read file; do
    # Check if file uses createClient but doesn't import it
    if grep -q "createClient()" "$file" && ! grep -q "import.*createClient" "$file"; then
        echo "→ Adding createClient import to: $file"
        sed -i '' '1s/^/import { createClient } from '\''@\/lib\/supabase\/server'\''\n/' "$file"
    fi
    
    # Check if file uses NextResponse but doesn't import it
    if grep -q "NextResponse\." "$file" && ! grep -q "import.*NextResponse" "$file"; then
        echo "→ Adding NextResponse import to: $file"
        sed -i '' '1s/^/import { NextResponse } from '\''next\/server'\''\n/' "$file"
    fi
    
    # Check if file uses NextRequest but doesn't import it
    if grep -q "NextRequest" "$file" && ! grep -q "import.*NextRequest" "$file"; then
        echo "→ Adding NextRequest import to: $file"
        sed -i '' '1s/^/import { NextRequest } from '\''next\/server'\''\n/' "$file"
    fi
    
    # Check if file uses cookies but doesn't import it
    if grep -q "cookies()" "$file" && ! grep -q "import.*cookies" "$file"; then
        echo "→ Adding cookies import to: $file"
        sed -i '' '1s/^/import { cookies } from '\''next\/headers'\''\n/' "$file"
    fi
done

echo "✅ Imports fixed!"