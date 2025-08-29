'use client'

import { User } from '@supabase/supabase-js'
import { Profile } from '@/types'
import DashboardLayout from './dashboard-layout'
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications'

interface DashboardWithNotificationsProps {
  user: User
  profile: Profile
  initialCurrentSite?: any
  initialSiteHistory?: any[]
}

export default function DashboardWithNotifications({ user, profile, initialCurrentSite, initialSiteHistory }: DashboardWithNotificationsProps) {
  // Enable real-time notifications with toast
  useRealtimeNotifications({
    showToast: true,
    onNewNotification: (notification) => {
      // Additional custom handling if needed
      console.log('New notification received:', notification)
    }
  })

  // 건설 현장 모드 결정 (작업자, 현장관리자에게 최적화된 UI 제공)
  const useConstructionMode = profile?.role === 'worker' || profile?.role === 'site_manager'

  return <DashboardLayout 
    user={user} 
    profile={profile} 
    useConstructionMode={useConstructionMode}
    initialCurrentSite={initialCurrentSite}
    initialSiteHistory={initialSiteHistory}
  />
}