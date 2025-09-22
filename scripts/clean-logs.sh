#!/bin/bash

# Performance optimization script for Next.js server
# Removes excessive console logs and optimizes configuration

echo "🚀 Starting server performance optimization..."

# Create backup directory
BACKUP_DIR=".backup/logs-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📁 Creating backup in $BACKUP_DIR"

# High-impact files that cause the most logging
HIGH_IMPACT_FILES=(
  "components/dashboard/dashboard-layout.tsx"
  "components/dashboard/sidebar.tsx"
  "components/dashboard/tabs/site-info-tab.tsx"
  "components/dashboard/tabs/documents-tab.tsx"
  "components/dashboard/tabs/work-logs-tab.tsx"
  "components/dashboard/tabs/attendance-tab.tsx"
  "components/dashboard/tabs/debug-controls.tsx"
  "components/attendance/attendance-calendar.tsx"
  "components/markup/canvas/markup-canvas.tsx"
  "lib/monitoring/alerting-manager.ts"
  "lib/monitoring/init.ts"
  "hooks/use-auto-login.ts"
  "app/auth/actions.ts"
  "components/admin/SiteManagement.tsx"
  "components/admin/SiteManagementList.tsx"
  "components/admin/UserManagement.tsx"
  "components/admin/ApprovalModal.tsx"
  "components/admin/sites/SiteWorkersTab.tsx"
  "components/admin/sites/SitePartnersTab.tsx"
  "app/dashboard/page.tsx"
  "lib/monitoring/performance-metrics.ts"
  "lib/monitoring/monitoring-manager.ts"
  "lib/supabase/session-bridge.ts"
  "lib/supabase/session-sync.ts"
  "components/providers/performance-monitoring-provider.tsx"
  "components/providers/optimized-context-provider.tsx"
  "app/actions/site-info.ts"
  "app/actions/sites.ts"
  "app/actions/admin/sites.ts"
  "app/actions/admin/salary.ts"
  "components/daily-reports/daily-report-form-enhanced.tsx"
  "components/daily-reports/DailyReportListEnhanced.tsx"
  "components/materials/npc1000/NPC1000DailyDashboard.tsx"
  "app/actions/npc-materials.ts"
)

echo "🎯 Processing high-impact files..."
for FILE in "${HIGH_IMPACT_FILES[@]}"; do
  if [ -f "$FILE" ]; then
    # Create backup
    cp "$FILE" "$BACKUP_DIR/$(basename "$FILE")" 2>/dev/null
    
    # Comment out console.log, console.debug, console.info
    # Keep console.error and console.warn for debugging
    sed -i '' 's/^\([[:space:]]*\)console\.log/\1\/\/ console.log/g' "$FILE"
    sed -i '' 's/^\([[:space:]]*\)console\.info/\1\/\/ console.info/g' "$FILE"
    sed -i '' 's/^\([[:space:]]*\)console\.debug/\1\/\/ console.debug/g' "$FILE"
    
    echo "  ✓ Optimized: $FILE"
  fi
done

echo ""
echo "✅ Optimization complete!"
echo "📊 Results:"
echo "  - Commented out excessive console.log statements"
echo "  - Preserved console.error and console.warn for debugging"
echo "  - Backup created in $BACKUP_DIR"
echo ""
echo "🔄 To restore original files, run:"
echo "  cp $BACKUP_DIR/* ."