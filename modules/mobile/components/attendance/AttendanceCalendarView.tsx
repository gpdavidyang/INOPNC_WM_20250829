'use client'

import clsx from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import React from 'react'
import { CalendarDaySummary } from '../../types/attendance'

interface AttendanceCalendarViewProps {
  currentPeriodText: string
  handlePrevious: () => void
  handleNext: () => void
  calendarDays: CalendarDaySummary[]
  onDayClick: (iso: string) => void
  monthlyStats: {
    workDays: number
    siteCount: number
    totalManDays: number
  }
}

export const AttendanceCalendarView: React.FC<AttendanceCalendarViewProps> = ({
  currentPeriodText,
  handlePrevious,
  handleNext,
  calendarDays,
  onDayClick,
  monthlyStats,
}) => {
  return (
    <div className="attendance-calendar-section animate-fade-in">
      <div className="cal-wrap">
        <div className="cal-head">
          <button onClick={handlePrevious} className="cal-nav-button" aria-label="Previous">
            <ChevronLeft className="cal-nav-icon" />
          </button>
          <button className="cal-title-button" type="button">
            {currentPeriodText}
          </button>
          <button onClick={handleNext} className="cal-nav-button" aria-label="Next">
            <ChevronRight className="cal-nav-icon" />
          </button>
        </div>

        <div className="cal-grid cal-grid-header">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
            <div key={day} className={clsx('dow', i === 0 && 'sun')}>
              {day}
            </div>
          ))}
        </div>

        <div className="cal-grid cal-grid-body">
          {calendarDays.map((day, idx) => (
            <div
              key={day.iso}
              onClick={() => onDayClick(day.iso)}
              className={clsx('cal-cell cal-cell--clickable', !day.isCurrentMonth && 'out')}
            >
              <span className={clsx('date', day.isSunday && 'sun')}>{day.date.getDate()}</span>

              {day.hasRecords && (
                <>
                  <div className="site-name">{day.sites.length > 0 ? day.sites[0] : '미지정'}</div>
                  <div className="work-hours">{day.totalManDays.toFixed(1)}</div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="stat-grid mt-4">
        <div className="stat stat-workdays">
          <div className="num">{monthlyStats.workDays}</div>
          <div className="label">출력일</div>
        </div>
        <div className="stat stat-sites">
          <div className="num">{monthlyStats.siteCount}</div>
          <div className="label">현장</div>
        </div>
        <div className="stat stat-hours">
          <div className="num">{monthlyStats.totalManDays.toFixed(1)}</div>
          <div className="label">총 공수</div>
        </div>
      </div>
    </div>
  )
}
