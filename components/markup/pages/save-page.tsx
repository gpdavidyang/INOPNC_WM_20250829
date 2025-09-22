'use client'

import type { ReactNode } from 'react'

interface SavePageProps {
  children?: ReactNode
}

export default function SavePage({ children }: SavePageProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600">
      <p>Save page placeholder.</p>
      {children}
    </div>
  )
}
