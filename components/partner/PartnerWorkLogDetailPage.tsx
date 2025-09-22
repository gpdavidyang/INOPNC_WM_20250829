'use client'

import type { ReactNode } from 'react'

export function PartnerWorkLogDetailPage({ children }: { children?: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl space-y-4 bg-white p-6">
      <h2 className="text-xl font-semibold text-gray-900">Work Log Detail</h2>
      <p className="text-sm text-gray-600">Detailed work log information is not available in this build.</p>
      {children}
    </div>
  )
}
