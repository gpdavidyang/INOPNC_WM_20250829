'use client'
import { useEffect } from 'react'
import { MobileHomeWrapper } from '@/modules/mobile/pages/mobile-home-wrapper'
import { MobileLayoutWithAuth } from '@/modules/mobile/components/layout/MobileLayoutWithAuth'
import { useUnifiedAuth } from '@/hooks/use-unified-auth'

export const dynamic = 'force-dynamic'

export default function MobileHomePage() {
  const { profile } = useUnifiedAuth()

  useEffect(() => {
    const role = profile?.role
    if (role === 'customer_manager' || role === 'partner') {
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
