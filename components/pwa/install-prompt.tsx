'use client'

import type { ReactNode } from 'react'

interface InstallPromptProps {
  children?: ReactNode
}

export function InstallPrompt({ children }: InstallPromptProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600">
      <p>Install prompt is not available in this build.</p>
      {children}
    </div>
  )
}

export default InstallPrompt
