'use client'

import type { ReactNode } from 'react'

interface MarkupCanvasProps {
  children?: ReactNode
}

export function MarkupCanvas({ children }: MarkupCanvasProps) {
  return (
    <div className="flex min-h-[240px] items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
      Markup canvas placeholder
      {children}
    </div>
  )
}

export default MarkupCanvas
