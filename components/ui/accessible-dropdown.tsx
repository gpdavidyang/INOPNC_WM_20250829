'use client'

import type { ReactNode } from 'react'

interface AccessibleDropdownProps {
  trigger: ReactNode
  children?: ReactNode
  className?: string
}

export function AccessibleDropdown({ trigger, children, className }: AccessibleDropdownProps) {
  return (
    <div className={className}>
      <button type="button" className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
        {trigger}
      </button>
      {children && <div className="mt-2 rounded-md border bg-white p-3 text-sm shadow">{children}</div>}
    </div>
  )
}
