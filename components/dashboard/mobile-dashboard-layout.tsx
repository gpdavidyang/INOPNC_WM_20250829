'use client'

import type { ReactNode } from 'react'

interface mobile_dashboard_layoutProps {
  children?: ReactNode
}

export default function mobile_dashboard_layout({ children }: mobile_dashboard_layoutProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-6 text-sm text-gray-600">
      <p>mobile-dashboard-layout component placeholder.</p>
      {children}
    </div>
  )
}
