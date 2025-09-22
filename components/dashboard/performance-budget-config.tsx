'use client'

import type { ReactNode } from 'react'

interface performance_budget_configProps {
  children?: ReactNode
}

export default function performance_budget_config({ children }: performance_budget_configProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-6 text-sm text-gray-600">
      <p>performance-budget-config component placeholder.</p>
      {children}
    </div>
  )
}
