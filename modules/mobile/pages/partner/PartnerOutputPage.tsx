'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
// import { useUnifiedAuth } from '@/hooks/use-unified-auth'
import '@/modules/mobile/styles/attendance.css'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  CustomSelect,
  PhSelectTrigger,
  CustomSelectValue,
  CustomSelectContent,
  CustomSelectItem,
} from '@/components/ui/custom-select'

type PartnerSite = { id: string; name: string; status?: string | null }

export const PartnerOutputPage: React.FC = () => {
  // Auth hook not needed for this view (salary removed)
  const [sites, setSites] = useState<PartnerSite[]>([])
  const [selectedSite, setSelectedSite] = useState<string>('all')

  // Calendar month
  const [monthDate, setMonthDate] = useState<Date>(new Date())
  const y = monthDate.getFullYear()
  const m = monthDate.getMonth() + 1
  const firstDay = new Date(y, m - 1, 1)
  const lastDay = new Date(y, m, 0)
  const fmt = (d: Date) => {
    const yy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yy}-${mm}-${dd}`
  }
  const startDate = fmt(firstDay)
  const endDate = fmt(lastDay)

  // Daily labor map { yyyy-mm-dd: { manDays, hours, workers } }
  const [daily, setDaily] = useState<
    Record<string, { manDays: number; hours: number; workers?: number }>
  >({})
  const [topSiteByDate, setTopSiteByDate] = useState<
    Record<string, { site_id: string; site_name?: string | null }>
  >({})
  const [loadingDaily, setLoadingDaily] = useState(false)
  const [siteBreakdown, setSiteBreakdown] = useState<
    Array<{ id: string; name: string; manDays: number; workers: number }>
  >([])

  // Detailed per-date breakdown (for audit section)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRows, setDetailRows] = useState<
    Array<{
      date: string
      sites: Array<{
        site_id: string
        site_name: string
        combined_count: number
        combined_manDays: number
      }>
    }>
  >([])

  // Removed payroll summary state per requirement (hide salary info)

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

  // Removed payroll summary loader per requirement

  useEffect(() => {
    loadDaily()
    loadSiteBreakdown()
    ;(async () => {
      setDetailLoading(true)
      try {
        const p = new URLSearchParams({ year: String(y), month: String(m) })
        if (selectedSite !== 'all') p.set('site_id', selectedSite)
        const res = await fetch(`/api/partner/labor/debug-breakdown?${p.toString()}`, {
          cache: 'no-store',
        })
        const j = await res.json().catch(() => ({}))
        const perDate = Array.isArray(j?.perDate) ? j.perDate : []
        const mapped = perDate.map((row: any) => ({
          date: row?.date,
          sites: Array.isArray(row?.sites)
            ? row.sites.map((s: any) => ({
                site_id: s?.site_id,
                site_name: s?.site_name,
                combined_count: Number(s?.combined_count || 0),
                combined_manDays: Number(s?.combined_manDays || 0),
              }))
            : [],
        }))
        setDetailRows(mapped)
      } catch (e) {
        setDetailRows([])
      } finally {
        setDetailLoading(false)
      }
    })()
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
  const iso = (d: Date) => fmt(d)

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
      let list = arr
        .map((s: any) => ({
          id: s.id,
          name: s.name,
          manDays: Number(s.totalManDays ?? s.totalLaborHours ?? 0),
          workers: Number(s.workerDays || s.totalWorkers || 0),
        }))
        .filter(x => x.manDays > 0 || x.workers > 0)
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
      {/* Tabs removed: only output view remains (hide tab title) */}

      {/* Filters: 1행 2열, 독립 CustomSelect (둥근 사각형) */}
      <div className="ph-select-grid mb-3">
        <div>
          <CustomSelect value={selectedSite} onValueChange={setSelectedSite}>
            <PhSelectTrigger>
              <CustomSelectValue className="text-left" placeholder="전체 현장" />
            </PhSelectTrigger>
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
            <PhSelectTrigger>
              <CustomSelectValue className="text-left" placeholder="년월" />
            </PhSelectTrigger>
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

      {/* Output view (only tab) */}
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
                  {/* Hide site abbreviation when viewing all sites to avoid confusion */}
                  {selectedSite !== 'all' && (
                    <div className="ph-month-abbr">
                      {(() => {
                        const top = topSiteByDate[key]
                        return top?.site_name ? getSiteAbbr2(top.site_name) : ''
                      })()}
                    </div>
                  )}
                  <div className="ph-month-man">
                    {loadingDaily ? '' : entry && entry.workers != null ? `${entry.workers}명` : ''}
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
                <div className="text-right">인원</div>
              </div>
              {siteBreakdown.map(s => (
                <div key={s.id} className="ph-table-row">
                  <div className="truncate">{s.name}</div>
                  <div className="text-right">{s.manDays.toFixed(1)}</div>
                  <div className="text-right">{s.workers}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detailed audit breakdown (collapsible) */}
        <div className="ph-card p-2 mb-2">
          <div className="flex items-center justify-between">
            <h3 className="ph-section-title">현장별 합계 세부내역</h3>
            <button
              type="button"
              aria-expanded={detailOpen}
              onClick={() => setDetailOpen(v => !v)}
              className="view-all-link"
            >
              {detailOpen ? '간단히' : '전체보기'}
            </button>
          </div>
          {detailOpen && (
            <>
              {detailLoading ? (
                <div className="ph-meta">불러오는 중...</div>
              ) : detailRows.length === 0 ? (
                <div className="ph-meta">표시할 데이터가 없습니다.</div>
              ) : (
                <div className="space-y-2 mt-2">
                  {detailRows.map(row => (
                    <div key={row.date}>
                      <div className="text-[11px] text-gray-500 mb-1">{row.date}</div>
                      <div className="ph-table">
                        <div className="ph-table-row ph-table-head">
                          <div>현장</div>
                          <div className="text-right">공수</div>
                          <div className="text-right">인원</div>
                        </div>
                        {row.sites.map(site => (
                          <div key={row.date + '-' + site.site_id} className="ph-table-row">
                            <div className="truncate">{site.site_name}</div>
                            <div className="text-right">{site.combined_manDays.toFixed(2)}</div>
                            <div className="text-right">{site.combined_count}명</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </>
    </div>
  )
}

export default PartnerOutputPage
