import NotificationCenter from '@/components/admin/notifications/NotificationCenter'

export default async function NotificationCenterPage() {
  const { data: profile } = await getProfile()
  
  if (!profile) {
    redirect('/auth/login')
  }
  
  // Only admin role can access admin notifications
  if (profile.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            알림 관리
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            시스템 전체 알림을 관리하고 모니터링합니다
          </p>
        </div>
      </div>
      
      <NotificationCenter profile={profile} />
    </div>
  )
}