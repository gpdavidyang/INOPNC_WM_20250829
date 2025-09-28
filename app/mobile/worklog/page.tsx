'use client'

import { MobileAuthGuard } from '@/modules/mobile/components/auth/mobile-auth-guard'
import { WorkLogHomePage } from '@/modules/worker-site-manager/pages'

export const dynamic = 'force-dynamic'

export default function MobileWorklogPage() {
  return (
    <MobileAuthGuard requiredRoles={['worker', 'site_manager']}>
      <WorkLogHomePage />
    </MobileAuthGuard>
  )
}
