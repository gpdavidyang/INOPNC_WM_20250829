'use client'

import type { ReactNode } from 'react'

interface NotificationListProps {
  children?: ReactNode
}

export function NotificationList({ children }: NotificationListProps) {
  return (
    <div className="space-y-2 rounded border border-gray-200 bg-white p-4 text-sm text-gray-600">
      <p>Notification list component placeholder.</p>
      {children && <div>{children}</div>}
    </div>
  )
}
