'use client'

import { User } from '@supabase/supabase-js'
import { Profile } from '@/types'
import DashboardLayout from './dashboard-layout'
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications'
import { ErrorBoundary } from './error-boundary'

interface DashboardWithNotificationsProps {
  user: User
  profile: Profile
  initialCurrentSite?: any
  initialSiteHistory?: any[]
}

export default function DashboardWithNotifications({ user, profile, initialCurrentSite, initialSiteHistory }: DashboardWithNotificationsProps) {
  try {
    console.log('🚀 [DASHBOARD-WITH-NOTIFICATIONS] Starting render for user:', user.email, 'role:', profile?.role)
    
    // Enable real-time notifications with toast (with error handling)
    try {
      useRealtimeNotifications({
        showToast: true,
        onNewNotification: (notification) => {
          // Additional custom handling if needed
          console.log('New notification received:', notification)
        }
      })
    } catch (notificationError) {
      console.warn('⚠️ [DASHBOARD-WITH-NOTIFICATIONS] Real-time notifications failed:', notificationError)
      // Continue without real-time notifications
    }

    // 건설 현장 모드 결정 (작업자, 현장관리자에게 최적화된 UI 제공)
    const useConstructionMode = profile?.role === 'worker' || profile?.role === 'site_manager'
    
    console.log('✅ [DASHBOARD-WITH-NOTIFICATIONS] Rendering DashboardLayout with construction mode:', useConstructionMode)

    return (
      <ErrorBoundary>
        <DashboardLayout 
          user={user} 
          profile={profile} 
          useConstructionMode={useConstructionMode}
          initialCurrentSite={initialCurrentSite}
          initialSiteHistory={initialSiteHistory}
        />
      </ErrorBoundary>
    )
  } catch (error) {
    console.error('💥 [DASHBOARD-WITH-NOTIFICATIONS] Critical error:', error)
    
    // Fallback UI
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">대시보드 오류</h1>
          <p className="text-gray-600 mb-4">
            대시보드를 초기화하는 중 오류가 발생했습니다.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            사용자: {user.email} | 역할: {profile?.role || '알 수 없음'}
          </p>
          <div className="space-y-2">
            <button 
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={() => window.location.reload()}
            >
              페이지 새로고침
            </button>
            <a 
              href="/auth/login"
              className="w-full inline-block bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 text-center"
            >
              다시 로그인
            </a>
          </div>
        </div>
      </div>
    )
  }
}