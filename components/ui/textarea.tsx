'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    const { isLargeFont } = useFontSize()
    const { touchMode } = useTouchMode()

    const touchModeClasses = {
      normal: 'min-h-[80px] px-3 py-2',
      glove: 'min-h-[100px] px-4 py-3',
      precision: 'min-h-[70px] px-2.5 py-1.5',
    }

    return (
      <textarea
        className={cn(
          'flex w-full rounded-lg border border-toss-gray-200 dark:border-toss-gray-700 bg-white dark:bg-toss-gray-800',
          touchModeClasses[touchMode],
          getFullTypographyClass('body', 'base', isLargeFont),
          'text-toss-gray-900 dark:text-toss-gray-100 ring-offset-white dark:ring-offset-toss-gray-900 placeholder:text-toss-gray-500 dark:placeholder:text-toss-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toss-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
