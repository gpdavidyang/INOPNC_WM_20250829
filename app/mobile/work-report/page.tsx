'use client'

import { MobileAuthGuard } from '@/modules/mobile/components/auth/mobile-auth-guard'
import WorkReportPage from '@/modules/mobile/components/work-report/WorkReportPage'

export const dynamic = 'force-dynamic'

export default function MobileWorkReportPage() {
  return (
    <MobileAuthGuard requiredRoles={['worker', 'site_manager']}>
      <WorkReportPage />
    </MobileAuthGuard>
  )
}
