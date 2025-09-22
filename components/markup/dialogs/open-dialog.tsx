'use client'

import type { ReactNode } from 'react'

interface OpenDialogProps {
  children?: ReactNode
}

export function OpenDialog({ children }: OpenDialogProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600">
      <p>Open dialog placeholder.</p>
      {children}
    </div>
  )
}

export default OpenDialog
