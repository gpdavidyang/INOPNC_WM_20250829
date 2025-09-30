'use client'

import React, { useEffect, useState } from 'react'
import { Card } from '@/modules/shared/ui'

interface PartnerSiteItem {
  id: string
  name: string
  status?: string
  recentWorkDate?: string
  workingDays?: number
  totalLaborHours?: number
  averageDailyHours?: number
}

export const PartnerSitesPage: React.FC = () => {
  const [sites, setSites] = useState<PartnerSiteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true
    const controller = new AbortController()
    async function fetchSites() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/partner/labor/by-site?period=monthly', {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!res.ok) throw new Error('현장 목록을 불러오지 못했습니다')
        const data = await res.json()
        const list: PartnerSiteItem[] = Array.isArray(data?.sites)
          ? data.sites.map((s: any) => ({
              id: s.id,
              name: s.name,
              status: s.status,
              recentWorkDate: s.recentWorkDate,
              workingDays: s.workingDays,
              totalLaborHours: s.totalLaborHours,
              averageDailyHours: s.averageDailyHours,
            }))
          : []
        if (isActive) setSites(list)
      } catch (e: any) {
        if (e?.name === 'AbortError') return
        console.error('[PartnerSites] load error:', e)
        if (isActive) setError(e?.message || '현장 목록 오류')
      } finally {
        if (isActive) setLoading(false)
      }
    }
    fetchSites()
    return () => {
      isActive = false
      controller.abort()
    }
  }, [])

  return (
    <div className="p-3 pb-24">
      <div className="mb-2">
        <h2 className="text-lg font-semibold">현장정보</h2>
        <p className="text-xs text-gray-500">담당 현장 목록</p>
      </div>

      <div className="space-y-2" aria-busy={loading} aria-live="polite">
        {loading && sites.length === 0 ? (
          <div className="text-sm text-gray-500">불러오는 중...</div>
        ) : sites.length === 0 ? (
          <div className="text-sm text-gray-500">표시할 현장이 없습니다.</div>
        ) : (
          sites.map(item => (
            <Card key={item.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{item.name}</div>
                <div className="text-xs text-gray-500">{item.status || 'active'}</div>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                최근 작업일: {item.recentWorkDate || '-'} / 작업일수: {item.workingDays ?? 0}일
              </div>
              <div className="flex gap-2 mt-2">
                <span className="text-[11px] bg-gray-100 rounded px-2 py-1">
                  총 공수 {Math.round(item.totalLaborHours ?? 0)}
                </span>
                <span className="text-[11px] bg-gray-100 rounded px-2 py-1">
                  일평균 {(item.averageDailyHours ?? 0).toFixed(1)}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 mt-3">
                <a
                  href={`/mobile/worklog?site_id=${encodeURIComponent(item.id)}`}
                  className="text-xs underline"
                >
                  작업일지 보기
                </a>
                <a
                  href={`/mobile/worklog?status=pending&site_id=${encodeURIComponent(item.id)}`}
                  className="text-xs underline"
                >
                  승인 대기 보기
                </a>
                <a
                  href={`/mobile/documents?site_id=${encodeURIComponent(item.id)}`}
                  className="text-xs underline"
                >
                  문서함
                </a>
              </div>
            </Card>
          ))
        )}
      </div>

      {!!error && <div className="mt-2 text-xs text-red-600">{error}</div>}
    </div>
  )
}

export default PartnerSitesPage
