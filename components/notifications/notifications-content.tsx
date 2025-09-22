'use client'

import type { ReactNode } from 'react'

interface NotificationsContentProps {
  children?: ReactNode
}

export function NotificationsContent({ children }: NotificationsContentProps) {
  return <div className="space-y-4">{children}</div>
}
