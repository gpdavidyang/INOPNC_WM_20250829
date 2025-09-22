'use client'

import type { ReactNode } from 'react'

interface NotificationPreferencesProps {
  children?: ReactNode
}

export function NotificationPreferences({ children }: NotificationPreferencesProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600">
      <p>Notification preferences UI is not included in this build.</p>
      {children}
    </div>
  )
}

export default NotificationPreferences
