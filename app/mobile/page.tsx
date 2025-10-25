'use client'
import { useEffect } from 'react'
import { MobileHomeWrapper } from '@/modules/mobile/pages/mobile-home-wrapper'
import { MobileLayoutWithAuth } from '@/modules/mobile/components/layout/MobileLayoutWithAuth'
import { useUnifiedAuth } from '@/hooks/use-unified-auth'
import { normalizeUserRole } from '@/lib/auth/roles'

export const dynamic = 'force-dynamic'

export default function MobileHomePage() {
  const { profile } = useUnifiedAuth()

  useEffect(() => {
    const role = profile?.role
    const normalized = normalizeUserRole(role)
    // 생산관리자는 전용 홈으로 강제 이동
    if (role === 'production_manager') {
      window.location.replace('/mobile/production/production')
      return
    }
    if (normalized === 'customer_manager') {
      // 파트너 역할은 홈을 /mobile/partner로 강제 이동
      window.location.replace('/mobile/partner')
    }
  }, [profile?.role])

  return (
    <MobileLayoutWithAuth>
      <MobileHomeWrapper />
    </MobileLayoutWithAuth>
  )
}
