'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useUnifiedAuth } from '@/hooks/use-unified-auth'
import PartnerWeekRibbon from './PartnerWeekRibbon'
import { QuickMenu } from '@/modules/mobile/components/home/QuickMenu'
import { NoticeSection } from '@/modules/mobile/components/home/NoticeSection'
import PartnerHomeSiteInfo from './PartnerHomeSiteInfo'
import PartnerHomeSiteSearch from './PartnerHomeSiteSearch'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Period = 'daily' | 'weekly' | 'monthly'

interface LaborSummary {
  totalSites: number
  activeSites: number
  totalLaborHours: number
  averageDailyHours: number
  overtimeHours: number
  workingDays: number
  period?: string
  dateRange?: { startDate: string; endDate: string }
}

export const PartnerHomePage: React.FC = () => {
  const { profile } = useUnifiedAuth()
  const [period, setPeriod] = useState<Period>('monthly')
  const [summary, setSummary] = useState<LaborSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingCount, setPendingCount] = useState<number>(0)
  const [todaySubmitted, setTodaySubmitted] = useState<number>(0)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [showMonth, setShowMonth] = useState<boolean>(false)

  // Month calendar state (expansion below "오늘의 현장")
  const [monthDate, setMonthDate] = useState<Date>(new Date())
  const y = monthDate.getFullYear()
  const m = monthDate.getMonth() + 1
  const firstDay = new Date(y, m - 1, 1)
  const lastDay = new Date(y, m, 0)
  const startDate = firstDay.toISOString().split('T')[0]
  const endDate = lastDay.toISOString().split('T')[0]
  const [daily, setDaily] = useState<Record<string, { manDays: number; hours: number }>>({})
  const [topSiteByDate, setTopSiteByDate] = useState<
    Record<string, { site_id: string; site_name?: string | null }>
  >({})
  const [loadingDaily, setLoadingDaily] = useState(false)

  const partnerOrgId = useMemo(() => profile?.organization_id ?? null, [profile?.organization_id])

  useEffect(() => {
    let isActive = true
    const controller = new AbortController()

    async function fetchSummary() {
      setLoading(true)
      setError(null)
      try {
        const url = `/api/partner/labor/summary?period=${period}`
        const res = await fetch(url, { cache: 'no-store', signal: controller.signal })
        if (!res.ok) {
          const msg = await res.text().catch(() => '')
          throw new Error(msg || '요약 정보를 불러오지 못했습니다')
        }
        const data = (await res.json()) as LaborSummary
        if (isActive) setSummary(data)
      } catch (e: any) {
        if (e?.name === 'AbortError') return
        console.error('[PartnerHome] summary error:', e)
        if (isActive) setError(e?.message || '요약 정보 오류')
      } finally {
        if (isActive) setLoading(false)
      }
    }

    fetchSummary()
    return () => {
      isActive = false
      controller.abort()
    }
  }, [period])

  // Additional KPIs: 승인 대기 수(기간 적용), 금일 제출 수
  useEffect(() => {
    let isActive = true
    const controller = new AbortController()

    async function fetchAdditionalKPIs() {
      try {
        // 기간 계산
        const now = new Date()
        let startDate: string
        let endDate: string
        if (period === 'daily') {
          startDate = now.toISOString().split('T')[0]
          endDate = startDate
        } else if (period === 'weekly') {
          const weekStart = new Date(now)
          weekStart.setDate(now.getDate() - now.getDay())
          startDate = weekStart.toISOString().split('T')[0]
          endDate = now.toISOString().split('T')[0]
        } else {
          const first = new Date(now.getFullYear(), now.getMonth(), 1)
          startDate = first.toISOString().split('T')[0]
          endDate = now.toISOString().split('T')[0]
        }

        // 승인 대기: submitted + completed (approved 제외, draft 제외) within period
        const base = '/api/partner/daily-reports'
        const queryRange = `start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(
          endDate
        )}`
        const pendingRes = await Promise.all(
          ['submitted', 'completed'].map(s =>
            fetch(`${base}?status=${s}&${queryRange}`, {
              cache: 'no-store',
              signal: controller.signal,
            })
          )
        )
        let pending = 0
        for (const res of pendingRes) {
          if (res.ok) {
            const json = await res.json().catch(() => null)
            const c = Number(json?.data?.totalCount || 0)
            pending += Number.isFinite(c) ? c : 0
          }
        }
        if (isActive) setPendingCount(pending)

        // 금일 제출: approved + submitted + completed within today (고정)
        const today = new Date().toISOString().split('T')[0]
        const statuses = ['approved', 'submitted', 'completed']
        const todayRes = await Promise.all(
          statuses.map(s =>
            fetch(
              `${base}?start_date=${encodeURIComponent(today)}&end_date=${encodeURIComponent(today)}&status=${s}`,
              { cache: 'no-store', signal: controller.signal }
            )
          )
        )
        let todayCount = 0
        for (const res of todayRes) {
          if (res.ok) {
            const json = await res.json().catch(() => null)
            const c = Number(json?.data?.totalCount || 0)
            todayCount += Number.isFinite(c) ? c : 0
          }
        }
        if (isActive) setTodaySubmitted(todayCount)
      } catch (e) {
        if ((e as any)?.name === 'AbortError') return
        console.warn('[PartnerHome] additional KPI fetch error:', e)
      }
    }

    fetchAdditionalKPIs()
    return () => {
      isActive = false
      controller.abort()
    }
  }, [period])

  // Compute month days (42 cells, Sunday start)
  const days = useMemo(() => {
    const first = new Date(y, m - 1, 1)
    const start = new Date(first)
    start.setDate(first.getDate() - first.getDay())
    const arr: Date[] = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      arr.push(d)
    }
    return arr
  }, [y, m])

  const inMonth = (d: Date) => d.getMonth() === m - 1
  const iso = (d: Date) => d.toISOString().split('T')[0]

  const getSiteLabel4 = (name?: string | null): string => {
    if (!name) return ''
    const s = String(name).trim()
    return s.length <= 4 ? s : s.slice(0, 4)
  }

  // Load daily aggregated labor for current month
  useEffect(() => {
    let alive = true
    const controller = new AbortController()
    async function run() {
      setLoadingDaily(true)
      try {
        const p = new URLSearchParams({ start_date: startDate, end_date: endDate })
        const res = await fetch(`/api/partner/labor/daily?${p.toString()}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        const j = await res.json().catch(() => ({}))
        if (res.ok) {
          if (!alive) return
          setDaily(j?.data?.daily || {})
          setTopSiteByDate(j?.data?.topSites || {})
        } else {
          if (!alive) return
          setDaily({})
          setTopSiteByDate({})
        }
      } catch (e) {
        if (!alive) return
        setDaily({})
        setTopSiteByDate({})
      } finally {
        if (alive) setLoadingDaily(false)
      }
    }
    run()
    return () => {
      alive = false
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [y, m])

  const kpi = summary || {
    totalSites: 0,
    activeSites: 0,
    totalLaborHours: 0,
    averageDailyHours: 0,
    overtimeHours: 0,
    workingDays: 0,
  }

  return (
    <div className="home-container">
      {/* 빠른메뉴 + 공지 (p-main 상단 영역) */}
      <QuickMenu />
      <NoticeSection />

      {/* p-main 스타일: 오늘의 현장 섹션을 흰색 카드로 감싸기 */}
      <section className="mt-3">
        <div className="ph-card p-3">
          <PartnerWeekRibbon
            selectedDate={selectedDate}
            onChange={setSelectedDate}
            expanded={showMonth}
            onToggleViewAll={() => setShowMonth(v => !v)}
          />
          {showMonth && (
            <div id="partner-month-calendar" className="mt-2">
              <div className="ph-card p-2 mb-2">
                <div className="ph-month-head">
                  <button
                    type="button"
                    aria-label="이전달"
                    className="ph-month-nav"
                    onClick={() =>
                      setMonthDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
                    }
                  >
                    <ChevronLeft className="ph-month-ico" />
                  </button>
                  <div className="ph-month-title">
                    {y}년 {m}월
                  </div>
                  <button
                    type="button"
                    aria-label="다음달"
                    className="ph-month-nav"
                    onClick={() =>
                      setMonthDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
                    }
                  >
                    <ChevronRight className="ph-month-ico" />
                  </button>
                </div>
                <div className="ph-month-grid">
                  {['일', '월', '화', '수', '목', '금', '토'].map(dow => (
                    <div key={dow} className={`ph-month-dow ${dow === '일' ? 'sun' : ''}`}>
                      {dow}
                    </div>
                  ))}
                  {days.map((d, idx) => {
                    const key = iso(d)
                    const out = !inMonth(d)
                    const entry = daily[key]
                    const isSun = d.getDay() === 0
                    const isToday = key === new Date().toISOString().split('T')[0]
                    const top = topSiteByDate[key]
                    return (
                      <button
                        key={key + idx}
                        type="button"
                        onClick={() => {
                          if (!inMonth(d)) return
                          const url = new URL(
                            '/mobile/worklog',
                            typeof window !== 'undefined' ? window.location.origin : 'http://x'
                          )
                          url.searchParams.set('period', 'daily')
                          url.searchParams.set('date', key)
                          window.location.href = url.pathname + '?' + url.searchParams.toString()
                        }}
                        className={`ph-month-cell ${out ? 'out' : ''} ${isToday ? 'today' : ''}`}
                      >
                        <div className={`ph-month-date ${isSun ? 'sun' : ''}`}>{d.getDate()}</div>
                        <div className="ph-month-abbr">
                          {top?.site_name ? getSiteLabel4(top.site_name) : ''}
                        </div>
                        <div className="ph-month-man">
                          {loadingDaily ? '' : entry ? `${entry.manDays}일` : ''}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 현장 정보 카드 */}
      <PartnerHomeSiteInfo date={selectedDate} />

      {/* 검색 / 최근 현장 */}
      <PartnerHomeSiteSearch />

      {!!error && <div className="error-box">{error}</div>}

      <style jsx>{`
        .home-container {
          padding: 12px 12px calc(var(--page-bottom-gap, 24px) + env(safe-area-inset-bottom, 0px));
        }
        .home-header {
          margin-bottom: 12px;
        }
        .home-title {
          font-size: 18px;
          font-weight: 600;
        }
        .home-subtitle {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }
        .period-tabs {
          display: flex;
          gap: 8px;
          margin: 8px 0 12px;
        }
        .period-tab {
          font-size: 12px;
          padding: 6px 10px;
          border-radius: 9999px;
          background: #f3f4f6;
          color: #111827;
          border: 1px solid #e5e7eb;
        }
        .period-tab.active {
          background: #111827;
          color: #fff;
          border-color: #111827;
        }
        .kpi-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          margin-bottom: 12px;
        }
        @media (min-width: 420px) {
          .kpi-grid {
            grid-template-columns: 1fr 1fr 1fr 1fr;
          }
        }
        .kpi-title {
          font-size: 12px;
          color: #6b7280;
        }
        .kpi-value {
          font-size: 18px;
          font-weight: 700;
          margin-top: 2px;
        }
        .kpi-sub {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 2px;
        }
        .kpi-links {
          display: grid;
          grid-template-columns: 1fr;
          gap: 6px;
          margin: 8px 0 14px;
        }
        .kpi-link {
          font-size: 12px;
          color: #111827;
          text-decoration: underline;
        }
        /* extra quick links grid removed to match spec */
        .error-box {
          margin-top: 12px;
          color: #b91c1c;
          font-size: 12px;
        }
      `}</style>
    </div>
  )
}

export default PartnerHomePage
