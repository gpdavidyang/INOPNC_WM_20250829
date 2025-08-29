import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NotificationAnalyticsDashboard } from '@/components/notifications/notification-analytics-dashboard'

export const metadata: Metadata = {
  title: '알림 분석 | INOPNC 작업일지 관리',
  description: '알림 발송 및 참여 분석',
}

export default async function NotificationAnalyticsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check if user is admin/manager
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile?.role || !['admin', 'system_admin', 'site_manager'].includes(profile.role)) {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          알림 분석
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          알림 발송 현황과 사용자 참여도를 분석합니다
        </p>
      </div>
      
      <NotificationAnalyticsDashboard />
    </div>
  )
}