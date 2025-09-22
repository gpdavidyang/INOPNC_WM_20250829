'use client'

import type { ReactNode } from 'react'

interface dashboard_layoutProps {
  children?: ReactNode
}

export default function dashboard_layout({ children }: dashboard_layoutProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-6 text-sm text-gray-600">
      <p>dashboard-layout component placeholder.</p>
      {children}
    </div>
  )
}
