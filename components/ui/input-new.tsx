'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputNewProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  floating?: boolean
}

const InputNew = React.forwardRef<HTMLInputElement, InputNewProps>(
  ({ 
    className, 
    type = "text",
    label,
    error,
    icon,
    floating = false,
    placeholder,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const [hasValue, setHasValue] = React.useState(false)
    
    const handleFocus = () => setIsFocused(true)
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      setHasValue(!!e.target.value)
    }
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value)
      props.onChange?.(e)
    }
    
    const inputStyles = cn(
      // Base styles
      "w-full",
      "h-input", // 44px from CSS variable
      "px-4",
      "rounded-full", // 9999px radius
      "border border-[var(--line)]",
      "bg-[var(--card)]",
      "text-[var(--text)]",
      "text-body", // 15px font size
      "font-normal",
      "outline-none",
      "transition-all duration-200",
      
      // Icon padding
      icon && "pl-12",
      
      // Focus styles
      "focus:border-[var(--accent)]",
      "focus:shadow-[0_0_0_3px_var(--tag-blue-20)]",
      
      // Error styles
      error && "border-[var(--warn)] focus:border-[var(--warn)] focus:shadow-[0_0_0_3px_rgba(234,56,41,0.2)]",
      
      // Disabled styles
      "disabled:opacity-50 disabled:cursor-not-allowed",
      
      // Placeholder styles
      "placeholder:text-[var(--muted)] placeholder:text-ctl",
      
      className
    )
    
    const containerStyles = cn(
      "relative",
      floating && "field"
    )
    
    const labelStyles = cn(
      "text-[var(--muted)]",
      "text-ctl",
      "font-medium",
      "transition-all duration-200",
      
      floating && [
        "absolute left-4 top-1/2 -translate-y-1/2",
        "pointer-events-none",
        (isFocused || hasValue) && [
          "top-0 translate-y-0",
          "text-cap", // 12px when floating
          "text-[var(--accent)]",
          "bg-[var(--card)]",
          "px-2 -ml-2"
        ]
      ]
    )
    
    if (floating) {
      return (
        <div className={containerStyles}>
          {icon && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none">
              {icon}
            </span>
          )}
          
          <input
            ref={ref}
            type={type}
            className={inputStyles}
            placeholder=" "
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
          />
          
          {label && (
            <label className={labelStyles}>
              {label}
            </label>
          )}
          
          {error && (
            <p className="mt-1 text-cap text-[var(--warn)] pl-4">
              {error}
            </p>
          )}
        </div>
      )
    }
    
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-ctl font-medium text-[var(--text)]">
            {label}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none">
              {icon}
            </span>
          )}
          
          <input
            ref={ref}
            type={type}
            className={inputStyles}
            placeholder={placeholder}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
          />
        </div>
        
        {error && (
          <p className="text-cap text-[var(--warn)] pl-4">
            {error}
          </p>
        )}
      </div>
    )
  }
)

InputNew.displayName = "InputNew"

// Search variant with different height
export const SearchInput = React.forwardRef<HTMLInputElement, InputNewProps>(
  ({ className, ...props }, ref) => {
    return (
      <InputNew
        ref={ref}
        className={cn(
          "h-search", // 52px for search
          "pl-12", // Space for search icon
          className
        )}
        icon={
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        }
        {...props}
      />
    )
  }
)

SearchInput.displayName = "SearchInput"

export { InputNew }