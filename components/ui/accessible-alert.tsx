'use client'

import React, { forwardRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react'

export type AlertVariant = 'info' | 'success' | 'warning' | 'error'
export type AlertRole = 'alert' | 'status' | 'alertdialog'

export interface AccessibleAlertProps {
  children: ReactNode
  variant?: AlertVariant
  role?: AlertRole
  title?: string
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
  icon?: boolean
  live?: 'off' | 'polite' | 'assertive'
}

const variantStyles = {
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
    icon: 'text-blue-500 dark:text-blue-400',
    IconComponent: Info
  },
  success: {
    container: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200',
    icon: 'text-green-500 dark:text-green-400',
    IconComponent: CheckCircle
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200',
    icon: 'text-amber-500 dark:text-amber-400',
    IconComponent: AlertCircle
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
    icon: 'text-red-500 dark:text-red-400',
    IconComponent: XCircle
  }
}

export const AccessibleAlert = forwardRef<HTMLDivElement, AccessibleAlertProps>(
  ({ 
    children, 
    variant = 'info', 
    role = 'alert',
    title, 
    dismissible = false, 
    onDismiss, 
    className,
    icon = true,
    live = 'polite',
    ...props 
  }, ref) => {
    const { isLargeFont } = useFontSize()
    const { touchMode } = useTouchMode()
    
    const styles = variantStyles[variant]
    const IconComponent = styles.IconComponent
    
    const getPadding = () => {
      if (touchMode === 'glove') return 'p-5'
      if (touchMode === 'precision') return 'p-3'
      return 'p-4'
    }

    const getIconSize = () => {
      if (touchMode === 'glove') return 'h-6 w-6'
      if (touchMode === 'precision') return 'h-4 w-4'
      return 'h-5 w-5'
    }

    return (
      <div
        ref={ref}
        role={role}
        aria-live={live}
        className={cn(
          'border rounded-lg',
          styles.container,
          getPadding(),
          className
        )}
        {...props}
      >
        <div className="flex items-start gap-3">
          {icon && (
            <IconComponent 
              className={cn(getIconSize(), styles.icon, 'mt-0.5 flex-shrink-0')}
              aria-hidden="true"
            />
          )}
          
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className={cn(
                'font-semibold mb-1',
                getFullTypographyClass('body', 'base', isLargeFont)
              )}>
                {title}
              </h3>
            )}
            
            <div className={cn(
              getFullTypographyClass('body', 'sm', isLargeFont)
            )}>
              {children}
            </div>
          </div>
          
          {dismissible && onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className={cn(
                'flex-shrink-0 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors',
                touchMode === 'glove' ? 'p-2' : touchMode === 'precision' ? 'p-1' : 'p-1.5',
                'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500'
              )}
              aria-label="알림 닫기"
            >
              <X className={cn(
                getIconSize(),
                'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              )} />
            </button>
          )}
        </div>
      </div>
    )
  }
)

AccessibleAlert.displayName = 'AccessibleAlert'