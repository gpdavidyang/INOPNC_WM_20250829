'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import SiteInfoBottomSheet from '@/modules/mobile/components/site/SiteInfoBottomSheet'
import {
  fetchPartnerSiteDetail,
  type PartnerSiteDetailResult,
} from '@/modules/mobile/utils/site-bottomsheet'

interface RecentSiteItem {
  id: string
  name: string
  status?: string
  recentWorkDate?: string
}

export const PartnerHomeSiteSearch: React.FC = () => {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<RecentSiteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCount, setShowCount] = useState(3)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [currentSite, setCurrentSite] = useState<PartnerSiteDetailResult['site'] | null>(null)
  const [sheetWorkerCount, setSheetWorkerCount] = useState<number>(0)
  const [sheetDateLabel, setSheetDateLabel] = useState('')
  const { toast } = useToast()

  const formatDateWithWeekday = useCallback((value?: string | null) => {
    if (!value) return ''
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'] as const
    const w = weekdays[d.getDay()]
    return `${y}.${m}.${day}(${w})`
  }, [])

  useEffect(() => {
    let alive = true
    const controller = new AbortController()
    async function run() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/partner/labor/by-site?period=monthly', {
          cache: 'no-store',
          signal: controller.signal,
        })
        const payload = await res.json().catch(() => ({}))

        if (!res.ok) {
          const msg =
            (payload?.error as string) ||
            '현장을 불러올 수 없습니다. 파트너사 연결 상태를 확인해 주세요.'
          if (alive) {
            setError(msg)
            setItems([])
          }
          return
        }

        const list = Array.isArray(payload?.sites)
          ? payload.sites.map((s: any) => ({
              id: s.id,
              name: s.name,
              status: s.status || s.contractStatus || '',
              recentWorkDate: s.recentWorkDate,
            }))
          : []
        // 정렬: 최근 날짜 우선
        list.sort((a, b) =>
          String(b.recentWorkDate || '').localeCompare(String(a.recentWorkDate || ''))
        )
        if (alive) setItems(list)
      } finally {
        if (alive) setLoading(false)
      }
    }
    run()
    return () => {
      alive = false
      controller.abort()
    }
  }, [])

  const filtered = useMemo(() => {
    if (!query.trim()) return items
    const q = query.trim().toLowerCase()
    return items.filter(i => i.name?.toLowerCase().includes(q))
  }, [items, query])

  useEffect(() => {
    setShowCount(prev => Math.min(Math.max(prev, 3), Math.max(filtered.length, 3)))
  }, [filtered.length])

  const visible = filtered.slice(0, Math.max(showCount, 3))

  const statusBadge = (raw?: string | null) => {
    const s = (raw || '').toLowerCase()
    if (['planning', 'pending', 'preparing', 'ready'].includes(s))
      return { label: '준비중', bg: '#f1f5f9', color: '#475569' }
    if (['completed', 'done', 'closed', 'finished'].includes(s))
      return { label: '완료', bg: '#ecfdf3', color: '#15803d' }
    if (['inactive', 'terminated', 'cancelled', 'stopped', 'halted'].includes(s))
      return { label: '중단', bg: '#fef2f2', color: '#b91c1c' }
    return { label: '진행중', bg: '#eef2ff', color: '#4338ca' }
  }

  const handleSiteSheetOpen = useCallback(
    async (siteId: string) => {
      try {
        const detail = await fetchPartnerSiteDetail(siteId)
        setCurrentSite(detail.site)
        setSheetWorkerCount(detail.workerCount)
        setSheetDateLabel(formatDateWithWeekday(detail.dateLabel) || detail.dateLabel)
        setSheetOpen(true)
      } catch (error) {
        console.error('[PartnerHomeSiteSearch] site detail load failed', error)
        toast({ title: '현장 정보를 불러오지 못했습니다.', variant: 'destructive' })
      }
    },
    [formatDateWithWeekday, toast]
  )

  const statusLabel = (raw?: string | null) => {
    const s = (raw || '').toLowerCase()
    if (s === 'active') return '활성'
    if (s === 'completed') return '종료'
    if (s === 'inactive') return '비활성'
    return '진행중'
  }

  return (
    <section className="mt-3">
      {/* 검색 + 리스트를 하나의 섹션(카드)로 통합 */}
      <div className="ph-card p-2">
        <div className="ph-search-wrap">
          {/* 돋보기 아이콘 */}
          <svg
            className="ph-search-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="ph-search-input"
            placeholder="현장명 검색"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ outline: 'none', boxShadow: 'none' }}
          />
        </div>

        {/* 최근 현장 3건 (동일 섹션에 표기) */}
        {loading && <div className="text-xs text-gray-500 p-2">불러오는 중...</div>}
        {!loading && error && <div className="text-xs text-red-500 p-2">{error}</div>}
        {!loading && !error && visible.length === 0 && (
          <div className="text-xs text-gray-500 p-2">표시할 현장이 없습니다.</div>
        )}
        {!loading && visible.length > 0 && (
          <ul className="ph-recent-list mt-2">
            {visible.map(item => (
              <li key={item.id} className="ph-recent-item">
                <a
                  className="ph-recent-link"
                  href="#"
                  onClick={async e => {
                    e.preventDefault()
                    await handleSiteSheetOpen(item.id)
                  }}
                >
                  <span
                    className="ph-recent-name"
                    style={{ display: 'flex', gap: 8, alignItems: 'center' }}
                  >
                    <span style={{ flex: 1 }}>{item.name}</span>
                    {(() => {
                      const { label, bg, color } = statusBadge(item.status)
                      return (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 8px',
                            borderRadius: 9999,
                            background: bg,
                            color,
                            fontSize: 11,
                            fontWeight: 700,
                            marginLeft: 'auto',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {label}
                        </span>
                      )
                    })()}
                  </span>
                  <span className="ph-recent-date">
                    {formatDateWithWeekday(item.recentWorkDate)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-center mt-1">
          {visible.length < filtered.length ? (
            <button
              type="button"
              className="ph-more-btn"
              onClick={() => setShowCount(Math.min(filtered.length, showCount + 5))}
            >
              더보기
            </button>
          ) : (
            <span className="ph-more-btn ph-more-disabled">전체</span>
          )}
        </div>
      </div>

      <SiteInfoBottomSheet
        open={sheetOpen && !!currentSite}
        site={currentSite}
        dateLabel={sheetDateLabel || new Date().toISOString().split('T')[0]}
        workerCount={sheetWorkerCount}
        onClose={() => setSheetOpen(false)}
      />
    </section>
  )
}

export default PartnerHomeSiteSearch
