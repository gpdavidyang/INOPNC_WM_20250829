'use client'

import type { ReactNode } from 'react'

interface NotificationDropdownProps {
  trigger: ReactNode
  children?: ReactNode
}

export function NotificationDropdown({ trigger, children }: NotificationDropdownProps) {
  return (
    <div className="relative inline-block text-left">
      <button type="button" className="inline-flex items-center rounded-md border px-3 py-2 text-sm">
        {trigger}
      </button>
      {children && (
        <div className="absolute right-0 mt-2 w-64 rounded-md border bg-white p-3 text-sm shadow">
          {children}
        </div>
      )}
    </div>
  )
}
