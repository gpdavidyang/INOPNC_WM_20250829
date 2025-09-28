'use client'

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface AvatarProps {
  className?: string
  children?: React.ReactNode
}

interface AvatarFallbackProps {
  className?: string
  children?: React.ReactNode
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
    {...props}
  >
    {children}
  </div>
))
Avatar.displayName = 'Avatar'

const AvatarFallback = forwardRef<HTMLDivElement, AvatarFallbackProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-muted',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
AvatarFallback.displayName = 'AvatarFallback'

export { Avatar, AvatarFallback }
