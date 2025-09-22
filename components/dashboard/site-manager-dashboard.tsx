'use client'

import type { ReactNode } from 'react'

interface site_manager_dashboardProps {
  children?: ReactNode
}

export default function site_manager_dashboard({ children }: site_manager_dashboardProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-6 text-sm text-gray-600">
      <p>site-manager-dashboard component placeholder.</p>
      {children}
    </div>
  )
}
