'use client'

import type { ReactNode } from 'react'

interface TopToolbarProps {
  children?: ReactNode
}

export function TopToolbar({ children }: TopToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-2 rounded border border-gray-200 bg-white p-2 text-sm text-gray-600">
      {children}
    </div>
  )
}

export default TopToolbar
