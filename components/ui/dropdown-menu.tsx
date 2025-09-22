'use client'

import type { ReactNode } from 'react'

interface DropdownMenuProps {
  trigger: ReactNode
  children?: ReactNode
  className?: string
}

export function DropdownMenu({ trigger, children, className }: DropdownMenuProps) {
  return (
    <div className={className}>
      <button type="button" className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm">
        {trigger}
      </button>
      {children && <div className="mt-2 rounded-md border bg-white p-2 text-sm shadow">{children}</div>}
    </div>
  )
}

export function DropdownMenuItem({ children }: { children: ReactNode }) {
  return <div className="px-3 py-2 text-sm hover:bg-gray-100">{children}</div>
}
