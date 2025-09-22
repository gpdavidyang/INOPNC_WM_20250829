'use client'

import type { ReactNode } from 'react'

interface PhotoGridPreviewPageProps {
  children?: ReactNode
}

export default function PhotoGridPreviewPage({ children }: PhotoGridPreviewPageProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-6 text-sm text-gray-600">
      <p>PhotoGridPreviewPage placeholder – feature not included in this build.</p>
      {children}
    </div>
  )
}
