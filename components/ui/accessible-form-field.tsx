'use client'

import React, { forwardRef, ReactNode } from 'react'

export interface AccessibleFormFieldProps {
  children: ReactNode
  label: string
  description?: string
  error?: string
  required?: boolean
  fieldId: string
  className?: string
}

export const AccessibleFormField = forwardRef<HTMLDivElement, AccessibleFormFieldProps>(
  ({ children, label, description, error, required, fieldId, className }, ref) => {
    const { isLargeFont } = useFontSize()
    const { touchMode } = useTouchMode()
    
    const descriptionId = description ? `${fieldId}-description` : undefined
    const errorId = error ? `${fieldId}-error` : undefined
    
    const getTouchSpacing = () => {
      if (touchMode === 'glove') return 'space-y-3'
      if (touchMode === 'precision') return 'space-y-1.5'
      return 'space-y-2'
    }

    return (
      <div ref={ref} className={cn(getTouchSpacing(), className)}>
        <label
          htmlFor={fieldId}
          className={cn(
            'block font-medium text-gray-700 dark:text-gray-300',
            getFullTypographyClass('body', 'sm', isLargeFont)
          )}
        >
          {label}
          {required && (
            <span 
              className="text-red-500 ml-1" 
              aria-label="필수 항목"
              role="img"
            >
              *
            </span>
          )}
        </label>
        
        {description && (
          <p
            id={descriptionId}
            className={cn(
              'text-gray-600 dark:text-gray-400',
              getFullTypographyClass('caption', 'sm', isLargeFont)
            )}
          >
            {description}
          </p>
        )}
        
        <div>
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && typeof child.type !== 'string') {
              return React.cloneElement(child as React.ReactElement<unknown>, {
                id: fieldId,
                'aria-describedby': cn(
                  descriptionId,
                  errorId
                ).trim() || undefined,
                'aria-invalid': error ? 'true' : undefined,
                'aria-required': required ? 'true' : undefined,
                ...child.props,
              })
            }
            return child
          })}
        </div>
        
        {error && (
          <div
            id={errorId}
            role="alert"
            aria-live="polite"
            className={cn(
              'text-red-600 dark:text-red-400',
              getFullTypographyClass('caption', 'sm', isLargeFont)
            )}
          >
            {error}
          </div>
        )}
      </div>
    )
  }
)

AccessibleFormField.displayName = 'AccessibleFormField'