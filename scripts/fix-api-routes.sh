#!/bin/bash

# Function to add export const dynamic = 'force-dynamic' to a file
add_dynamic_export() {
    local file=$1
    
    # Check if the file already has the export
    if grep -q "export const dynamic" "$file"; then
        echo "✓ Already has dynamic export: $file"
        return
    fi
    
    # Check if file uses cookies or createClient
    if grep -q "cookies\|createClient" "$file"; then
        echo "→ Adding dynamic export to: $file"
        
        # Add the export after imports (find the last import line)
        awk '
            /^import/ { imports = imports $0 "\n"; next }
            !printed && !/^import/ && NR > 1 { 
                print imports "\nexport const dynamic = '\''force-dynamic'\''\n"
                printed = 1
            }
            { print }
        ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
    fi
}

# Find all TypeScript API route files
echo "🔍 Scanning API routes..."

# Process all API route files
for file in $(find app/api -name "*.ts" -type f); do
    add_dynamic_export "$file"
done

echo "✅ API routes fixed!"