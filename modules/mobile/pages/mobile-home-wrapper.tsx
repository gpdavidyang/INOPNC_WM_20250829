'use client'

import React, { useEffect } from 'react'
import { HomePage } from '@/modules/mobile/components/home/HomePage'
import { useAuth } from '@/modules/mobile/providers/AuthProvider'
import { LoadingPage } from '@/modules/shared/ui'

export const MobileHomeWrapper: React.FC = () => {
  const { user, profile, loading } = useAuth()

  useEffect(() => {
    if (!loading && (!user || !profile)) {
      console.warn('[MobileHomeWrapper] Missing authenticated user, redirecting to login')
      window.location.replace('/auth/login')
    }
  }, [loading, user, profile])

  if (loading || !user || !profile) {
    return <LoadingPage title="인증 확인 중..." description="사용자 정보를 불러오는 중입니다." />
  }

  return <HomePage initialProfile={profile} initialUser={user} />
}
