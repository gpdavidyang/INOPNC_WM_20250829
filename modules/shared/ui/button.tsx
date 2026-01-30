'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import React from 'react'

const buttonVariants = cva('btn', {
  variants: {
    variant: {
      default: 'active:scale-[0.98] transition-all duration-200 active:bg-gray-100',
      primary:
        'btn--primary active:scale-[0.98] transition-transform duration-200 shadow-lg shadow-blue-500/20 active:shadow-blue-500/10',
      gray: 'btn--gray active:scale-[0.98] transition-transform duration-200',
      sky: 'btn--sky active:scale-[0.98] transition-transform duration-200',
      outline:
        'btn--outline active:scale-[0.98] transition-transform duration-200 active:bg-gray-50',
      ghost: 'btn--ghost active:scale-[0.95] transition-transform duration-200',
      danger: 'btn--danger active:scale-[0.98] transition-transform duration-200',
    },
    size: {
      default: 'h-[var(--btn-h)] px-4 rounded-[var(--radius-base)]', // 54px custom height
      sm: 'h-9 px-3 text-xs rounded-md',
      lg: 'h-14 px-8 text-lg rounded-[var(--radius-lg)]',
      standard: 'h-[54px] px-5 rounded-[12px] text-[17px] font-bold', // Explicit standard
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
})

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  ripple?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading, ripple, children, onClick, ...props },
    ref
  ) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple && e.currentTarget) {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        e.currentTarget.style.setProperty('--x', `${x}%`)
        e.currentTarget.style.setProperty('--y', `${y}%`)
      }
      onClick?.(e)
    }

    return (
      <button
        className={`${buttonVariants({ variant, size })} ${ripple ? 'ripple' : ''} ${className || ''}`}
        ref={ref}
        onClick={handleClick}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && <div className="loading-spinner w-4 h-4" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
