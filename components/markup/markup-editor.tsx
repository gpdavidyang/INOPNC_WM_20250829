'use client'

import type { ReactNode } from 'react'

interface MarkupEditorProps {
  children?: ReactNode
}

export default function MarkupEditor({ children }: MarkupEditorProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600">
      <p>Markup editor placeholder.</p>
      {children}
    </div>
  )
}
