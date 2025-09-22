'use client'

import type { ReactNode } from 'react'

interface site_comparison_chartProps {
  children?: ReactNode
}

export default function site_comparison_chart({ children }: site_comparison_chartProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-6 text-sm text-gray-600">
      <p>site-comparison-chart component placeholder.</p>
      {children}
    </div>
  )
}
