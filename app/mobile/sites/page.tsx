'use client'

import { MobileAuthGuard } from '@/modules/mobile/components/auth/mobile-auth-guard'
import SiteInfoPage from '@/modules/mobile/components/site/SiteInfoPage'

export const dynamic = 'force-dynamic'

export default function MobileSitesPage() {
  return (
    <MobileAuthGuard requiredRoles={['worker', 'site_manager']}>
      <SiteInfoPage />
    </MobileAuthGuard>
  )
}
