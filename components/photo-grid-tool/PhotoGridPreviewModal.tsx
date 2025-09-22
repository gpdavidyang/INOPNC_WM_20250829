'use client'

import type { ReactNode } from 'react'

interface PhotoGridPreviewModalProps {
  children?: ReactNode
}

export default function PhotoGridPreviewModal({ children }: PhotoGridPreviewModalProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-6 text-sm text-gray-600">
      <p>PhotoGridPreviewModal placeholder – feature not included in this build.</p>
      {children}
    </div>
  )
}
