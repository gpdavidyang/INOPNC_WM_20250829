'use client'

import React, { useEffect } from 'react'
import { useUnifiedAuth } from '@/hooks/use-unified-auth'
import { PartnerHomePage } from '@/modules/mobile/components/partner/PartnerHomePage'
import { LoadingPage } from '@/modules/shared/ui'

export const PartnerMobileHomeWrapper: React.FC = () => {
  const { user, profile, loading, isCustomerManager } = useUnifiedAuth()

  useEffect(() => {
    if (!loading && (!user || !profile)) {
      window.location.replace('/auth/login')
    }
  }, [loading, user, profile])

  if (loading || !user || !profile) {
    return <LoadingPage title="인증 확인 중..." description="사용자 정보를 불러오는 중입니다." />
  }

  // Restrict to partner roles in client too (defense-in-depth)
  if (!isCustomerManager && profile.role !== 'partner') {
    if (typeof window !== 'undefined') {
      window.location.replace('/mobile')
    }
    return null
  }

  return <PartnerHomePage />
}
