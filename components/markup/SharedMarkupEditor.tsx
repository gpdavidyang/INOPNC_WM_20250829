'use client'

import type { ReactNode } from 'react'

interface SharedMarkupEditorProps {
  children?: ReactNode
}

export function SharedMarkupEditor({ children }: SharedMarkupEditorProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600">
      <p>Shared markup editor placeholder.</p>
      {children}
    </div>
  )
}

export default SharedMarkupEditor
