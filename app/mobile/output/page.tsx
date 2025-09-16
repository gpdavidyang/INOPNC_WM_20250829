'use client'

import { MobileAuthGuard } from '@/modules/mobile/components/auth/mobile-auth-guard'
import WorkOutputPage from '@/modules/mobile/components/work-output/WorkOutputPage'

export const dynamic = 'force-dynamic'

export default function MobileOutputPage() {
  return (
    <MobileAuthGuard requiredRoles={['worker', 'site_manager']}>
      <WorkOutputPage />
    </MobileAuthGuard>
  )
}
