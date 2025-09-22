/* eslint-disable */

'use client'

import type { ReactNode } from 'react'

interface ProfileDropdownProps {
  trigger?: ReactNode
  children?: ReactNode
}

export function ProfileDropdown({ trigger, children }: ProfileDropdownProps) {
  return (
    <div className="relative inline-block text-left">
      <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm text-gray-600">{trigger ?? '사용자'}</span>
      {children && <div className="mt-2 rounded border bg-white p-3 text-sm shadow">{children}</div>}
    </div>
  )
}
