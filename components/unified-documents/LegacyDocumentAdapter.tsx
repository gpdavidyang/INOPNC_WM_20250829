/* eslint-disable */
'use client'

import type { ReactNode } from 'react'

interface LegacyDocumentAdapterProps {
  children?: ReactNode
}

export function LegacyDocumentAdapter({ children }: LegacyDocumentAdapterProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600">
      <p>LegacyDocumentAdapter placeholder.</p>
      {children}
    </div>
  )
}

export default LegacyDocumentAdapter
