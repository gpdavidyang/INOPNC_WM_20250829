'use client'

import type { ReactNode } from 'react'

interface performance_dashboardProps {
  children?: ReactNode
}

export default function performance_dashboard({ children }: performance_dashboardProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-6 text-sm text-gray-600">
      <p>performance-dashboard component placeholder.</p>
      {children}
    </div>
  )
}
