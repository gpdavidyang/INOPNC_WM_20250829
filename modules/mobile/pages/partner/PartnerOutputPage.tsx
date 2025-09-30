'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUnifiedAuth } from '@/hooks/use-unified-auth'
import '@/modules/mobile/styles/attendance.css'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  CustomSelect,
  CustomSelectTrigger,
  CustomSelectValue,
  CustomSelectContent,
  CustomSelectItem,
} from '@/components/ui/custom-select'

type PeriodTab = 'output' | 'payroll'

type PartnerSite = { id: string; name: string; status?: string | null }

export const PartnerOutputPage: React.FC = () => {
  const { profile } = useUnifiedAuth()
  const [tab, setTab] = useState<PeriodTab>('output')
  const [sites, setSites] = useState<PartnerSite[]>([])
  const [selectedSite, setSelectedSite] = useState<string>('all')

  // Calendar month
  const [monthDate, setMonthDate] = useState<Date>(new Date())
  const y = monthDate.getFullYear()
  const m = monthDate.getMonth() + 1
  const firstDay = new Date(y, m - 1, 1)
  const lastDay = new Date(y, m, 0)
  const startDate = firstDay.toISOString().split('T')[0]
  const endDate = lastDay.toISOString().split('T')[0]

  // Daily labor map { yyyy-mm-dd: { manDays, hours } }
  const [daily, setDaily] = useState<Record<string, { manDays: number; hours: number }>>({})
  const [topSiteByDate, setTopSiteByDate] = useState<
    Record<string, { site_id: string; site_name?: string | null }>
  >({})
  const [loadingDaily, setLoadingDaily] = useState(false)
  const [siteBreakdown, setSiteBreakdown] = useState<
    Array<{ id: string; name: string; manDays: number; hours: number }>
  >([])

  // Payroll summary
  const [payroll, setPayroll] = useState<{
    totalWorkers: number
    totalManDays: number
    totalGrossPay?: number
  } | null>(null)
  const [loadingPayroll, setLoadingPayroll] = useState(false)

  // Load partner sites for filter
  useEffect(() => {
    let alive = true
    const controller = new AbortController()
    async function run() {
      try {
        const res = await fetch('/api/partner/labor/by-site?period=monthly', {
          cache: 'no-store',
          signal: controller.signal,
        })
        const payload = await res.json().catch(() => ({}))
        const siteList: PartnerSite[] = Array.isArray(payload?.sites)
          ? payload.sites.map((s: any) => ({ id: s.id, name: s.name, status: s.status }))
          : []
        if (alive) setSites(siteList)
      } catch (e) {
        if ((e as any)?.name === 'AbortError') return
        console.warn('[PartnerOutput] sites load error:', e)
      }
    }
    run()
    return () => {
      alive = false
      controller.abort()
    }
  }, [])

  // Load daily aggregated labor
  const loadDaily = async () => {
    setLoadingDaily(true)
    try {
      const p = new URLSearchParams({ start_date: startDate, end_date: endDate })
      if (selectedSite !== 'all') p.set('site_id', selectedSite)
      const res = await fetch(`/api/partner/labor/daily?${p.toString()}`, { cache: 'no-store' })
      const j = await res.json().catch(() => ({}))
      if (res.ok) {
        setDaily(j?.data?.daily || {})
        setTopSiteByDate(j?.data?.topSites || {})
      } else {
        setDaily({})
        setTopSiteByDate({})
      }
    } catch (e) {
      console.warn('[PartnerOutput] loadDaily error:', e)
      setDaily({})
      setTopSiteByDate({})
    } finally {
      setLoadingDaily(false)
    }
  }

  // Load payroll summary
  const loadPayroll = async () => {
    setLoadingPayroll(true)
    try {
      const p = new URLSearchParams({ year: String(y), month: String(m) })
      if (selectedSite !== 'all') p.set('site_id', selectedSite)
      const res = await fetch(`/api/partner/payroll/summary?${p.toString()}`, { cache: 'no-store' })
      const j = await res.json().catch(() => ({}))
      if (res.ok) setPayroll(j?.data || null)
      else setPayroll(null)
    } catch (e) {
      console.warn('[PartnerOutput] loadPayroll error:', e)
      setPayroll(null)
    } finally {
      setLoadingPayroll(false)
    }
  }

  useEffect(() => {
    loadDaily()
    loadPayroll()
    loadSiteBreakdown()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSite, y, m])

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

  // Site abbreviation (2 chars) similar to site manager calendar
  const getSiteAbbr2 = (name?: string | null): string => {
    if (!name) return ''
    let s = String(name)
      .replace(/\s*[A-Z]?현장\s*$/g, '')
      .trim()
    // If name contains a space, prefer first token
    if (s.includes(' ')) s = s.split(/\s+/)[0]
    if (s.length >= 2) return s.slice(0, 2)
    return s
  }

  // Removed weekly totals as per request

  // Load site-level breakdown for current month
  const loadSiteBreakdown = async () => {
    try {
      const p = new URLSearchParams({ period: 'monthly', start_date: startDate, end_date: endDate })
      const res = await fetch(`/api/partner/labor/by-site?${p.toString()}`, { cache: 'no-store' })
      const j = await res.json().catch(() => ({}))
      const arr = Array.isArray(j?.sites) ? j.sites : []
      let list = arr.map((s: any) => ({
        id: s.id,
        name: s.name,
        manDays: Number(s.totalLaborHours || 0),
        hours: Number(s.totalLaborHours || 0) * 8,
      }))
      if (selectedSite !== 'all') {
        list = list.filter(x => x.id === selectedSite)
      }
      list.sort((a: any, b: any) => b.manDays - a.manDays)
      setSiteBreakdown(list)
    } catch (e) {
      console.warn('[PartnerOutput] loadSiteBreakdown error:', e)
      setSiteBreakdown([])
    }
  }

  const router = useRouter()

  // Month select state
  const monthKey = `${y}-${String(m).padStart(2, '0')}`
  const monthOptions = useMemo(() => {
    const list: { value: string; label: string }[] = []
    const base = new Date()
    for (let i = 0; i < 24; i++) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      list.push({ value: key, label: key })
    }
    return list
  }, [])

  return (
    <div className="p-3 pb-24">
      {/* Tabs (match manager: line-tabs) */}
      <nav className="line-tabs" role="tablist" aria-label="출력정보 탭">
        {(
          [
            { id: 'output', label: '출력현황' },
            { id: 'payroll', label: '급여현황' },
          ] as { id: PeriodTab; label: string }[]
        ).map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`line-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Filters: 1행 2열, 독립 CustomSelect (둥근 사각형) */}
      <div className="ph-select-grid mb-3">
        <div>
          <CustomSelect value={selectedSite} onValueChange={setSelectedSite}>
            <CustomSelectTrigger
              style={{ borderRadius: 14 }}
              className="no-arrow w-full h-10 text-[16px] font-semibold rounded-[14px] border border-[#E5EAF3] bg-white dark:bg-white justify-center"
            >
              <CustomSelectValue placeholder="현장 선택" />
            </CustomSelectTrigger>
            <CustomSelectContent className="max-h-64 overflow-auto">
              <CustomSelectItem value="all">전체 현장</CustomSelectItem>
              {sites.map(s => (
                <CustomSelectItem key={s.id} value={s.id}>
                  {s.name}
                </CustomSelectItem>
              ))}
            </CustomSelectContent>
          </CustomSelect>
        </div>
        <div>
          <CustomSelect
            value={monthKey}
            onValueChange={val => {
              const [yy, mm] = val.split('-').map(v => parseInt(v, 10))
              if (!Number.isNaN(yy) && !Number.isNaN(mm)) {
                setMonthDate(new Date(yy, mm - 1, 1))
              }
            }}
          >
            <CustomSelectTrigger
              style={{ borderRadius: 14 }}
              className="no-arrow w-full h-10 text-[16px] font-semibold rounded-[14px] border border-[#E5EAF3] bg-white dark:bg-white justify-center"
            >
              <CustomSelectValue placeholder="YYYY-MM" />
            </CustomSelectTrigger>
            <CustomSelectContent className="max-h-64 overflow-auto">
              {monthOptions.map(opt => (
                <CustomSelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </CustomSelectItem>
              ))}
            </CustomSelectContent>
          </CustomSelect>
        </div>
      </div>

      {tab === 'output' ? (
        <>
          <div className="ph-card p-2 mb-2">
            <div className="ph-month-head">
              <button
                type="button"
                aria-label="이전달"
                className="ph-month-nav"
                onClick={() => setMonthDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
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
                onClick={() => setMonthDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              >
                <ChevronRight className="ph-month-ico" />
              </button>
            </div>
            <div className="ph-month-grid">
              {['일', '월', '화', '수', '목', '금', '토'].map(dow => (
                <div key={dow} className="ph-month-dow">
                  {dow}
                </div>
              ))}
              {days.map((d, idx) => {
                const key = iso(d)
                const out = !inMonth(d)
                const entry = daily[key]
                const isSun = d.getDay() === 0
                const isSat = d.getDay() === 6
                const isToday = key === new Date().toISOString().split('T')[0]
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
                      if (selectedSite !== 'all') url.searchParams.set('site_id', selectedSite)
                      router.push(url.pathname + '?' + url.searchParams.toString())
                    }}
                    className={`ph-month-cell ${out ? 'out' : ''} ${isToday ? 'today' : ''}`}
                  >
                    <div className={`ph-month-date ${isSun ? 'sun' : isSat ? 'sat' : ''}`}>
                      {d.getDate()}
                    </div>
                    {/* Site abbreviation first, then man-days (no '공수' label) */}
                    <div className="ph-month-abbr">
                      {(() => {
                        const top = topSiteByDate[key]
                        return top?.site_name ? getSiteAbbr2(top.site_name) : ''
                      })()}
                    </div>
                    <div className="ph-month-man">
                      {loadingDaily ? '' : entry ? `${entry.manDays}` : ''}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
          {/* Site breakdown (separate card for consistency) */}
          <div className="ph-card p-2 mb-2">
            <h3 className="ph-section-title">현장별 합계</h3>
            {siteBreakdown.length === 0 ? (
              <div className="ph-meta">표시할 데이터가 없습니다.</div>
            ) : (
              <div className="ph-table mt-2">
                <div className="ph-table-row ph-table-head">
                  <div>현장</div>
                  <div className="text-right">공수</div>
                  <div className="text-right">시간</div>
                </div>
                {siteBreakdown.map(s => (
                  <div key={s.id} className="ph-table-row">
                    <div className="truncate">{s.name}</div>
                    <div className="text-right">{s.manDays.toFixed(1)}</div>
                    <div className="text-right">{s.hours.toFixed(1)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="ph-card p-3 mb-2 text-sm">
          {loadingPayroll ? (
            <div className="text-gray-500">불러오는 중...</div>
          ) : payroll ? (
            <div className="ph-kpi-list">
              <div className="ph-kpi-line">
                <div className="label">투입 인원</div>
                <div className="value">{payroll.totalWorkers}명</div>
              </div>
              <div className="ph-kpi-line">
                <div className="label">총 공수</div>
                <div className="value">{payroll.totalManDays}</div>
              </div>
              {typeof payroll.totalGrossPay === 'number' && (
                <div className="ph-kpi-line">
                  <div className="label">총 금액(세전)</div>
                  <div className="value">{payroll.totalGrossPay.toLocaleString()}원</div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500">표시할 데이터가 없습니다.</div>
          )}
        </div>
      )}
    </div>
  )
}

export default PartnerOutputPage
