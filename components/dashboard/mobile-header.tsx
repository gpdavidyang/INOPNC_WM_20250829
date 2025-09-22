'use client'

import type { ReactNode } from 'react'

interface mobile_headerProps {
  children?: ReactNode
}

export default function mobile_header({ children }: mobile_headerProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-6 text-sm text-gray-600">
      <p>mobile-header component placeholder.</p>
      {children}
    </div>
  )
}
