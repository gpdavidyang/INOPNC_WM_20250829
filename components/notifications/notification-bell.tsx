'use client'

import type { ButtonHTMLAttributes } from 'react'

interface NotificationBellProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  count?: number
}

export function NotificationBell({ count = 0, className, ...props }: NotificationBellProps) {
  return (
    <button
      type="button"
      className={`relative inline-flex items-center justify-center rounded-full border px-3 py-2 text-sm ${className ?? ''}`.trim()}
      {...props}
    >
      알림
      {count > 0 && (
        <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}
