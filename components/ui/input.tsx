'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const { isLargeFont } = useFontSize()
    const { touchMode } = useTouchMode()

    const touchModeClasses = {
      normal: 'h-12 px-3 py-2',
      glove: 'h-14 px-4 py-3',
      precision: 'h-10 px-2.5 py-1.5',
    }

    return (
      <input
        type={type}
        className={cn(
          'flex w-full rounded-lg border border-toss-gray-200 dark:border-toss-gray-700 bg-white dark:bg-toss-gray-800',
          touchModeClasses[touchMode],
          getFullTypographyClass('body', 'base', isLargeFont),
          'text-toss-gray-900 dark:text-toss-gray-100 ring-offset-white dark:ring-offset-toss-gray-900 file:border-0 file:bg-transparent file:font-medium placeholder:text-toss-gray-500 dark:placeholder:text-toss-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toss-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          getFullTypographyClass('body', 'sm', isLargeFont).replace('text-', 'file:text-'),
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
