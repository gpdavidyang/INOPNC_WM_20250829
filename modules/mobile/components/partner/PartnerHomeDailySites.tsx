'use client'

import React, { useEffect, useState } from 'react'
import { Card } from '@/modules/shared/ui'

interface DailySiteItem {
  id: string
  name: string
  recentWorkDate?: string
  totalLaborHours?: number
  status?: string
}

interface Props {
  date: string
  hideHeader?: boolean
}

export const PartnerHomeDailySites: React.FC<Props> = ({ date, hideHeader }) => {
  const [items, setItems] = useState<DailySiteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [details, setDetails] = useState<Record<string, any>>({})

  useEffect(() => {
    let alive = true
    const controller = new AbortController()
    async function run() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ start_date: date, end_date: date, period: 'daily' })
        const res = await fetch(`/api/partner/labor/by-site?${params.toString()}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!res.ok) throw new Error('현장 요약을 불러오지 못했습니다')
        const data = await res.json()
        const list = Array.isArray(data?.sites)
          ? data.sites.map((s: any) => ({
              id: s.id,
              name: s.name,
              recentWorkDate: s.recentWorkDate,
              totalLaborHours: s.totalLaborHours,
              status: s.status,
            }))
          : []
        if (alive) setItems(list)
      } catch (e: any) {
        if (e?.name === 'AbortError') return
        if (alive) setError(e?.message || '현장 요약 오류')
      } finally {
        if (alive) setLoading(false)
      }
    }
    run()
    return () => {
      alive = false
      controller.abort()
    }
  }, [date])

  return (
    <section className="mt-2">
      {!hideHeader && (
        <div className="flex items-center justify-between mb-2">
          <h3 className="ph-section-title">오늘의 현장</h3>
          <a className="ph-link" href="/mobile/sites">
            전체보기
          </a>
        </div>
      )}
      {loading && items.length === 0 ? (
        <div className="text-xs text-gray-500">불러오는 중...</div>
      ) : items.length === 0 ? (
        <div className="text-xs text-gray-500">표시할 현장이 없습니다.</div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <Card key={item.id} className="p-3 ph-card">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium truncate">{item.name}</div>
                <div className="ph-meta">{item.recentWorkDate || date}</div>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className={`ph-badge ${item.status || ''}`}>{item.status || 'active'}</span>
                <span className="ph-kv">당일 공수: {Math.round(item.totalLaborHours ?? 0)}</span>
              </div>
              <div className="mt-2 flex gap-3">
                <a
                  className="ph-link"
                  href={`/mobile/worklog?period=daily&site_id=${encodeURIComponent(item.id)}`}
                >
                  작업일지
                </a>
                <a
                  className="ph-link"
                  href={`/mobile/worklog?status=pending&site_id=${encodeURIComponent(item.id)}`}
                >
                  승인 대기
                </a>
              </div>
              <div className="mt-2">
                <button
                  className="ph-link"
                  onClick={async () => {
                    const next = expanded === item.id ? null : item.id
                    setExpanded(next)
                    if (next && !details[item.id]) {
                      try {
                        const res = await fetch(
                          `/api/sites/summary/${encodeURIComponent(item.id)}`,
                          { cache: 'no-store' }
                        )
                        const payload = await res.json().catch(() => ({}))
                        if (res.ok && payload?.data) {
                          setDetails(prev => ({ ...prev, [item.id]: payload.data }))
                        }
                      } catch (e) {
                        /* ignore */
                      }
                    }
                  }}
                >
                  {expanded === item.id ? '간단정보 닫기' : '간단정보 보기'}
                </button>
              </div>

              {expanded === item.id && (
                <div className="mt-2 border-t pt-2">
                  {(() => {
                    const d = details[item.id]
                    const addr = d?.address || '-'
                    const managers = Array.isArray(d?.managers) ? d.managers : []
                    const work = d?.work || null
                    const processes = Array.isArray(work?.work_content?.workProcesses)
                      ? work.work_content.workProcesses.join(', ')
                      : null
                    const memberTypes = Array.isArray(work?.work_content?.memberTypes)
                      ? work.work_content.memberTypes.join(', ')
                      : null
                    const progress = work?.progress_rate
                    const reportDate = work?.date
                    return (
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="ph-kv">주소: {addr || '-'}</div>
                          <div className="flex gap-2">
                            <a
                              className="ph-link"
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr || '')}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              지도 열기
                            </a>
                            <button
                              className="ph-link"
                              onClick={() => {
                                if (addr) navigator.clipboard?.writeText(addr)
                              }}
                            >
                              주소 복사
                            </button>
                          </div>
                        </div>
                        <div>
                          연락처:
                          {managers.length === 0 ? (
                            <span className="ml-1">-</span>
                          ) : (
                            <ul className="list-disc pl-4 mt-1">
                              {managers.map((m: any, idx: number) => (
                                <li key={idx}>
                                  {m.role}: {m.phone || '-'}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div>작업내용: {processes || '-'}</div>
                            <div>부재: {memberTypes || '-'}</div>
                          </div>
                          <div className="ph-progress" aria-label="진척률">
                            <span className="dot" />
                            <span>{progress != null ? `${Math.round(progress)}%` : '-'}</span>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <a
                            className="ph-link"
                            href={`/mobile/documents?site_id=${encodeURIComponent(item.id)}`}
                          >
                            문서함
                          </a>
                          <a
                            className="ph-link"
                            href={`/mobile/worklog?period=daily&site_id=${encodeURIComponent(item.id)}${reportDate ? `&date=${encodeURIComponent(reportDate)}` : ''}`}
                          >
                            해당일 작업일지
                          </a>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      {!!error && <div className="mt-2 text-xs text-red-600">{error}</div>}
    </section>
  )
}

export default PartnerHomeDailySites
