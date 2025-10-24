'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MobileLayout as MobileLayoutShell } from '@/modules/mobile/components/layout/MobileLayout'

interface Announcement {
  id: string
  title: string
  content: string
  priority?: string | null
  created_at?: string
}

export default function MobileAnnouncementDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = useMemo(() => String(params?.id || ''), [params])
  const [loading, setLoading] = useState(true)
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!id) return
      setLoading(true)
      try {
        const res = await fetch(`/api/announcements?id=${encodeURIComponent(id)}`, {
          cache: 'no-store',
        })
        if (!res.ok) throw new Error('공지사항 조회 실패')
        const json = await res.json()
        const list = Array.isArray(json?.announcements) ? json.announcements : []
        const item = list[0] || null
        if (mounted) {
          setAnnouncement(item)
          if (!item) setError('공지사항을 찾을 수 없습니다.')
        }
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
  }, [id])

  const renderPriority = (p?: string | null) => {
    if (!p) return null
    const labelMap: Record<string, string> = {
      urgent: '긴급',
      high: '중요',
      medium: '일반',
      low: '안내',
    }
    const label = labelMap[p] || '알림'
    const colorMap: Record<string, string> = {
      urgent: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      medium: 'bg-blue-100 text-blue-700',
      low: 'bg-gray-100 text-gray-700',
    }
    const color = colorMap[p] || 'bg-gray-100 text-gray-700'
    return <span className={`px-2 py-0.5 rounded text-xs ${color}`}>{label}</span>
  }

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

        {!loading && announcement && (
          <article className="bg-white rounded-lg shadow p-5 space-y-3">
            <div className="flex items-center gap-2">
              {renderPriority(announcement.priority)}
              {announcement.created_at && (
                <span className="text-xs text-gray-500">
                  {formattedDate(announcement.created_at)}
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{announcement.title}</h2>
            <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
              {announcement.content}
            </div>
          </article>
        )}
      </div>
    </MobileLayoutShell>
  )
}
