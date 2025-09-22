'use client'

import type { ReactNode } from 'react'

interface PartnerDashboardProps {
  sidebar?: ReactNode
  children?: ReactNode
}

export function PartnerDashboard({ sidebar, children }: PartnerDashboardProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {sidebar && <aside className="hidden w-64 border-r bg-white lg:block">{sidebar}</aside>}
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-semibold text-gray-900">Partner Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Partner-specific dashboards are not included in this trimmed build.
        </p>
        {children && <div className="mt-6 space-y-4">{children}</div>}
      </main>
    </div>
  )
}
