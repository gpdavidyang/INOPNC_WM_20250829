'use client'

import type { ReactNode } from 'react'

interface page_layoutProps {
  children?: ReactNode
}

export default function page_layout({ children }: page_layoutProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-6 text-sm text-gray-600">
      <p>page-layout component placeholder.</p>
      {children}
    </div>
  )
}
