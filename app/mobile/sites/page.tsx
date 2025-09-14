'use client'

import { MobileAuthGuard } from '@/modules/mobile/components/auth/mobile-auth-guard'
import { SitesPage } from '@/modules/mobile/pages/sites-page'

export const dynamic = 'force-dynamic'

export default function MobileSitesPage() {
  return (
    <MobileAuthGuard requiredRoles={['worker', 'site_manager']}>
      <SitesPage />
    </MobileAuthGuard>
  )
}