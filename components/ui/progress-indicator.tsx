import React from 'react'
import { cn } from '@/lib/utils'

interface ProgressIndicatorProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function ProgressIndicator({
  value,
  max = 100,
  size = 'md',
  showLabel = true,
  className
}: ProgressIndicatorProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={cn(
            'bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300 ease-out',
            sizeClasses[size]
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
      {showLabel && (
        <span className={cn(
          'font-medium text-gray-700 dark:text-gray-300 min-w-[3rem] text-right',
          size === 'sm' && 'text-sm',
          size === 'lg' && 'text-lg'
        )}>
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  )
}