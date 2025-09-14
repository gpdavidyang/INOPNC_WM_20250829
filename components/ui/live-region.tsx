'use client'

import React, { forwardRef, ReactNode } from 'react'

export interface LiveRegionProps {
  children: ReactNode
  role?: 'status' | 'alert' | 'log'
  'aria-live'?: 'off' | 'polite' | 'assertive'
  'aria-atomic'?: boolean
  'aria-relevant'?: 'additions' | 'removals' | 'text' | 'all'
  className?: string
  id?: string
  hidden?: boolean
}

export const LiveRegion = forwardRef<HTMLDivElement, LiveRegionProps>(
  ({ 
    children, 
    role = 'status',
    'aria-live': ariaLive = 'polite',
    'aria-atomic': ariaAtomic = true,
    'aria-relevant': ariaRelevant = 'additions text',
    className,
    id,
    hidden = false,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        id={id}
        role={role}
        aria-live={ariaLive}
        aria-atomic={ariaAtomic}
        aria-relevant={ariaRelevant}
        className={cn(
          hidden && 'sr-only',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

LiveRegion.displayName = 'LiveRegion'

// Pre-configured live region for common use cases

export const StatusRegion = forwardRef<HTMLDivElement, Omit<LiveRegionProps, 'role' | 'aria-live'>>(
  (props, ref) => (
    <LiveRegion ref={ref} role="status" aria-live="polite" {...props} />
  )
)

StatusRegion.displayName = 'StatusRegion'

export const AlertRegion = forwardRef<HTMLDivElement, Omit<LiveRegionProps, 'role' | 'aria-live'>>(
  (props, ref) => (
    <LiveRegion ref={ref} role="alert" aria-live="assertive" {...props} />
  )
)

AlertRegion.displayName = 'AlertRegion'

export const LogRegion = forwardRef<HTMLDivElement, Omit<LiveRegionProps, 'role' | 'aria-live'>>(
  (props, ref) => (
    <LiveRegion ref={ref} role="log" aria-live="polite" aria-atomic={false} {...props} />
  )
)

LogRegion.displayName = 'LogRegion'