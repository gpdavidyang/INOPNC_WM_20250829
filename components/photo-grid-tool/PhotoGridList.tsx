'use client'

import type { ReactNode } from 'react'

interface PhotoGridListProps {
  children?: ReactNode
}

export default function PhotoGridList({ children }: PhotoGridListProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-6 text-sm text-gray-600">
      <p>PhotoGridList placeholder – feature not included in this build.</p>
      {children}
    </div>
  )
}
