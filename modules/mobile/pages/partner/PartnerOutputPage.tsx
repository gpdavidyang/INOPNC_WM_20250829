'use client'

import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
// import { useUnifiedAuth } from '@/hooks/use-unified-auth'
import '@/modules/mobile/styles/attendance.css'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
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
  const [siteSearchTerm, setSiteSearchTerm] = useState('')

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
  // Build simple aggregate from daily/topSiteByDate when API aggregates are unavailable
  const aggregateFromDaily = useCallback(
    (
      dailyMap: typeof daily,
      topSiteMap: typeof topSiteByDate
    ): { id: string; name: string; manDays: number; workers: number }[] => {
      const agg = new Map<string, { id: string; name: string; manDays: number; workers: number }>()
      Object.entries(dailyMap || {}).forEach(([dateKey, value]) => {
        const siteId = topSiteMap?.[dateKey]?.site_id || 'unknown'
        const siteName = topSiteMap?.[dateKey]?.site_name || '현장'
        if (selectedSite !== 'all' && siteId !== selectedSite) return
        const workers = Number(value?.workers || 0)
        const manDays = Number(value?.manDays || workers || 0)
        if (workers <= 0 && manDays <= 0) return
        const entry = agg.get(siteId) || { id: siteId, name: siteName, manDays: 0, workers: 0 }
        entry.workers += workers
        entry.manDays += manDays
        agg.set(siteId, entry)
      })
      return Array.from(agg.values()).sort((a, b) => b.manDays - a.manDays)
    },
    [selectedSite]
  )
  // Derived breakdown from detail rows (fallback when API aggregates are empty)
  const aggregateFromDetails = useCallback(
    (rows: typeof detailRows) => {
      const agg = new Map<string, { id: string; name: string; manDays: number; workers: number }>()
      rows.forEach(row => {
        row.sites.forEach(site => {
          if (selectedSite !== 'all' && site.site_id !== selectedSite) return
          const id = site.site_id || 'unknown'
          const name = site.site_name || '현장'
          const entry = agg.get(id) || { id, name, manDays: 0, workers: 0 }
          const workers = Number(site.combined_count || 0)
          const manDaysFromAssignments = Number(site.combined_manDays || 0)
          const manDays = manDaysFromAssignments > 0 ? manDaysFromAssignments : workers
          entry.manDays += manDays
          entry.workers += workers
          agg.set(id, entry)
        })
      })
      return Array.from(agg.values()).sort((a, b) => b.manDays - a.manDays)
    },
    [selectedSite]
  )

  useEffect(() => {
    if (!detailRows.length) return
    setSiteBreakdown(aggregateFromDetails(detailRows))
  }, [detailRows, aggregateFromDetails])

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
        const rawDaily = j?.data?.daily || {}
        const rawTop = j?.data?.topSites || {}
        const allowedIds = new Set(sites.map(s => s.id))
        const dailyMap: typeof rawDaily = {}
        const topMap: typeof rawTop = {}
        Object.entries(rawDaily).forEach(([dateKey, value]) => {
          const siteId = rawTop?.[dateKey]?.site_id || 'unknown'
          // If we already know allowed site ids, drop anything outside
          if (allowedIds.size > 0 && !allowedIds.has(siteId)) return
          dailyMap[dateKey] = value
          topMap[dateKey] = rawTop?.[dateKey]
        })
        setDaily(dailyMap)
        setTopSiteByDate(topMap)
        const seeded = aggregateFromDaily(dailyMap, topMap)
        setSiteBreakdown(seeded)
        const nextDetails = Object.entries(dailyMap || {})
          .map(([dateKey, value]) => {
            const siteId = topMap?.[dateKey]?.site_id || 'unknown'
            const siteName = topMap?.[dateKey]?.site_name || '현장'
            const workers = Number(value?.workers || 0)
            const manDays = Number(value?.manDays || workers || 0)
            return {
              date: dateKey,
              sites: [
                {
                  site_id: siteId,
                  site_name: siteName,
                  combined_count: workers,
                  combined_manDays: manDays,
                },
              ],
            }
          })
          .filter(item => item.sites.some(s => s.combined_count > 0 || s.combined_manDays > 0))
        setDetailRows(nextDetails)
      } else {
        setDaily({})
        setTopSiteByDate({})
        setSiteBreakdown([])
        setDetailRows([])
      }
    } catch (e) {
      console.warn('[PartnerOutput] loadDaily error:', e)
      setDaily({})
      setTopSiteByDate({})
      setSiteBreakdown([])
      setDetailRows([])
    } finally {
      setLoadingDaily(false)
    }
  }

  // Removed payroll summary loader per requirement

  useEffect(() => {
    setDetailLoading(true)
    void loadDaily().finally(() => setDetailLoading(false))
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

  const router = useRouter()
  const filteredSites = useMemo(() => {
    if (!siteSearchTerm.trim()) return sites
    const keyword = siteSearchTerm.trim().toLowerCase()
    const matches = sites.filter(s => (s.name || '').toLowerCase().includes(keyword))
    // Ensure currently 선택한 현장은 항상 옵션에 남겨둠
    if (selectedSite !== 'all' && !matches.some(s => s.id === selectedSite)) {
      const current = sites.find(s => s.id === selectedSite)
      if (current) matches.unshift(current)
    }
    return matches
  }, [siteSearchTerm, sites, selectedSite])

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
    <div className="partner-output-wrapper">
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
              {filteredSites.map(s => (
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

      {/* 현장 키워드 검색 */}
      <div className="mb-3">
        <div
          className="ph-search-row search-quiet"
          style={{
            background: '#ffffff',
            boxShadow: 'none',
            border: '1px solid #e4e8f4',
            width: '100%',
          }}
        >
          <Search className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            value={siteSearchTerm}
            onChange={e => setSiteSearchTerm(e.target.value)}
            placeholder="현장명 검색"
            className="ph-search-input"
            aria-label="현장 키워드 검색"
            style={{ outline: 'none', boxShadow: 'none', background: 'transparent' }}
          />
          {siteSearchTerm ? (
            <button
              type="button"
              className="ph-search-clear"
              onClick={() => setSiteSearchTerm('')}
              aria-label="검색어 지우기"
            >
              <span
                style={{
                  position: 'absolute',
                  width: 1,
                  height: 1,
                  padding: 0,
                  margin: -1,
                  overflow: 'hidden',
                  clip: 'rect(0,0,0,0)',
                  border: 0,
                }}
              >
                지우기
              </span>
            </button>
          ) : null}
        </div>
        {siteSearchTerm && (
          <div className="ph-search-suggestions" role="list">
            {filteredSites.length === 0 ? (
              <div className="ph-search-empty" role="listitem">
                검색 결과가 없습니다.
              </div>
            ) : (
              filteredSites.slice(0, 5).map(site => (
                <button
                  key={site.id}
                  type="button"
                  className="ph-search-suggestion"
                  role="listitem"
                  onClick={() => {
                    setSelectedSite(site.id)
                    setSiteSearchTerm(site.name)
                  }}
                >
                  {site.name}
                </button>
              ))
            )}
          </div>
        )}
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
        <div className="ph-card p-3 mb-3 ph-section-card">
          <h3 className="ph-section-title ph-section-title-tight">현장별 합계</h3>
          {siteBreakdown.length === 0 ? (
            <div className="ph-meta ph-empty-row">표시할 데이터가 없습니다.</div>
          ) : (
            <div className="ph-table mt-2 ph-table-compact">
              <div className="ph-table-row ph-table-head ph-detail-head">
                <div>현장</div>
                <div className="text-right">공수</div>
                <div className="text-right">인원</div>
              </div>
              {siteBreakdown.map(s => (
                <div key={s.id} className="ph-table-row ph-detail-row">
                  <div className="truncate">{s.name}</div>
                  <div className="text-right">{s.manDays.toFixed(1)}</div>
                  <div className="text-right">{s.workers}명</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detailed audit breakdown (collapsible) */}
        <div className="ph-card p-3 mb-3 ph-section-card">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="ph-section-title ph-section-title-tight" style={{ margin: 0 }}>
              현장별 합계 세부내역
            </h3>
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
                <div className="ph-meta ph-empty-row">불러오는 중...</div>
              ) : detailRows.length === 0 ? (
                <div className="ph-meta ph-empty-row">표시할 데이터가 없습니다.</div>
              ) : (
                <div className="space-y-2 mt-2">
                  {detailRows.map(row => (
                    <div key={row.date} className="ph-detail-card ph-detail-card-plain">
                      <div className="ph-detail-date">{row.date}</div>
                      <div className="ph-table ph-table-compact">
                        <div className="ph-table-row ph-table-head ph-detail-head">
                          <div>현장</div>
                          <div className="text-right">공수</div>
                          <div className="text-right">인원</div>
                        </div>
                        {row.sites.map(site => (
                          <div
                            key={row.date + '-' + site.site_id}
                            className="ph-table-row ph-detail-row"
                          >
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
      <style jsx>{`
        .partner-output-wrapper {
          padding: 14px;
          padding-bottom: calc(var(--page-bottom-gap, 24px) + env(safe-area-inset-bottom, 0px));
        }
        .ph-section-card {
          border-radius: 10px;
        }
        .ph-section-title-tight {
          font-size: 16px;
          font-weight: 700;
          color: #1a254f;
        }
        .ph-table-compact .ph-table-row {
          padding: 10px 12px;
          font-size: 14px;
        }
        .ph-empty-row {
          padding: 8px 4px;
        }
        .ph-detail-card {
          border: 1px solid var(--ph-line);
          border-radius: 8px;
          padding: 12px;
          background: var(--ph-surface);
        }
        .ph-detail-card-plain {
          border: none;
          padding: 0;
          background: transparent;
        }
        .ph-detail-date {
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 8px;
        }
        .ph-detail-head {
          font-size: 13px;
        }
        .ph-detail-row {
          font-size: 13px;
        }
        .ph-search-row {
          display: flex;
          align-items: center;
          gap: 4px;
          border: 1px solid #d6deef;
          border-radius: 12px;
          padding: 1px 4px;
          background: #ffffff;
          box-shadow: none;
          min-height: 26px;
          outline: none;
        }
        .ph-search-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
          color: #0f172a;
          background: transparent;
          padding-left: 2px;
        }
        .ph-search-input::placeholder {
          color: #94a3b8;
        }
        .ph-search-clear {
          border: none;
          background: transparent;
          font-size: 12px;
          color: #475569;
          cursor: pointer;
          line-height: 1;
          padding: 2px 4px;
        }
        .ph-search-suggestions {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 10px;
        }
        .ph-search-suggestion {
          text-align: left;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          background: #f8fafc;
          font-size: 14px;
          color: #0f172a;
          min-height: 20px;
          display: flex;
          align-items: center;
        }
        .ph-search-suggestion:hover {
          border-color: #1a254f;
        }
        .ph-search-empty {
          padding: 10px 12px;
          font-size: 13px;
          color: #6b7280;
          background: #f8fafc;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
        }
        :global([data-theme='dark'] .ph-search-row) {
          border-color: #3a4048;
          background: rgba(15, 23, 42, 0.9);
        }
        :global(.ph-search-row),
        :global(.ph-search-input) {
          -webkit-appearance: none;
        }
        :global(.ph-search-row:focus),
        :global(.ph-search-row:focus-within) {
          outline: none;
          box-shadow: none;
          border-color: #d6deef !important;
        }
        :global(.ph-search-input:focus),
        :global(.ph-search-input:focus-visible) {
          outline: none !important;
          box-shadow: none !important;
        }
        :global([data-theme='dark'] .ph-search-input) {
          color: #e9eef5;
        }
        :global([data-theme='dark'] .ph-search-input::placeholder) {
          color: #94a3b8;
        }
        :global([data-theme='dark'] .ph-search-clear) {
          color: #cbd5e1;
        }
        :global([data-theme='dark'] .ph-search-suggestion) {
          border-color: #3a4048;
          background: rgba(15, 23, 42, 0.85);
          color: #e9eef5;
        }
        :global([data-theme='dark'] .ph-search-suggestion:hover) {
          border-color: #63b3ed;
        }
        :global([data-theme='dark'] .ph-search-empty) {
          border-color: #3a4048;
          background: rgba(15, 23, 42, 0.85);
          color: #cbd5e1;
        }
      `}</style>
    </div>
  )
}

export default PartnerOutputPage
