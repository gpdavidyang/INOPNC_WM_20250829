'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type EmptyStateProps = {
  icon?: ReactNode
  title?: string
  description?: string
  action?: ReactNode
  className?: string
}

export default function EmptyState({
  icon,
  title = '내용이 없습니다',
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 py-16 text-sm text-muted-foreground',
        className
      )}
    >
      {icon}
      {title && <p className="text-foreground font-medium">{title}</p>}
      {description && <p className="text-xs">{description}</p>}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
