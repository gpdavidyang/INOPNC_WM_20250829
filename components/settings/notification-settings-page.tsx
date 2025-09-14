'use client'


export function NotificationSettingsPage() {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold text-gray-900 dark:text-white`}>
            알림 설정
          </h1>
          <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 dark:text-gray-300 mt-1`}>
            푸시 알림 권한과 알림 수신 방법을 설정하세요
          </p>
        </div>

        {/* Notification Preferences Component */}
        <NotificationPreferences />
      </div>
    </div>
  )
}