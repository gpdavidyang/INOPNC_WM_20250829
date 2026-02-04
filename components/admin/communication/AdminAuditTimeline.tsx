'use client'

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
    <div className="space-y-3 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100 pb-0">
      {events.map(event => (
        <div key={event.id} className="relative pl-10">
          {/* Timeline Dot */}
          <div className="absolute left-0 top-1 w-9 h-9 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full border-2 border-white bg-slate-200 shadow-sm z-10" />
          </div>

          <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 transition-all hover:bg-white hover:shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-500">
                {label(event.engagement_type)}
              </span>
              {event.engaged_at && (
                <span className="text-[11px] font-bold text-slate-400">
                  {new Date(event.engaged_at).toLocaleString('ko-KR')}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-[#1A254F] tracking-tight truncate">
                {event.notification?.title || '공지 알림'}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-slate-500">
                  {event.user?.name || '관리자'}
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="text-[11px] font-medium text-slate-400">
                  {event.notification?.type || 'site_announcement'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
