'use client'

import { forwardRef, KeyboardEvent, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface FocusableComponentProps extends HTMLAttributes<HTMLDivElement> {
  onActivate?: () => void
  disabled?: boolean
  as?: React.ElementType
}

export const FocusableComponent = forwardRef<HTMLDivElement, FocusableComponentProps>(
  ({ children, onActivate, disabled, as: Component = 'div', className, onKeyDown, ...props }, ref) => {
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      // Call original onKeyDown if provided
      onKeyDown?.(e)

      // Handle Enter and Space key activation
      if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        onActivate?.()
      }
    }

    return (
      <Component
        ref={ref}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        className={cn(
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-toss-blue-500 focus-visible:ring-offset-2',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        aria-disabled={disabled}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

FocusableComponent.displayName = 'FocusableComponent'