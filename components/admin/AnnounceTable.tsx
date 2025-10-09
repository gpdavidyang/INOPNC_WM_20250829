'use client'

import React from 'react'
import { DataTable } from '@/components/admin/DataTable'

export default function AnnounceTable({ announcements }: { announcements: any[] }) {
  const roleLabel = (r: string) =>
    (
      ({
        worker: '작업자',
        site_manager: '현장관리자',
        admin: '본사관리자',
        system_admin: '시스템관리자',
        production_manager: '생산관리자',
      }) as Record<string, string>
    )[r] || r

  const priorityLabel = (p: string) =>
    (({ low: '낮음', medium: '보통', high: '높음', urgent: '긴급' }) as Record<string, string>)[
      p
    ] || p

  return (
    <DataTable
      className="mt-1"
      data={announcements}
      rowKey="id"
      emptyMessage="표시할 공지가 없습니다."
      stickyHeader
      columns={[
        {
          key: 'created_at',
          header: '게시일',
          sortable: true,
          accessor: (a: any) => (a?.created_at ? new Date(a.created_at).getTime() : 0),
          render: (a: any) =>
            a?.created_at ? new Date(a.created_at).toLocaleString('ko-KR') : '-',
        },
        {
          key: 'priority',
          header: '우선순위',
          sortable: true,
          accessor: (a: any) => a?.priority || '',
          render: (a: any) => priorityLabel(String(a?.priority || '')),
        },
        {
          key: 'title',
          header: '제목',
          sortable: true,
          accessor: (a: any) => a?.title || '',
          render: (a: any) => (
            <span className="font-medium text-foreground">{a?.title || '-'}</span>
          ),
        },
        {
          key: 'target_roles',
          header: '대상 역할',
          sortable: true,
          accessor: (a: any) => (Array.isArray(a?.target_roles) ? a.target_roles.join(', ') : ''),
          render: (a: any) => {
            const roles = Array.isArray(a?.target_roles) ? a.target_roles : []
            const labels = roles.map((r: string) => roleLabel(r))
            return (
              <span className="truncate inline-block max-w-[320px]" title={labels.join(', ')}>
                {labels.join(', ') || '-'}
              </span>
            )
          },
        },
        {
          key: 'is_active',
          header: '상태',
          sortable: true,
          accessor: (a: any) => (a?.is_active ? 1 : 0),
          render: (a: any) => (a?.is_active ? '활성' : '비활성'),
        },
      ]}
    />
  )
}
