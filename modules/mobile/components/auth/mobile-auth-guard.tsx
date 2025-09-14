'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useMobileUser } from '@/modules/mobile/hooks/use-mobile-auth'
import { LoadingPage } from '@/modules/shared/ui'

interface MobileAuthGuardProps {
  children: React.ReactNode
  requiredRoles?: ('worker' | 'site_manager' | 'customer_manager')[]
  fallbackPath?: string
}

export const MobileAuthGuard: React.FC<MobileAuthGuardProps> = ({
  children,
  requiredRoles = ['worker', 'site_manager', 'customer_manager'],
  fallbackPath = '/auth/login',
}) => {
  const router = useRouter()
  const { user, profile, loading, error, canAccessMobile } = useMobileUser()

  React.useEffect(() => {
    if (loading) return

    // Not authenticated
    if (!user || !profile) {
      router.replace(fallbackPath)
      return
    }

    // Not a mobile role
    if (!canAccessMobile) {
      router.replace('/dashboard') // Redirect to admin dashboard
      return
    }

    // Check specific role requirements
    if (requiredRoles.length > 0 && profile.role && !requiredRoles.includes(profile.role as any)) {
      router.replace('/mobile') // Redirect to mobile home
      return
    }
  }, [user, profile, loading, canAccessMobile, router, requiredRoles, fallbackPath])

  if (loading) {
    return <LoadingPage title="인증 확인 중..." description="사용자 권한을 확인하고 있습니다." />
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h2 className="t-h2 text-red-600 mb-2">오류가 발생했습니다</h2>
          <p className="t-body mb-4">{error}</p>
          <button onClick={() => router.replace(fallbackPath)} className="btn btn--primary">
            로그인 화면으로
          </button>
        </div>
      </div>
    )
  }

  if (!user || !profile || !canAccessMobile) {
    return null // Will redirect
  }

  return <>{children}</>
}

// Role-specific guards
export const WorkerGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MobileAuthGuard requiredRoles={['worker']}>{children}</MobileAuthGuard>
)

export const SiteManagerGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MobileAuthGuard requiredRoles={['site_manager']}>{children}</MobileAuthGuard>
)

export const WorkerOrSiteManagerGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MobileAuthGuard requiredRoles={['worker', 'site_manager']}>{children}</MobileAuthGuard>
)
