'use client'

import React from 'react'
import DataTable from '@/components/admin/DataTable'

export default function AnnounceTable({ announcements }: { announcements: any[] }) {
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
          render: (a: any) => (
            <span
              className="truncate inline-block max-w-[320px]"
              title={(a?.target_roles || []).join(', ')}
            >
              {(a?.target_roles || []).join(', ') || '-'}
            </span>
          ),
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
