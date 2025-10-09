'use client'

import React, { useMemo, useState } from 'react'
import { DataTable } from '@/components/admin/DataTable'
import { useRouter } from 'next/navigation'

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  })
  return res.ok
}

export default function NotificationsTable({
  logs,
  initialStars,
}: {
  logs: any[]
  initialStars?: Record<string, boolean>
}) {
  const router = useRouter()
  const [stars, setStars] = useState<Record<string, boolean>>(initialStars || {})

  React.useEffect(() => {
    if (initialStars) setStars(initialStars)
  }, [initialStars])

  const rows = useMemo(() => logs || [], [logs])
  const typeLabel = (t: string) =>
    (
      ({
        site_announcement: '현장 공지',
        material_approval: '자재 승인',
        daily_report_reminder: '일보 리마인더',
        safety_alert: '안전 알림',
        equipment_maintenance: '장비 점검',
      }) as Record<string, string>
    )[t] || t

  const statusLabel = (s: string) =>
    (
      ({
        delivered: '전달됨',
        failed: '실패',
        read: '읽음',
        acknowledged: '확인',
        rejected: '반려',
      }) as Record<string, string>
    )[s] || s

  const handleStatus = async (id: string, action: 'read' | 'ack' | 'reject') => {
    await postJson(`/api/admin/notifications/${id}/status`, { action })
    router.refresh()
  }

  const handleStar = async (id: string, next: boolean) => {
    const ok = await postJson(`/api/admin/notifications/${id}/star`, { starred: next })
    if (ok) setStars(prev => ({ ...prev, [id]: next }))
  }

  return (
    <DataTable
      data={rows}
      rowKey="id"
      emptyMessage="표시할 알림이 없습니다."
      stickyHeader
      columns={[
        {
          key: 'sent_at',
          header: '시간',
          sortable: true,
          accessor: (n: any) => (n?.sent_at ? new Date(n.sent_at).getTime() : 0),
          render: (n: any) => (n?.sent_at ? new Date(n.sent_at).toLocaleString('ko-KR') : '-'),
        },
        {
          key: 'notification_type',
          header: '유형',
          sortable: true,
          accessor: (n: any) => n?.notification_type || '-',
          render: (n: any) => typeLabel(String(n?.notification_type || '')),
        },
        {
          key: 'title',
          header: '제목',
          sortable: true,
          accessor: (n: any) => n?.title || n?.body || '',
          render: (n: any) => (
            <span className="truncate inline-block max-w-[320px]" title={n?.title || n?.body || ''}>
              {n?.title || n?.body || '-'}
            </span>
          ),
        },
        {
          key: 'status',
          header: '상태',
          sortable: true,
          accessor: (n: any) => n?.status || '',
          render: (n: any) => statusLabel(String(n?.status || '')),
        },
        {
          key: 'user_id',
          header: '대상',
          sortable: true,
          accessor: (n: any) => n?.user_id || '',
          render: (n: any) => (
            <span className="truncate inline-block max-w-[220px]" title={n?.user_id || ''}>
              {n?.user_id || '-'}
            </span>
          ),
        },
        {
          key: 'actions',
          header: '동작',
          accessor: () => 0,
          render: (n: any) => {
            const id = n?.id as string
            const starred = stars[id] || false
            return (
              <div className="flex gap-2">
                <button
                  className="px-2 py-1 text-xs rounded border bg-white hover:bg-gray-50"
                  onClick={() => handleStatus(id, 'read')}
                  title="읽음 처리"
                >
                  읽음
                </button>
                <button
                  className="px-2 py-1 text-xs rounded border bg-white hover:bg-gray-50"
                  onClick={() => handleStatus(id, 'ack')}
                  title="확인/승인 처리"
                >
                  확인
                </button>
                <button
                  className="px-2 py-1 text-xs rounded border bg-white hover:bg-gray-50"
                  onClick={() => handleStatus(id, 'reject')}
                  title="반려 처리"
                >
                  반려
                </button>
                <button
                  className={`px-2 py-1 text-xs rounded border ${starred ? 'bg-yellow-100 border-yellow-300' : 'bg-white hover:bg-gray-50'}`}
                  onClick={() => handleStar(id, !starred)}
                  title={starred ? '즐겨찾기 해제' : '즐겨찾기'}
                >
                  {starred ? '★' : '☆'}
                </button>
              </div>
            )
          },
        },
      ]}
    />
  )
}
