'use client'

import React from 'react'
import DataTable from '@/components/admin/DataTable'

export default function NotificationsTable({ logs }: { logs: any[] }) {
  return (
    <DataTable
      data={logs}
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
          render: (n: any) => n?.notification_type || '-',
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
          render: (n: any) => n?.status || '-',
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
      ]}
    />
  )
}
