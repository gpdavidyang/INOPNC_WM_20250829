'use client'

import type { ReactNode } from 'react'

interface business_trend_chartProps {
  children?: ReactNode
}

export default function business_trend_chart({ children }: business_trend_chartProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-6 text-sm text-gray-600">
      <p>business-trend-chart component placeholder.</p>
      {children}
    </div>
  )
}
