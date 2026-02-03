'use client'

import { getFullTypographyClass, useFontSize } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { formatMetric, unitLabel, type UnitKey } from '@/lib/ui/metrics'
import { cn } from '@/lib/utils'
import React from 'react'

interface StatsCardProps {
  label: string
  value: number | string | React.ReactNode
  unit?: UnitKey | string
  decimals?: number
  currency?: boolean
  className?: string
}

export default function StatsCard({
  label,
  value,
  unit,
  decimals,
  currency,
  className,
}: StatsCardProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()

  // Touch mode spacing standardization
  const padClass = touchMode === 'glove' ? 'p-5' : touchMode === 'precision' ? 'p-3' : 'p-4'

  return (
    <div
      className={cn(
        'rounded-[8px]',
        // Color guideline: background/text within #F3F7FA, #8DA0CD range
        'bg-[#F3F7FA] text-gray-900',
        'min-h-[96px]',
        padClass,
        className
      )}
    >
      {/* Top label */}
      <div
        className={cn('mb-1', getFullTypographyClass('body', 'sm', isLargeFont), 'text-[#8DA0CD]')}
      >
        {label}
      </div>
      {/* Value row */}
      <div className="flex items-baseline gap-1">
        {typeof value === 'number' ? (
          (() => {
            const fm = formatMetric(value, unit as any, { decimals, currency })
            return (
              <>
                <div
                  className={cn(
                    getFullTypographyClass('heading', '2xl', isLargeFont),
                    'font-semibold'
                  )}
                >
                  {fm.valueText}
                </div>
                {fm.unitText && (
                  <div
                    className={cn(
                      getFullTypographyClass('body', 'sm', isLargeFont),
                      'text-[#8DA0CD]'
                    )}
                  >
                    {fm.unitText}
                  </div>
                )}
              </>
            )
          })()
        ) : (
          <>
            <div
              className={cn(getFullTypographyClass('heading', '2xl', isLargeFont), 'font-semibold')}
            >
              {value}
            </div>
            {unit && (
              <div
                className={cn(getFullTypographyClass('body', 'sm', isLargeFont), 'text-[#8DA0CD]')}
              >
                {unitLabel(unit as any)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
