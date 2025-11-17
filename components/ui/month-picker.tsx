'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type MonthPickerProps = {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel?: string
  className?: string
}

const getYearMonth = (value?: string) => {
  if (!value) return { year: null, month: null }
  const [y, m] = value.split('-')
  const year = Number(y)
  const month = Number(m)
  if (!Number.isFinite(year) || !Number.isFinite(month)) return { year: null, month: null }
  return { year, month }
}

const formatLabel = (value?: string, placeholder: string = '년월 선택') => {
  const parsed = getYearMonth(value)
  if (!parsed.year || !parsed.month) return placeholder
  return `${parsed.year}년 ${String(parsed.month).padStart(2, '0')}월`
}

export function MonthPicker({
  value,
  onChange,
  placeholder = '년월 선택',
  ariaLabel,
  className,
}: MonthPickerProps) {
  const [open, setOpen] = useState(false)
  const { year: selectedYear, month: selectedMonth } = useMemo(() => getYearMonth(value), [value])
  const now = useMemo(() => new Date(), [])
  const [viewYear, setViewYear] = useState(() => selectedYear || now.getFullYear())

  useEffect(() => {
    if (open) {
      setViewYear(selectedYear || now.getFullYear())
    }
  }, [open, selectedYear, now])

  const selectMonth = (month: number) => {
    const year = viewYear || now.getFullYear()
    const payload = `${year}-${String(month).padStart(2, '0')}`
    onChange(payload)
    setOpen(false)
  }

  const handleSetCurrent = () => {
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    setViewYear(currentYear)
    onChange(`${currentYear}-${String(currentMonth).padStart(2, '0')}`)
    setOpen(false)
  }

  const label = formatLabel(value, placeholder)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          aria-expanded={open}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 text-sm text-left shadow-sm transition hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
            className
          )}
        >
          <span className={cn(value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500')}>
            {label}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-500" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-60 rounded-lg border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-700 dark:bg-gray-900"
        align="start"
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="rounded-md p-1 text-gray-600 hover:bg-gray-100"
            onClick={() => setViewYear(prev => prev - 1)}
            aria-label="이전 해"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-sm font-semibold text-gray-900">{viewYear}년</div>
          <button
            type="button"
            className="rounded-md p-1 text-gray-600 hover:bg-gray-100"
            onClick={() => setViewYear(prev => prev + 1)}
            aria-label="다음 해"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {Array.from({ length: 12 }).map((_, idx) => {
            const month = idx + 1
            const isSelected = selectedYear === viewYear && selectedMonth === month
            const isCurrent =
              now.getFullYear() === viewYear && now.getMonth() + 1 === month && !isSelected
            return (
              <button
                key={month}
                type="button"
                onClick={() => selectMonth(month)}
                className={cn(
                  'rounded-md px-2 py-1.5 text-sm font-medium transition',
                  isSelected
                    ? 'bg-blue-600 text-white shadow'
                    : isCurrent
                      ? 'bg-gray-100 text-gray-900'
                      : 'bg-white text-gray-800 hover:bg-gray-50',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200'
                )}
              >
                {month}월
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            className="text-xs text-gray-500 underline decoration-dotted underline-offset-4 hover:text-gray-700"
            onClick={handleSetCurrent}
          >
            이번 달
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
