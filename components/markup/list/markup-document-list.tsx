'use client'

import type { ReactNode } from 'react'

interface MarkupDocumentListProps {
  children?: ReactNode
}

export function MarkupDocumentList({ children }: MarkupDocumentListProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600">
      <p>Markup document list placeholder.</p>
      {children}
    </div>
  )
}

export default MarkupDocumentList
