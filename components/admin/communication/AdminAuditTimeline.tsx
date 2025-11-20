'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'

interface AuditEvent {
  id: string
  engagement_type: string
  engaged_at?: string
  user?: { id: string; name?: string | null; email?: string | null } | null
  notification?: {
    title?: string | null
    status?: string | null
    type?: string | null
    sent_at?: string | null
  } | null
  metadata?: Record<string, unknown> | null
}

export function AdminAuditTimeline({ events }: { events: AuditEvent[] }) {
  if (!events?.length) {
    return (
      <div className="text-sm text-muted-foreground">
        최근 감사 로그가 없습니다. 상태 변경 시 자동 기록됩니다.
      </div>
    )
  }

  const label = (type: string) =>
    (
      ({
        admin_starred: '즐겨찾기',
        admin_unstarred: '즐겨찾기 해제',
        admin_read: '읽음 처리',
        admin_ack: '확인 처리',
        admin_reject: '반려 처리',
      }) as Record<string, string>
    )[type] || type

  return (
    <div className="space-y-4">
      {events.map(event => (
        <div key={event.id} className="border rounded-lg p-3">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline">{label(event.engagement_type)}</Badge>
            {event.engaged_at && (
              <span className="text-xs text-muted-foreground">
                {new Date(event.engaged_at).toLocaleString('ko-KR')}
              </span>
            )}
          </div>
          <div className="mt-2 text-sm">
            <div className="text-foreground font-medium">{event.notification?.title || '공지'}</div>
            <div className="text-xs text-muted-foreground">
              {event.user?.name || '관리자'} · {event.notification?.type || 'site_announcement'}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
