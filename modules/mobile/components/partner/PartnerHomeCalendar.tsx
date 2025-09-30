'use client'

import React, { useMemo } from 'react'

interface PartnerHomeCalendarProps {
  selectedDate: string // yyyy-mm-dd
  onChange: (date: string) => void
}

function fmt(d: Date) {
  return d.toISOString().split('T')[0]
}

export const PartnerHomeCalendar: React.FC<PartnerHomeCalendarProps> = ({
  selectedDate,
  onChange,
}) => {
  const { weekDays, currentIdx } = useMemo(() => {
    const today = selectedDate ? new Date(selectedDate) : new Date()
    const start = new Date(today)
    // Start on Sunday
    start.setDate(today.getDate() - today.getDay())
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
    const idx = days.findIndex(d => fmt(d) === fmt(today))
    return { weekDays: days, currentIdx: idx }
  }, [selectedDate])

  const labels = ['일', '월', '화', '수', '목', '금', '토']

  const move = (delta: number) => {
    const base = selectedDate ? new Date(selectedDate) : new Date()
    base.setDate(base.getDate() + delta * 7)
    onChange(fmt(base))
  }

  return (
    <div className="ph-cal-wrap">
      <div className="ph-cal-bar">
        <button className="ph-nav-btn" onClick={() => move(-1)} aria-label="이전 주">
          이전주
        </button>
        <div className="ph-cal-title">이번 주</div>
        <button className="ph-nav-btn" onClick={() => move(1)} aria-label="다음 주">
          다음주
        </button>
      </div>
      <div className="ph-cal-grid">
        {weekDays.map((d, i) => {
          const iso = fmt(d)
          const isToday = iso === fmt(new Date())
          const isActive = iso === selectedDate
          const btnCls = `ph-cal-btn ${isToday ? 'ph-today' : ''} ${isActive ? 'ph-active' : ''}`
          return (
            <button key={iso} className={btnCls} onClick={() => onChange(iso)}>
              <div className="ph-dow">{labels[i]}</div>
              <div className="ph-day">{d.getDate()}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default PartnerHomeCalendar
