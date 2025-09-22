'use client'

import type { ReactNode } from 'react'

interface headerProps {
  children?: ReactNode
}

export default function header({ children }: headerProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-6 text-sm text-gray-600">
      <p>header component placeholder.</p>
      {children}
    </div>
  )
}
