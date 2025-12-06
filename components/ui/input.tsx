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
      normal: 'h-11 px-3 py-2', // 44px
      glove: 'h-14 px-4 py-3', // 56px
      precision: 'h-10 px-2.5 py-1.5', // 40px
    }

    return (
      <input
        type={type}
        className={cn(
          'flex w-full rounded-[8px] border border-[--neutral-200] bg-white',
          touchModeClasses[touchMode],
          getFullTypographyClass('body', 'base', isLargeFont),
          'text-gray-900 ring-offset-white file:border-0 file:bg-transparent file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--focus] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
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
