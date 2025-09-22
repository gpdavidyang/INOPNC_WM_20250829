'use client'

import type { ReactNode } from 'react'

interface NotificationPermissionProps {
  children?: ReactNode
}

export function NotificationPermission({ children }: NotificationPermissionProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600">
      <p>Notification permission prompts are disabled in this build.</p>
      {children}
    </div>
  )
}

export default NotificationPermission
