'use client'

import type { ReactNode } from 'react'

interface mobile_bottom_navProps {
  children?: ReactNode
}

export default function mobile_bottom_nav({ children }: mobile_bottom_navProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-6 text-sm text-gray-600">
      <p>mobile-bottom-nav component placeholder.</p>
      {children}
    </div>
  )
}
