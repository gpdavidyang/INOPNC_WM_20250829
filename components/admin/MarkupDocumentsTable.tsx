'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { DataTable } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import AdminActionButtons from '@/components/admin/AdminActionButtons'

export default function MarkupDocumentsTable({ docs }: { docs: any[] }) {
  const router = useRouter()

  const handleDelete = async (id: string) => {
    const ok = window.confirm('해당 마크업 문서를 삭제하시겠습니까?')
    if (!ok) return
    try {
      const res = await fetch(`/api/markup-documents/${id}`, { method: 'DELETE' })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || j?.error) throw new Error(j?.error || '삭제 실패')
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : '삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <DataTable
      data={docs}
      rowKey="id"
      emptyMessage="표시할 문서가 없습니다."
      stickyHeader
      columns={[
        {
          key: 'created_at',
          header: '생성일',
          sortable: true,
          width: 160,
          accessor: (d: any) => (d?.created_at ? new Date(d.created_at).getTime() : 0),
          render: (d: any) =>
            d?.created_at ? new Date(d.created_at).toLocaleString('ko-KR') : '-',
        },
        {
          key: 'title',
          header: '제목',
          sortable: true,
          width: 320,
          className: 'max-w-[320px] truncate',
          accessor: (d: any) => d?.title || '',
          render: (d: any) => (
            <span className="font-medium text-foreground truncate inline-block max-w-full">
              {d?.title || '-'}
            </span>
          ),
        },
        {
          key: 'site',
          header: '현장',
          sortable: true,
          width: 220,
          className: 'whitespace-nowrap',
          accessor: (d: any) => d?.site?.name || '',
          render: (d: any) => d?.site?.name || '-',
        },
        {
          key: 'daily_report',
          header: '작업일지',
          sortable: true,
          width: 260,
          className: 'whitespace-nowrap',
          accessor: (d: any) =>
            d?.daily_report?.work_date ? new Date(d.daily_report.work_date).getTime() : 0,
          render: (d: any) => {
            if (!d?.daily_report) return '-'
            const dateLabel = d.daily_report.work_date
              ? new Date(d.daily_report.work_date).toLocaleDateString('ko-KR')
              : '날짜 미정'
            const memberLabel = d.daily_report.member_name || '작성자 미상'
            const statusLabel = formatDailyReportStatus(d.daily_report.status)
            return `${dateLabel} · ${memberLabel} · ${statusLabel}`
          },
        },
        {
          key: 'creator',
          header: '작성자',
          sortable: true,
          width: 200,
          className: 'whitespace-nowrap',
          accessor: (d: any) => d?.creator?.full_name || d?.creator?.email || '',
          render: (d: any) => d?.creator?.full_name || d?.creator?.email || '-',
        },
        {
          key: 'status',
          header: '상태',
          sortable: true,
          width: 100,
          accessor: (d: any) => d?.status || '',
          render: (d: any) => (
            <Badge variant={d?.status === 'approved' ? 'default' : 'outline'}>
              {d?.status || '-'}
            </Badge>
          ),
        },
        {
          key: 'actions',
          header: '작업',
          width: 220,
          render: (d: any) => (
            <AdminActionButtons
              size="compact"
              editHref={`/dashboard/admin/documents/markup/${d.id}/edit`}
              deleteHref={`/api/markup-documents/${d.id}`}
              onDeleted={() => router.refresh()}
            />
          ),
        },
      ]}
    />
  )
}

function formatDailyReportStatus(status?: string | null) {
  if (!status) return '상태 미정'
  const map: Record<string, string> = {
    submitted: '제출 완료',
    approved: '승인 완료',
    rejected: '반려',
    draft: '임시 저장',
    saved: '임시 저장',
    pending: '검토 중',
  }
  return map[status.toLowerCase()] || status
}
