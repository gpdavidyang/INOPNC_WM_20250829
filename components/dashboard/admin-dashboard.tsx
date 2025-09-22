'use client'

import type { ReactNode } from 'react'

interface admin_dashboardProps {
  children?: ReactNode
}

export default function admin_dashboard({ children }: admin_dashboardProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-6 text-sm text-gray-600">
      <p>admin-dashboard component placeholder.</p>
      {children}
    </div>
  )
}
