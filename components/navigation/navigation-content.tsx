'use client'

import React, { Suspense } from 'react'
import HomeTab from '@/components/dashboard/tabs/home-tab'
import {
  LazyWorkLogsTab,
  LazyDocumentsTabUnified,
  LazyAttendanceTab
} from '@/components/dashboard/tabs/lazy-components'

interface NavigationContentProps {
  profile: Profile
  children?: React.ReactNode
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">로딩 중...</p>
      </div>
    </div>
  )
}

export function NavigationContent({ profile, children }: NavigationContentProps) {
  const { activeTab } = useNavigation()

  // If children are provided (dedicated page), render them
  if (children) {
    return <>{children}</>
  }

  // Otherwise render based on active tab
  switch (activeTab) {
    case 'home':
      return <HomeTab profile={profile} />
    
    case 'daily-reports':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <LazyWorkLogsTab profile={profile} />
        </Suspense>
      )
    
    case 'attendance':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <LazyAttendanceTab profile={profile} />
        </Suspense>
      )
    
    case 'documents':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <LazyDocumentsTabUnified profile={profile} />
        </Suspense>
      )
    
    default:
      return <HomeTab profile={profile} />
  }
}