'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MobileLayout as MobileLayoutShell } from '@/modules/mobile/components/layout/MobileLayout'

interface Announcement {
  id: string
  title: string
  content: string
  priority?: string | null
  created_at?: string
}

export default function MobileAnnouncementsListPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [error, setError] = useState<string | null>(null)
  const DEFAULT_VISIBLE_COUNT = 5
  const [visibleCount, setVisibleCount] = useState(DEFAULT_VISIBLE_COUNT)
  const [isExpanded, setIsExpanded] = useState(false)
  const sortedAnnouncements = useMemo(() => {
    return [...announcements].sort((a, b) => {
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0
      return bDate - aDate
    })
  }, [announcements])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/announcements', { cache: 'no-store' })
        if (!res.ok) throw new Error('공지사항 목록 조회 실패')
        const json = await res.json()
        const list = Array.isArray(json?.announcements) ? json.announcements : []
        if (mounted) setAnnouncements(list)
      } catch (e) {
        if (mounted) setError('공지사항을 불러오지 못했습니다.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    setVisibleCount(DEFAULT_VISIBLE_COUNT)
    setIsExpanded(false)
  }, [announcements])

  const formattedDate = (dt?: string) => {
    if (!dt) return ''
    try {
      return new Date(dt).toLocaleString('ko-KR')
    } catch {
      return ''
    }
  }

  return (
    <MobileLayoutShell>
      <div className="px-4 pb-6 space-y-4">
        <header className="pt-6 flex items-center justify-between">
          <h1 className="t-h2">공지사항</h1>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              fontFamily: 'Noto Sans KR, sans-serif',
              fontWeight: 600,
              fontSize: '16px',
              color: '#31A3FA',
              textAlign: 'right',
            }}
          >
            뒤로
          </button>
        </header>

        {loading && <div className="bg-white rounded-lg shadow p-6 text-center">불러오는 중…</div>}

        {!loading && error && (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && announcements.length === 0 && (
          <div className="bg-white rounded-lg shadow p-6 text-center">공지사항이 없습니다.</div>
        )}

        <div className="space-y-2">
          {sortedAnnouncements.slice(0, visibleCount).map(a => (
            <div
              key={a.id}
              className="card p-4 cursor-pointer"
              onClick={() => router.push(`/mobile/announcements/${a.id}`)}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-semibold text-gray-900">{a.title}</h3>
                <span className="text-xs text-gray-500">{formattedDate(a.created_at)}</span>
              </div>
              <p className="text-sm text-gray-700 line-clamp-2">{a.content}</p>
            </div>
          ))}
          {sortedAnnouncements.length > DEFAULT_VISIBLE_COUNT && (
            <button
              type="button"
              className="w-full py-3 text-sm font-semibold text-blue-600 rounded-lg bg-white shadow-sm"
              onClick={() => {
                if (isExpanded) {
                  setVisibleCount(DEFAULT_VISIBLE_COUNT)
                  setIsExpanded(false)
                } else {
                  setVisibleCount(announcements.length)
                  setIsExpanded(true)
                }
              }}
            >
              {isExpanded ? '접기' : '더보기'}
            </button>
          )}
        </div>
      </div>
    </MobileLayoutShell>
  )
}
