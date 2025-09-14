'use client'

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

const chipVariants = cva('chip', {
  variants: {
    variant: {
      default: '',
      active: 'is-active',
      tag1: 'chip--t1',
      tag3: 'chip--t3',
      tag4: 'chip--t4',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export interface ChipProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chipVariants> {
  active?: boolean
  onRemove?: () => void
}

const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  ({ className, variant, active, onRemove, children, ...props }, ref) => {
    return (
      <div
        className={`${chipVariants({ variant: active ? 'active' : variant })} ${className || ''}`}
        ref={ref}
        {...props}
      >
        {children}
        {onRemove && (
          <button type="button" onClick={onRemove} className="ml-1 text-sm hover:opacity-70">
            ×
          </button>
        )}
      </div>
    )
  }
)
Chip.displayName = 'Chip'

const ChipGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={`chips ${className || ''}`} {...props} />
  )
)
ChipGroup.displayName = 'ChipGroup'

export { Chip, ChipGroup, chipVariants }
