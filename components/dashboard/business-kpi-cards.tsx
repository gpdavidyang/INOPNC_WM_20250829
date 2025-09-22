'use client'

import type { ReactNode } from 'react'

interface business_kpi_cardsProps {
  children?: ReactNode
}

export default function business_kpi_cards({ children }: business_kpi_cardsProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-6 text-sm text-gray-600">
      <p>business-kpi-cards component placeholder.</p>
      {children}
    </div>
  )
}
