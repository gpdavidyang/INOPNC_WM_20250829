'use client'

import type { ReactNode } from 'react'

interface sidebarProps {
  children?: ReactNode
}

export default function sidebar({ children }: sidebarProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-6 text-sm text-gray-600">
      <p>sidebar component placeholder.</p>
      {children}
    </div>
  )
}
