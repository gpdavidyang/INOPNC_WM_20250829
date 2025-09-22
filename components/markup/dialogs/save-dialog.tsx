'use client'

import type { ReactNode } from 'react'

interface SaveDialogProps {
  children?: ReactNode
}

export function SaveDialog({ children }: SaveDialogProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600">
      <p>Save dialog placeholder.</p>
      {children}
    </div>
  )
}

export default SaveDialog
