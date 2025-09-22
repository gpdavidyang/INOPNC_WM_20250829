'use client'

import type { ReactNode } from 'react'

export default function DashboardErrorBoundary({ children }: { children?: ReactNode }) {
  return <>{children}</>
}
