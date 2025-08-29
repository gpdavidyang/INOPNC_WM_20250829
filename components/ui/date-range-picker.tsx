'use client'

import { useState } from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface DateRange {
  from: Date
  to: Date
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
  className?: string
  placeholder?: string
}

export function DateRangePicker({ 
  value, 
  onChange, 
  className,
  placeholder = "날짜 범위 선택"
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const formatDateRange = (range: DateRange) => {
    try {
      const fromStr = format(range.from, 'M월 d일', { locale: ko })
      const toStr = format(range.to, 'M월 d일', { locale: ko })
      
      if (range.from.getFullYear() === range.to.getFullYear()) {
        return `${fromStr} - ${toStr}`
      } else {
        const fromStrWithYear = format(range.from, 'yyyy년 M월 d일', { locale: ko })
        const toStrWithYear = format(range.to, 'yyyy년 M월 d일', { locale: ko })
        return `${fromStrWithYear} - ${toStrWithYear}`
      }
    } catch (error) {
      return placeholder
    }
  }

  const handleSelect = (range: any) => {
    if (range?.from && range?.to) {
      onChange({
        from: range.from,
        to: range.to
      })
      setIsOpen(false)
    } else if (range?.from) {
      // Single date selected, keep popover open for second date
      // Don't update the state yet
    }
  }

  const presetRanges = [
    {
      label: '최근 7일',
      range: {
        from: new Date(new Date().setDate(new Date().getDate() - 7)),
        to: new Date()
      }
    },
    {
      label: '최근 30일',
      range: {
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date()
      }
    },
    {
      label: '최근 90일',
      range: {
        from: new Date(new Date().setDate(new Date().getDate() - 90)),
        to: new Date()
      }
    },
    {
      label: '이번 달',
      range: {
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date()
      }
    },
    {
      label: '지난 달',
      range: (() => {
        const lastMonth = new Date()
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        const firstDay = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1)
        const lastDay = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0)
        return { from: firstDay, to: lastDay }
      })()
    }
  ]

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? formatDateRange(value) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            <div className="border-r p-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">빠른 선택</h4>
                {presetRanges.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-sm"
                    onClick={() => {
                      onChange(preset.range)
                      setIsOpen(false)
                    }}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={value?.from}
              selected={{ from: value.from, to: value.to }}
              onSelect={handleSelect}
              numberOfMonths={2}
              locale={ko}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}