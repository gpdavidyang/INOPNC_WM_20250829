'use client'

import { DataTable } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useMemo, useState } from 'react'

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
  const roleLabel = (r: string) =>
    (
      ({
        worker: '작업자',
        site_manager: '현장관리자',
        customer_manager: '파트너',
        admin: '본사관리자',
        system_admin: '시스템관리자',
      }) as Record<string, string>
    )[r] || r
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
        pending: '대기',
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
          width: '100px',
          accessor: (n: any) => n?.notification_type || '-',
          render: (n: any) => {
            const types: Record<string, string> = {
              site_announcement: 'bg-blue-50 text-blue-600',
              material_approval: 'bg-indigo-50 text-indigo-600',
              daily_report_reminder: 'bg-amber-50 text-amber-600',
              safety_alert: 'bg-rose-50 text-rose-600',
              equipment_maintenance: 'bg-emerald-50 text-emerald-600',
            }
            return (
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap',
                  types[String(n?.notification_type)] || 'bg-slate-50 text-slate-500'
                )}
              >
                {typeLabel(String(n?.notification_type || ''))}
              </span>
            )
          },
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
          width: '80px',
          align: 'center',
          accessor: (n: any) => n?.status || '',
          render: (n: any) => {
            const status = String(n?.status || 'pending')
            const colors: Record<string, string> = {
              pending: 'bg-slate-100 text-slate-500',
              delivered: 'bg-blue-50 text-blue-600',
              failed: 'bg-rose-50 text-rose-600',
              read: 'bg-emerald-50 text-emerald-600',
              acknowledged: 'bg-indigo-50 text-indigo-600',
              rejected: 'bg-orange-50 text-orange-600',
            }
            return (
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap',
                  colors[status] || colors.pending
                )}
              >
                {statusLabel(status)}
              </span>
            )
          },
        },
        {
          key: 'target_role',
          header: '대상 역할',
          sortable: true,
          accessor: (n: any) => n?.target_role || '',
          render: (n: any) => roleLabel(String(n?.target_role || '')),
        },
        {
          key: 'user_id',
          header: '대상',
          sortable: true,
          accessor: (n: any) => n?.user_id || '',
          render: (n: any) => {
            const label = n?.user_id
              ? n.user_id
              : n?.target_role
                ? `${roleLabel(String(n.target_role))} 대상`
                : '개별 로그 대기'
            return (
              <span className="truncate inline-block max-w-[220px]" title={label}>
                {label}
              </span>
            )
          },
        },
        {
          key: 'target_site',
          header: '현장',
          accessor: (n: any) => n?.target_site_name || n?.target_site_id || '',
          render: (n: any) => (
            <span
              className="truncate inline-block max-w-[200px]"
              title={n?.target_site_name || n?.target_site_id || ''}
            >
              {n?.target_site_name || n?.target_site_id || '-'}
            </span>
          ),
        },
        {
          key: 'target_partner',
          header: '소속사',
          accessor: (n: any) =>
            n?.target_partner_company_name || n?.target_partner_company_id || '',
          render: (n: any) => (
            <span
              className="truncate inline-block max-w-[220px]"
              title={n?.target_partner_company_name || n?.target_partner_company_id || ''}
            >
              {n?.target_partner_company_name || n?.target_partner_company_id || '-'}
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
            if (!n?.has_delivery_log || !id) {
              return <span className="text-xs text-muted-foreground">대기 중</span>
            }
            return (
              <div className="flex items-center gap-1.5 pr-2">
                <Button
                  variant="ghost"
                  size="compact"
                  className="h-7 px-2 rounded-md text-[11px] font-semibold border bg-white hover:bg-slate-50 border-slate-100 transition-all"
                  onClick={() => handleStatus(id, 'read')}
                >
                  읽음
                </Button>
                <Button
                  variant="ghost"
                  size="compact"
                  className="h-7 px-2 rounded-md text-[11px] font-semibold border bg-white hover:bg-slate-50 border-slate-100 transition-all font-bold text-blue-600"
                  onClick={() => handleStatus(id, 'ack')}
                >
                  확인
                </Button>
                <Button
                  variant="ghost"
                  size="compact"
                  className="h-7 px-2 rounded-md text-[11px] font-semibold border bg-white hover:bg-slate-50 border-slate-100 transition-all text-rose-600"
                  onClick={() => handleStatus(id, 'reject')}
                >
                  반려
                </Button>
                <Button
                  variant="ghost"
                  size="compact"
                  className={cn(
                    'h-7 w-7 rounded-md border flex items-center justify-center transition-all p-0',
                    starred
                      ? 'bg-amber-50 border-amber-200 text-amber-500'
                      : 'bg-white border-slate-100 text-slate-300 hover:text-slate-400'
                  )}
                  onClick={() => handleStar(id, !starred)}
                >
                  <Star className={cn('w-3.5 h-3.5', starred && 'fill-current')} />
                </Button>
              </div>
            )
          },
        },
      ]}
    />
  )
}
