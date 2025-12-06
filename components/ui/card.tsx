'use client'

import * as React from 'react'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { cn } from '@/lib/utils'

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    elevation?: 'sm' | 'md' | 'lg' | 'xl'
    premium?: boolean
    variant?: 'default' | 'elevated' | 'prominent' | 'section-header' | 'work-card'
  }
>(({ className, elevation = 'sm', premium = false, variant = 'default', ...props }, ref) => {
  const { touchMode } = useTouchMode()

  const touchModeClasses = {
    normal: 'p-4',
    glove: 'p-6',
    precision: 'p-3',
  }

  const elevationClasses = {
    sm: 'shadow-sm hover:shadow-md',
    md: 'shadow-md hover:shadow-lg',
    lg: 'shadow-lg hover:shadow-xl',
    xl: 'shadow-xl hover:shadow-2xl',
  }

  const variantClasses = {
    default:
      'bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-[8px] shadow-sm',
    elevated:
      'bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-[8px] shadow-md ring-1 ring-gray-100 dark:ring-slate-700',
    prominent:
      'bg-white dark:bg-slate-800 border-2 border-gray-400 dark:border-slate-500 rounded-[8px] shadow-lg',
    'section-header':
      'bg-gradient-to-r from-gray-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 border border-gray-300 dark:border-slate-600 rounded-[8px] shadow-sm',
    'work-card':
      'work-card bg-[var(--work-card-bg)] dark:bg-[var(--work-card-bg)] border border-[var(--work-card-border)] dark:border-[var(--work-card-border)] transition-all duration-200 hover:shadow-lg hover:border-[var(--accent)] hover:scale-[1.02]',
  }

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-200',
        premium ? 'bg-premium-light dark:bg-premium-dark' : variantClasses[variant],
        elevationClasses[elevation],
        touchModeClasses[touchMode],
        className
      )}
      {...props}
    />
  )
})
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { touchMode } = useTouchMode()

    const touchModeClasses = {
      normal: 'p-4',
      glove: 'p-6',
      precision: 'p-3',
    }

    return (
      <div
        ref={ref}
        className={cn('flex flex-col space-y-1.5', touchModeClasses[touchMode], className)}
        {...props}
      />
    )
  }
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    const { isLargeFont } = useFontSize()

    return (
      <h3
        ref={ref}
        className={cn(
          getFullTypographyClass('heading', 'xl', isLargeFont),
          'font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-100',
          className
        )}
        {...props}
      />
    )
  }
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { isLargeFont } = useFontSize()

  return (
    <p
      ref={ref}
      className={cn(
        getFullTypographyClass('body', 'sm', isLargeFont),
        'text-gray-500 dark:text-gray-400',
        className
      )}
      {...props}
    />
  )
})
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { touchMode } = useTouchMode()

    const touchModeClasses = {
      normal: 'p-4 pt-0',
      glove: 'p-6 pt-0',
      precision: 'p-3 pt-0',
    }

    return <div ref={ref} className={cn(touchModeClasses[touchMode], className)} {...props} />
  }
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { touchMode } = useTouchMode()

    const touchModeClasses = {
      normal: 'p-4 pt-0',
      glove: 'p-6 pt-0',
      precision: 'p-3 pt-0',
    }

    return (
      <div
        ref={ref}
        className={cn('flex items-center', touchModeClasses[touchMode], className)}
        {...props}
      />
    )
  }
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
