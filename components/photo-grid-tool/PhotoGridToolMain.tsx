'use client'

import type { ReactNode } from 'react'

interface PhotoGridToolMainProps {
  children?: ReactNode
}

export default function PhotoGridToolMain({ children }: PhotoGridToolMainProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-6 text-sm text-gray-600">
      <p>PhotoGridToolMain placeholder – feature not included in this build.</p>
      {children}
    </div>
  )
}
