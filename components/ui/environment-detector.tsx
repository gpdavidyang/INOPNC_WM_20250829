'use client'

import type { ReactNode } from 'react'

interface EnvironmentDetectorProps {
  children?: ReactNode
}

export function EnvironmentDetector({ children }: EnvironmentDetectorProps) {
  return (
    <div className="rounded border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
      <p className="font-semibold text-gray-900">환경 감지 정보</p>
      <p className="mt-1">실제 환경 감지 로직은 이 빌드에 포함되어 있지 않습니다.</p>
      {children && <div className="mt-3">{children}</div>}
    </div>
  )
}
