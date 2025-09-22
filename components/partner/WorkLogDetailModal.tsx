'use client'

import type { ReactNode } from 'react'

interface WorkLogDetailModalProps {
  open?: boolean
  onClose?: () => void
  children?: ReactNode
}

export function WorkLogDetailModal({ open, onClose, children }: WorkLogDetailModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Work Log Detail</h2>
          <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">
            닫기
          </button>
        </div>
        <div className="space-y-3 text-sm text-gray-600">
          <p>Work-log modal content is not provided in this build.</p>
          {children}
        </div>
      </div>
    </div>
  )
}
