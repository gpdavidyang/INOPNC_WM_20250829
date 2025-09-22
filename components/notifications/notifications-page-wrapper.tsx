'use client'

import type { ReactNode } from 'react'

interface NotificationsPageWrapperProps {
  children?: ReactNode
}

export function NotificationsPageWrapper({ children }: NotificationsPageWrapperProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
      {children}
    </div>
  )
}
