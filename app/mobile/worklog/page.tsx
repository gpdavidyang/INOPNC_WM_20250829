'use client'

import React from 'react'
import { MobileAuthGuard } from '@/modules/mobile/components/auth/mobile-auth-guard'
import { useUnifiedAuth } from '@/hooks/use-unified-auth'
import { WorkLogHomePage2 } from '@/modules/worker-site-manager/pages'

export const dynamic = 'force-dynamic'

export default function MobileWorklogPage() {
  const { profile } = useUnifiedAuth()
  const role = profile?.role

  if (role === 'customer_manager' || role === 'partner') {
    // 파트너/고객담당자도 동일 UI 사용
    return (
      <MobileAuthGuard requiredRoles={['customer_manager', 'partner']}>
        <WorkLogHomePage2 />
      </MobileAuthGuard>
    )
  }

  return (
    <MobileAuthGuard requiredRoles={['worker', 'site_manager']}>
      <WorkLogHomePage2 />
    </MobileAuthGuard>
  )
}
