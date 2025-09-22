'use client'

import type { ReactNode } from 'react'

interface dashboard_with_notificationsProps {
  children?: ReactNode
}

export default function dashboard_with_notifications({ children }: dashboard_with_notificationsProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-6 text-sm text-gray-600">
      <p>dashboard-with-notifications component placeholder.</p>
      {children}
    </div>
  )
}
