'use client'

import type { ReactNode } from 'react'

interface PhotoGridCreatorProps {
  children?: ReactNode
}

export default function PhotoGridCreator({ children }: PhotoGridCreatorProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-6 text-sm text-gray-600">
      <p>PhotoGridCreator placeholder – feature not included in this build.</p>
      {children}
    </div>
  )
}
