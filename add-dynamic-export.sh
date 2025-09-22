#!/bin/bash
# Script to add dynamic export to dashboard pages

PAGES=(
"app/dashboard/attendance/page.tsx"
"app/dashboard/site-info/page.tsx"
"app/dashboard/daily-reports/page.tsx"
"app/dashboard/notifications/page.tsx"
"app/dashboard/analytics/page.tsx"
"app/dashboard/equipment/page.tsx"
"app/dashboard/tools/photo-grid/page.tsx"
"app/dashboard/notifications/analytics/page.tsx"
"app/dashboard/performance/page.tsx"
"app/dashboard/profile/page.tsx"
"app/dashboard/materials/page.tsx"
"app/dashboard/test-site-info/page.tsx"
"app/dashboard/test-db/page.tsx"
"app/dashboard/test-notifications/page.tsx"
"app/dashboard/settings/page.tsx"
)

for page in "${PAGES[@]}"; do
  if [ -f "$page" ]; then
    # Check if dynamic export already exists
    if ! grep -q "export const dynamic" "$page"; then
      echo "Adding dynamic export to $page"
      # Find the first import line and add dynamic export after all imports
      awk '
        BEGIN { added = 0 }
        /^import/ { imports = 1 }
        /^$/ && imports && !added { 
          print "export const dynamic = '\''force-dynamic'\''"
          print ""
          added = 1
          imports = 0
        }
        { print }
        END { 
          if (!added) {
            print ""
            print "export const dynamic = '\''force-dynamic'\''"
          }
        }
      ' "$page" > "${page}.tmp" && mv "${page}.tmp" "$page"
    else
      echo "Dynamic export already exists in $page"
    fi
  fi
done

echo "Done adding dynamic exports"