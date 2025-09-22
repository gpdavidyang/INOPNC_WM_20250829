'use client'

import type { ReactNode } from 'react'

interface BlueprintUploadProps {
  children?: ReactNode
}

export function BlueprintUpload({ children }: BlueprintUploadProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600">
      <p>Blueprint upload placeholder.</p>
      {children}
    </div>
  )
}

export default BlueprintUpload
