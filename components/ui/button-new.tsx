'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonNewProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'gray' | 'sky' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'full'
  loading?: boolean
  ripple?: boolean
}

const ButtonNew = React.forwardRef<HTMLButtonElement, ButtonNewProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md',
    loading = false,
    ripple = true,
    disabled,
    children,
    onClick,
    ...props 
  }, ref) => {
    const [rippleEffect, setRippleEffect] = React.useState<{ x: number; y: number } | null>(null)
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple && !disabled && !loading) {
        const button = e.currentTarget
        const rect = button.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        
        setRippleEffect({ x, y })
        setTimeout(() => setRippleEffect(null), 450)
      }
      
      onClick?.(e)
    }
    
    const baseStyles = cn(
      // Base styles
      "inline-flex items-center justify-center gap-2",
      "font-medium rounded-lg",
      "transition-all duration-200",
      "transform active:scale-[0.98]",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "relative overflow-hidden",
      
      // Height based on design tokens
      "h-btn", // 44px from CSS variable
      
      // Font size
      "text-ctl", // 14px from design tokens
    )
    
    const variants = {
      primary: cn(
        "bg-[var(--brand)] text-white",
        "hover:brightness-95",
        "focus-visible:ring-[var(--brand)]",
        "border border-[var(--brand)]"
      ),
      gray: cn(
        "bg-[var(--gray-btn)] text-white",
        "hover:brightness-95",
        "focus-visible:ring-[var(--gray-btn)]",
        "border border-[var(--gray-btn)]"
      ),
      sky: cn(
        "bg-[var(--sky-btn)] text-white",
        "hover:brightness-95",
        "focus-visible:ring-[var(--sky-btn)]",
        "border border-[var(--sky-btn)]"
      ),
      outline: cn(
        "bg-transparent",
        "border border-[var(--line)]",
        "text-[var(--text)]",
        "hover:bg-[var(--tag-blue-20)]",
        "focus-visible:ring-[var(--accent)]"
      ),
      ghost: cn(
        "bg-[var(--card)]",
        "text-[var(--text)]",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        "focus-visible:ring-[var(--accent)]",
        "border border-transparent"
      ),
      danger: cn(
        "bg-[var(--warn)] text-white",
        "hover:brightness-95",
        "focus-visible:ring-[var(--warn)]",
        "border border-[var(--warn)]"
      )
    }
    
    const sizes = {
      sm: "px-3 text-sm",
      md: "px-4",
      lg: "px-6 text-base",
      full: "w-full px-6"
    }
    
    const rippleStyles = rippleEffect ? {
      '--x': `${rippleEffect.x}%`,
      '--y': `${rippleEffect.y}%`,
    } as React.CSSProperties : {}
    
    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        style={rippleStyles}
        disabled={disabled || loading}
        onClick={handleClick}
        {...props}
      >
        {/* Ripple effect layer */}
        {rippleEffect && (
          <span
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at var(--x) var(--y), rgba(255,255,255,0.35) 12%, transparent 13%)`,
              animation: 'ripple 0.45s ease-out'
            }}
          />
        )}
        
        {/* Loading spinner */}
        {loading && (
          <svg 
            className="animate-spin -ml-1 mr-2 h-4 w-4" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        
        {/* Button content */}
        <span className="relative z-10">
          {children}
        </span>
      </button>
    )
  }
)

ButtonNew.displayName = "ButtonNew"

export { ButtonNew }