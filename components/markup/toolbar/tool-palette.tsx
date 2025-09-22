'use client'

import type { ReactNode } from 'react'

interface ToolPaletteProps {
  children?: ReactNode
}

export function ToolPalette({ children }: ToolPaletteProps) {
  return (
    <div className="grid gap-2 rounded border border-gray-200 bg-white p-3 text-sm text-gray-600">
      <p>Tool palette placeholder.</p>
      {children}
    </div>
  )
}

export default ToolPalette
