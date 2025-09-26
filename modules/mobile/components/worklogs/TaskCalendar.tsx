'use client'

import React, { useMemo } from 'react'
import clsx from 'clsx'
import {
  addMonths,
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  parseISO,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import '@/modules/mobile/styles/worklogs.css'
import { WorklogCalendarCell } from '@/types/worklog'

export interface TaskCalendarProps {
  month: Date
  data: WorklogCalendarCell[]
  selectedDate?: string
  onDateChange?: (date: string) => void
  onMonthChange?: (month: Date) => void
  className?: string
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export const TaskCalendar: React.FC<TaskCalendarProps> = ({
  month,
  data,
  selectedDate,
  onDateChange,
  onMonthChange,
  className = '',
}) => {
  const calendarMap = useMemo(() => {
    const map = new Map<string, WorklogCalendarCell>()
    data.forEach(cell => {
      map.set(cell.date, cell)
    })
    return map
  }, [data])

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)
    const start = startOfWeek(monthStart, { weekStartsOn: 0 })
    const end = endOfWeek(monthEnd, { weekStartsOn: 0 })

    return eachDayOfInterval({ start, end })
  }, [month])

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const nextMonth = addMonths(month, direction === 'next' ? 1 : -1)
    onMonthChange?.(nextMonth)
  }

  const handleDateClick = (date: Date) => {
    const iso = format(date, 'yyyy-MM-dd')
    onDateChange?.(iso)
  }

  const resolvedSelectedDate = selectedDate ? parseISO(selectedDate) : null

  return (
    <section className={clsx('worklog-calendar', className)}>
      <header className="calendar-header">
        <button
          type="button"
          className="calendar-nav-btn"
          onClick={() => handleMonthChange('prev')}
          aria-label="이전 달"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>

        <h3 className="calendar-title" aria-live="polite">
          {format(month, 'yyyy년 M월')}
        </h3>

        <button
          type="button"
          className="calendar-nav-btn"
          onClick={() => handleMonthChange('next')}
          aria-label="다음 달"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </header>

      <div className="calendar-grid" role="grid">
        {DAY_LABELS.map(label => (
          <div
            key={label}
            className="calendar-header-cell"
            role="columnheader"
            aria-label={`${label}요일`}
          >
            {label}
          </div>
        ))}

        {calendarDays.map(date => {
          const iso = format(date, 'yyyy-MM-dd')
          const cell = calendarMap.get(iso)
          const isOutside = !isSameMonth(date, month)
          const isSelected =
            resolvedSelectedDate && format(resolvedSelectedDate, 'yyyy-MM-dd') === iso
          const today = isToday(date)

          return (
            <button
              key={iso}
              type="button"
              className={clsx(
                'calendar-cell',
                isOutside && 'outside',
                isSelected && 'active',
                today && 'calendar-today'
              )}
              onClick={() => handleDateClick(date)}
              aria-pressed={isSelected}
              role="gridcell"
            >
              <span className="calendar-date">{format(date, 'd')}</span>
              {cell ? (
                <div className="calendar-stats" aria-label="일간 작업일지 현황">
                  <span className="calendar-stat-pill submitted">제출 {cell.submitted}</span>
                  <span className="calendar-stat-pill draft">임시 {cell.draft}</span>
                  <span className="calendar-stat-pill">전체 {cell.total}</span>
                </div>
              ) : null}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default TaskCalendar
