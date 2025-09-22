'use client'

import type { ReactNode } from 'react'

interface worker_dashboardProps {
  children?: ReactNode
}

export default function worker_dashboard({ children }: worker_dashboardProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-6 text-sm text-gray-600">
      <p>worker-dashboard component placeholder.</p>
      {children}
    </div>
  )
}
