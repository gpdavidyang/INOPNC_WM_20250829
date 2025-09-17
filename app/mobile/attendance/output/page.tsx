'use client'

import { MobileAuthGuard } from '@/modules/mobile/components/auth/mobile-auth-guard'
import { OutputStatusPage } from '@/modules/mobile/pages/output-status-page'

export const dynamic = 'force-dynamic'

export default function MobileOutputStatusPage() {
  return (
    <MobileAuthGuard requiredRoles={['worker', 'site_manager']}>
      <OutputStatusPage />
    </MobileAuthGuard>
  )
}
