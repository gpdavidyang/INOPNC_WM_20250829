'use client'

import type { ReactNode } from 'react'

interface BottomStatusbarProps {
  children?: ReactNode
}

export function BottomStatusbar({ children }: BottomStatusbarProps) {
  return (
    <div className="flex items-center justify-between gap-2 rounded border border-gray-200 bg-white p-2 text-xs text-gray-500">
      {children}
    </div>
  )
}

export default BottomStatusbar
