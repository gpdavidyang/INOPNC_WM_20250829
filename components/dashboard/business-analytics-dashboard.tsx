'use client'

import type { ReactNode } from 'react'

interface business_analytics_dashboardProps {
  children?: ReactNode
}

export default function business_analytics_dashboard({ children }: business_analytics_dashboardProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-6 text-sm text-gray-600">
      <p>business-analytics-dashboard component placeholder.</p>
      {children}
    </div>
  )
}
