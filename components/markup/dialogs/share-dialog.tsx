'use client'

import type { ReactNode } from 'react'

interface ShareDialogProps {
  children?: ReactNode
}

export function ShareDialog({ children }: ShareDialogProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600">
      <p>Share dialog placeholder.</p>
      {children}
    </div>
  )
}

export default ShareDialog
