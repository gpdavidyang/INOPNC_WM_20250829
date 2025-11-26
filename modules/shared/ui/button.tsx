'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import React from 'react'

const buttonVariants = cva('btn', {
  variants: {
    variant: {
      default: '',
      primary: 'btn--primary',
      gray: 'btn--gray',
      sky: 'btn--sky',
      outline: 'btn--outline',
      ghost: 'btn--ghost',
      danger: 'btn--danger',
    },
    size: {
      default: '',
      sm: 'h-9 px-3 text-xs',
      lg: 'h-12 px-8',
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
