'use client'

import type { ReactNode } from 'react'

interface TextInputDialogProps {
  children?: ReactNode
}

export function TextInputDialog({ children }: TextInputDialogProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600">
      <p>Text input dialog placeholder.</p>
      {children}
    </div>
  )
}

export default TextInputDialog
