'use client'

import React from 'react'
import DataTable from '@/components/admin/DataTable'

export default function AuditLogsTable({ logs }: { logs: any[] }) {
  return (
    <DataTable
      data={logs}
      rowKey="id"
      emptyMessage="표시할 감사 로그가 없습니다."
      stickyHeader
      columns={[
        {
          key: 'timestamp',
          header: '시간',
          sortable: true,
          accessor: (l: any) => (l?.timestamp ? new Date(l.timestamp).getTime() : 0),
          render: (l: any) => (l?.timestamp ? new Date(l.timestamp).toLocaleString('ko-KR') : '-'),
        },
        {
          key: 'action',
          header: '작업',
          sortable: true,
          accessor: (l: any) => l?.action || '',
          render: (l: any) => <span className="font-medium">{l?.action || '-'}</span>,
        },
        {
          key: 'table_name',
          header: '테이블',
          sortable: true,
          accessor: (l: any) => l?.table_name || '',
          render: (l: any) => l?.table_name || '-',
        },
        {
          key: 'record_id',
          header: '레코드 ID',
          sortable: true,
          accessor: (l: any) => l?.record_id || '',
          render: (l: any) => (
            <span className="truncate inline-block max-w-[200px]" title={l?.record_id || ''}>
              {l?.record_id || '-'}
            </span>
          ),
        },
        {
          key: 'user',
          header: '사용자',
          sortable: true,
          accessor: (l: any) => l?.user?.full_name || l?.user?.email || '',
          render: (l: any) =>
            l?.user ? (
              <span className="truncate inline-block max-w-[240px]">
                {l.user.full_name || l.user.email || '-'}
              </span>
            ) : (
              '-'
            ),
        },
        {
          key: 'ip_address',
          header: 'IP',
          sortable: true,
          accessor: (l: any) => l?.ip_address || '',
          render: (l: any) => l?.ip_address || '-',
        },
      ]}
    />
  )
}
