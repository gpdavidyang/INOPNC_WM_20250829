'use client'

import type { ReactNode } from 'react'

interface SharedDocumentViewerProps {
  children?: ReactNode
}

export function SharedDocumentViewer({ children }: SharedDocumentViewerProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600">
      <p>Shared document viewer is not available in this trimmed build.</p>
      {children}
    </div>
  )
}

export default SharedDocumentViewer
