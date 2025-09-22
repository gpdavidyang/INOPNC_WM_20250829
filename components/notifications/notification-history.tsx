'use client'

import type { ReactNode } from 'react'

interface NotificationHistoryProps {
  children?: ReactNode
}

export function NotificationHistory({ children }: NotificationHistoryProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600">
      <p>Notification history is not available in this build.</p>
      {children && <div className="mt-2">{children}</div>}
    </div>
  )
}
