'use client'

import type { ReactNode } from 'react'

interface NavigationContentProps {
  children?: ReactNode
  profile?: unknown
}

export function NavigationContent({ children }: NavigationContentProps) {
  return <>{children ?? null}</>
}
