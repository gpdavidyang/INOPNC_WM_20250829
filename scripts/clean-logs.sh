#!/bin/bash

# Script to clean up console.log statements for production
# This script comments out console.log statements that contain debugging info

echo "🧹 Cleaning up console.log statements for production..."

# Files to process
FILES=(
  "components/admin/daily-reports/DailyReportsManagement.tsx"
  "components/admin/SiteManagementList.tsx"
  "components/admin/materials/tabs/ShipmentRequestsTab.tsx"
  "components/admin/materials/tabs/ShipmentManagementTab.tsx"
  "components/admin/materials/tabs/InventoryUsageTab.tsx"
  "app/actions/site-info.ts"
  "components/materials/npc1000/NPC1000DailyDashboard.tsx"
  "app/actions/npc-materials.ts"
  "app/actions/admin/sites.ts"
  "components/admin/salary/SalaryStatement.tsx"
  "app/actions/admin/salary.ts"
  "lib/auth/profile-manager.ts"
  "contexts/SiteContext.tsx"
  "components/documents/enhanced-document-filters.tsx"
  "components/daily-reports/daily-report-form-enhanced.tsx"
  "components/daily-reports/DailyReportListEnhanced.tsx"
  "components/dashboard/business-analytics-dashboard.tsx"
  "components/dashboard/tabs/attendance-tab.tsx"
  "components/dashboard/tabs/work-logs-tab.tsx"
  "components/dashboard/tabs/shared-documents-tab.tsx"
  "components/dashboard/tabs/site-info-tab.tsx"
  "components/partner/tabs/PartnerDocumentsTab.tsx"
  "components/admin/DocumentManagement.tsx"
  "components/admin/documents/InvoiceDocumentsManagement.tsx"
  "components/admin/documents/MarkupDocumentsManagement.tsx"
  "components/admin/documents/SharedDocumentsManagement.tsx"
  "components/admin/partners/PartnerDetail.tsx"
  "components/admin/ApprovalModal.tsx"
  "components/admin/sites/SiteManagementList.tsx"
  "components/admin/UserSiteAssignmentModal.tsx"
  "components/admin/SalaryManagement.tsx"
  "components/site-info/SiteSearchModal.tsx"
  "components/attendance/attendance-view.tsx"
  "components/attendance/attendance-calendar.tsx"
  "app/actions/admin/users.ts"
  "app/actions/admin/documents.ts"
  "app/actions/sites.ts"
  "app/actions/force-site-refresh.ts"
  "app/dashboard/notifications/page.tsx"
  "app/dashboard/page.tsx"
  "app/dashboard/daily-reports/[id]/edit/page.tsx"
  "app/dashboard/daily-reports/new/page.tsx"
  "app/dashboard/daily-reports/new/dev-page.tsx"
)

for FILE in "${FILES[@]}"; do
  if [ -f "$FILE" ]; then
    echo "Processing: $FILE"
    # Comment out console.log, console.debug, console.info lines
    sed -i.bak 's/^[[:space:]]*console\.\(log\|debug\|info\)/\/\/ &/' "$FILE"
    # Remove backup files
    rm "${FILE}.bak" 2>/dev/null
  fi
done

echo "✅ Console log cleanup complete!"
echo "⚠️  Note: console.error and console.warn statements are preserved for error tracking."