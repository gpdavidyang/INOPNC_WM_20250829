/* eslint-disable */
'use client'

import type { ReactNode } from 'react'

interface DocumentCategoryManagerProps {
  children?: ReactNode
}

export function DocumentCategoryManager({ children }: DocumentCategoryManagerProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600">
      <p>DocumentCategoryManager placeholder.</p>
      {children}
    </div>
  )
}

export default DocumentCategoryManager
