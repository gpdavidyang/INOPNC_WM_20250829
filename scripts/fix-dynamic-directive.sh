#!/bin/bash

# Script to add 'export const dynamic = "force-dynamic"' to page.tsx files
# that use Supabase server-side operations but don't have the directive

set -e

echo "🔍 Finding page.tsx files that need the dynamic directive..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_FILES=0
FIXED_FILES=0
SKIPPED_FILES=0
ERROR_FILES=0

# Create temporary files for processing
TEMP_FILES_WITH_SUPABASE=$(mktemp)
TEMP_FILES_WITH_DIRECTIVE=$(mktemp)
TEMP_FILES_TO_FIX=$(mktemp)

# Cleanup function
cleanup() {
    rm -f "$TEMP_FILES_WITH_SUPABASE" "$TEMP_FILES_WITH_DIRECTIVE" "$TEMP_FILES_TO_FIX"
}
trap cleanup EXIT

echo "📋 Step 1: Finding all page.tsx files that import from @/lib/supabase/server..."

# Find all page.tsx files that import from @/lib/supabase/server
grep -r -l "@/lib/supabase/server" --include="page.tsx" app/ > "$TEMP_FILES_WITH_SUPABASE" 2>/dev/null || true

if [ ! -s "$TEMP_FILES_WITH_SUPABASE" ]; then
    echo -e "${YELLOW}⚠️  No page.tsx files found that import from @/lib/supabase/server${NC}"
    exit 0
fi

echo -e "${BLUE}Found $(wc -l < "$TEMP_FILES_WITH_SUPABASE") files importing from @/lib/supabase/server${NC}"

echo "📋 Step 2: Finding files that already have the dynamic directive..."

# Find files that already have the directive
grep -r -l "export const dynamic = ['\"]force-dynamic['\"]" --include="page.tsx" app/ > "$TEMP_FILES_WITH_DIRECTIVE" 2>/dev/null || true

echo -e "${BLUE}Found $(wc -l < "$TEMP_FILES_WITH_DIRECTIVE") files that already have the directive${NC}"

echo "📋 Step 3: Identifying files that need to be fixed..."

# Find files that need fixing (have supabase import but no directive)
if [ -s "$TEMP_FILES_WITH_DIRECTIVE" ]; then
    comm -23 <(sort "$TEMP_FILES_WITH_SUPABASE") <(sort "$TEMP_FILES_WITH_DIRECTIVE") > "$TEMP_FILES_TO_FIX"
else
    cp "$TEMP_FILES_WITH_SUPABASE" "$TEMP_FILES_TO_FIX"
fi

TOTAL_FILES=$(wc -l < "$TEMP_FILES_TO_FIX")

if [ "$TOTAL_FILES" -eq 0 ]; then
    echo -e "${GREEN}✅ All page.tsx files already have the dynamic directive!${NC}"
    exit 0
fi

echo -e "${YELLOW}📝 Found $TOTAL_FILES files that need the dynamic directive${NC}"
echo ""

# Function to check if file uses server-side auth operations
check_server_auth_usage() {
    local file="$1"
    # Check for common server-side auth patterns
    if grep -q "\.auth\.getUser\(\)\|\.auth\.getSession\(\)\|supabase\.auth" "$file"; then
        return 0  # Found server auth usage
    fi
    return 1  # No server auth usage found
}

# Function to add dynamic directive to a file
add_dynamic_directive() {
    local file="$1"
    local temp_file=$(mktemp)
    
    # Check if the file starts with imports
    if head -1 "$file" | grep -q "^import"; then
        # Add the directive after the last import statement
        awk '
        /^import/ { imports[++import_count] = $0; next }
        !printed_directive && !/^$/ && !/^import/ {
            # Print all imports first
            for (i = 1; i <= import_count; i++) {
                print imports[i]
            }
            # Add empty line and directive
            print ""
            print "export const dynamic = \"force-dynamic\""
            print ""
            # Print current line
            print $0
            printed_directive = 1
            next
        }
        { print }
        END {
            # If we only had imports and no other content, add directive at end
            if (!printed_directive) {
                for (i = 1; i <= import_count; i++) {
                    print imports[i]
                }
                print ""
                print "export const dynamic = \"force-dynamic\""
                print ""
            }
        }
        ' "$file" > "$temp_file"
    else
        # File doesn't start with imports, add directive at the top
        {
            echo 'export const dynamic = "force-dynamic"'
            echo ""
            cat "$file"
        } > "$temp_file"
    fi
    
    # Replace original file
    mv "$temp_file" "$file"
}

echo "🔧 Processing files..."
echo ""

# Process each file
while IFS= read -r file; do
    if [ -z "$file" ]; then
        continue
    fi
    
    echo -e "${BLUE}Processing: $file${NC}"
    
    # Check if file exists
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ File not found: $file${NC}"
        ((ERROR_FILES++))
        continue
    fi
    
    # Check if it uses server-side auth operations
    if check_server_auth_usage "$file"; then
        echo -e "${YELLOW}  📊 Found server-side auth usage${NC}"
        
        # Create backup
        cp "$file" "$file.backup"
        
        # Add dynamic directive
        if add_dynamic_directive "$file"; then
            echo -e "${GREEN}  ✅ Added dynamic directive${NC}"
            ((FIXED_FILES++))
            
            # Clean up backup on success
            rm -f "$file.backup"
        else
            echo -e "${RED}  ❌ Failed to add directive${NC}"
            # Restore from backup
            mv "$file.backup" "$file"
            ((ERROR_FILES++))
        fi
    else
        echo -e "${YELLOW}  ⏭️  No server-side auth usage found - skipping${NC}"
        ((SKIPPED_FILES++))
    fi
    
    echo ""
done < "$TEMP_FILES_TO_FIX"

# Summary
echo "📊 Summary:"
echo -e "${BLUE}Total files processed: $TOTAL_FILES${NC}"
echo -e "${GREEN}Files fixed: $FIXED_FILES${NC}"
echo -e "${YELLOW}Files skipped (no auth usage): $SKIPPED_FILES${NC}"
echo -e "${RED}Files with errors: $ERROR_FILES${NC}"
echo ""

if [ "$FIXED_FILES" -gt 0 ]; then
    echo -e "${GREEN}✅ Successfully added dynamic directive to $FIXED_FILES files!${NC}"
    echo ""
    echo "🚀 Fixed files:"
    while IFS= read -r file; do
        if [ -n "$file" ] && check_server_auth_usage "$file"; then
            echo "  - $file"
        fi
    done < "$TEMP_FILES_TO_FIX"
    echo ""
    echo "💡 Run 'npm run build' to verify all fixes are working correctly."
else
    echo -e "${YELLOW}⚠️  No files were fixed. This could mean:${NC}"
    echo "  - All files already have the directive"
    echo "  - No files found that use server-side auth operations"
    echo "  - All operations encountered errors"
fi

if [ "$ERROR_FILES" -gt 0 ]; then
    echo ""
    echo -e "${RED}⚠️  $ERROR_FILES files encountered errors. Please check them manually.${NC}"
    exit 1
fi