'use client'

import type { ReactNode } from 'react'

interface NotificationSettingsProps {
  children?: ReactNode
}

export function NotificationSettings({ children }: NotificationSettingsProps) {
  return (
    <section className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600">
      <h2 className="text-base font-semibold text-gray-900">Notification Settings</h2>
      <p className="mt-1">Detailed settings UI has been omitted in this build.</p>
      {children && <div className="mt-3 space-y-2">{children}</div>}
    </section>
  )
}
