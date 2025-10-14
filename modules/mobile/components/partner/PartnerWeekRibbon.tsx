'use client'

import React, { useEffect, useMemo, useState } from 'react'

interface Props {
  selectedDate: string // yyyy-mm-dd
  onChange: (date: string) => void
  // When provided, clicking "전체보기" will toggle an inline month calendar
  onToggleViewAll?: () => void
  expanded?: boolean
}

function fmt(d: Date) {
  return d.toISOString().split('T')[0]
}

export const PartnerWeekRibbon: React.FC<Props> = ({
  selectedDate,
  onChange,
  onToggleViewAll,
  expanded,
}) => {
  const [dayData, setDayData] = useState<Record<string, { sites: number; hours: number }>>({})
  const [selWorkers, setSelWorkers] = useState<number>(0)
  const [selTopLabel, setSelTopLabel] = useState<string>('')

  // Helper: extract city/region short label from address or name
  function extractRegionLabel(input?: string | null): string {
    if (!input) return ''
    const s = String(input)
    const regions = [
      '서울',
      '부산',
      '대구',
      '인천',
      '광주',
      '대전',
      '울산',
      '세종',
      '경기',
      '강원',
      '충북',
      '충남',
      '전북',
      '전남',
      '경북',
      '경남',
      '제주',
    ]
    for (const r of regions) {
      if (s.includes(r)) return r
    }
    const first = s.trim().split(/\s+/)[0] || ''
    return first.slice(0, Math.min(3, first.length))
  }

  const { days } = useMemo(() => {
    const base = selectedDate ? new Date(selectedDate) : new Date()
    // 주 시작: 월요일(0=월,6=일 기준 오프셋 계산)
    const day = base.getDay() // 0=일,1=월,...6=토
    const offsetFromMonday = (day + 6) % 7 // 일(0)->6, 월(1)->0, ...
    const start = new Date(base)
    start.setDate(base.getDate() - offsetFromMonday)
    const arr: Date[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      arr.push(d)
    }
    return { days: arr }
  }, [selectedDate])

  useEffect(() => {
    let alive = true
    async function run() {
      const entries = await Promise.all(
        days.map(async d => {
          const date = fmt(d)
          try {
            const res = await fetch(`/api/partner/labor/by-site?date=${encodeURIComponent(date)}`, {
              cache: 'no-store',
            })
            const payload = await res.json().catch(() => ({}))
            const list = Array.isArray(payload?.sites) ? payload.sites : []
            const hours = list.reduce(
              (sum: number, s: any) => sum + (Number(s.totalLaborHours) || 0),
              0
            )
            return [date, { sites: list.length, hours }] as const
          } catch {
            return [date, { sites: 0, hours: 0 }] as const
          }
        })
      )
      if (!alive) return
      const m: Record<string, { sites: number; hours: number }> = {}
      entries.forEach(([k, v]) => {
        m[k] = v
      })
      setDayData(m)
    }
    run()
    return () => {
      alive = false
    }
  }, [days])

  // Selected day extra info (workers + top city/site)
  useEffect(() => {
    let alive = true
    async function run() {
      try {
        const qs = new URLSearchParams({ start_date: selectedDate, end_date: selectedDate })
        const res = await fetch(`/api/partner/daily-reports?${qs.toString()}`, {
          cache: 'no-store',
        })
        const payload = await res.json().catch(() => ({}))
        const reports = Array.isArray(payload?.data?.reports) ? payload.data.reports : []
        let count = 0
        let topSite = ''
        if (reports.length > 0) {
          const r0 = reports[0]
          topSite = r0?.sites?.name || r0?.siteName || ''
        }
        reports.forEach((r: any) => {
          const wa = Array.isArray(r?.worker_assignments) ? r.worker_assignments : []
          count += wa.length
        })

        // Try to derive city label from partner sites for that day
        let city = ''
        try {
          const bySite = await fetch(
            `/api/partner/labor/by-site?date=${encodeURIComponent(selectedDate)}`,
            { cache: 'no-store' }
          )
          const data = await bySite.json().catch(() => ({}))
          const first = Array.isArray(data?.sites) && data.sites.length > 0 ? data.sites[0] : null
          if (first?.address) city = extractRegionLabel(first.address)
        } catch {
          /* ignore */
        }
        if (!city) city = extractRegionLabel(topSite)
        if (alive) {
          setSelWorkers(count)
          setSelTopLabel(city || topSite || '')
        }
      } catch {
        if (alive) {
          setSelWorkers(0)
          setSelTopLabel('')
        }
      }
    }
    if (selectedDate) run()
    return () => {
      alive = false
    }
  }, [selectedDate])

  // 월요일 시작 순서
  const labels = ['월', '화', '수', '목', '금', '토', '일']
  const todayIso = fmt(new Date())

  return (
    <section>
      <div className="calendar-header">
        <h3 className="calendar-title">오늘의 현장</h3>
        {onToggleViewAll ? (
          <button
            type="button"
            className="view-all-link"
            aria-controls="partner-month-calendar"
            aria-expanded={!!expanded}
            onClick={onToggleViewAll}
          >
            {expanded ? '간단히' : '전체보기'}
          </button>
        ) : (
          <a className="view-all-link" href="/mobile/sites">
            전체보기
          </a>
        )}
      </div>
      <div className="week-days">
        {labels.map((l, i) => (
          <div key={i} className="day-label">
            {l}
          </div>
        ))}
      </div>
      <div className="week-dates">
        {days.map((d, i) => {
          const iso = fmt(d)
          const isToday = iso === todayIso
          const isActive = iso === selectedDate
          const cls = `date-item ${isToday ? 'today' : ''} ${isActive ? 'active' : ''}`
          const data = dayData[iso] || { sites: 0, hours: 0 }
          // When selected date has no data, hide labels entirely (no region, no 0명)
          const hasSelectedData = selWorkers > 0
          const siteLabel = isActive ? (hasSelectedData ? selTopLabel : '') : '—'
          const hourLabel = isActive ? (hasSelectedData ? `${selWorkers}명` : '') : '—'
          return (
            <button key={iso} className={cls} onClick={() => onChange(iso)}>
              <span className="date-number">{d.getDate()}</span>
              <span className="site-name">{siteLabel}</span>
              <span className="work-days">{hourLabel}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default PartnerWeekRibbon
