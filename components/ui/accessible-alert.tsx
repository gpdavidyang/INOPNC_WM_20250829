'use client'

import type { ReactNode } from 'react'

interface AccessibleAlertProps {
  title?: string
  children?: ReactNode
  className?: string
}

export function AccessibleAlert({ title, children, className }: AccessibleAlertProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={className ?? 'rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700'}
    >
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className="mt-1 text-sm text-blue-600">{children}</div>}
    </div>
  )
}
