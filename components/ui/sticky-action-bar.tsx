'use client'

import * as React from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type StickyActionBarProps = {
  children: ReactNode
  className?: string
  position?: 'page' | 'card'
}

// Sticky action bar for long forms. Default anchors to viewport bottom.
export default function StickyActionBar({
  children,
  className,
  position = 'page',
}: StickyActionBarProps) {
  const base =
    position === 'card'
      ? 'sticky bottom-0 left-0 right-0 border-t bg-white px-4 py-3'
      : 'fixed bottom-0 left-0 right-0 border-t bg-white px-4 py-3'

  return <div className={cn(base, 'z-30 shadow-md', className)}>{children}</div>
}
