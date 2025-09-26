'use client'

import { MobileLayoutWithAuth } from '@/modules/mobile/components/layout/MobileLayoutWithAuth'
import SiteInfoPage from '@/modules/mobile/components/site/SiteInfoPage'
import { MobileAuthGuard } from '@/modules/mobile/components/auth/mobile-auth-guard'

export const dynamic = 'force-dynamic'

export default function MobileSitesPage() {
  return (
    <MobileAuthGuard requiredRoles={['worker', 'site_manager']}>
      <MobileLayoutWithAuth>
        <SiteInfoPage />
      </MobileLayoutWithAuth>
    </MobileAuthGuard>
  )
}
