'use client'

import React from 'react'
import { MobileLayoutWithAuth } from '@/modules/mobile/components/layout/MobileLayoutWithAuth'
import SiteInfoPage from '@/modules/mobile/components/site/SiteInfoPage'
import { MobileAuthGuard } from '@/modules/mobile/components/auth/mobile-auth-guard'
import { useUnifiedAuth } from '@/hooks/use-unified-auth'

export const dynamic = 'force-dynamic'

export default function MobileSitesPage() {
  const { profile } = useUnifiedAuth()
  const role = profile?.role

  return (
    <MobileAuthGuard requiredRoles={['worker', 'site_manager', 'customer_manager', 'partner']}>
      <MobileLayoutWithAuth>
        <SiteInfoPage />
      </MobileLayoutWithAuth>
    </MobileAuthGuard>
  )
}
