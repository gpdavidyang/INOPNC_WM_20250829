'use client'

import { MobileAuthGuard } from '@/modules/mobile/components/auth/mobile-auth-guard'
import { WorkLogHomePageV2 } from '@/modules/worker-site-manager/pages'

export const dynamic = 'force-dynamic'

export default function MobileWorklogV2Page() {
  return (
    <MobileAuthGuard requiredRoles={['worker', 'site_manager']}>
      <WorkLogHomePageV2 />
    </MobileAuthGuard>
  )
}
