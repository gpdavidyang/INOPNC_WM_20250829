'use client'

import React from 'react'
import DataTable from '@/components/admin/DataTable'

export default function SignupRequestsTable({ requests }: { requests: any[] }) {
  return (
    <DataTable
      data={requests}
      rowKey="id"
      emptyMessage="표시할 요청이 없습니다."
      stickyHeader
      columns={[
        {
          key: 'requested_at',
          header: '요청일',
          sortable: true,
          accessor: (r: any) => (r?.requested_at ? new Date(r.requested_at).getTime() : 0),
          render: (r: any) =>
            r?.requested_at ? new Date(r.requested_at).toLocaleString('ko-KR') : '-',
        },
        {
          key: 'full_name',
          header: '이름',
          sortable: true,
          accessor: (r: any) => r?.full_name || '',
          render: (r: any) => r?.full_name || '-',
        },
        {
          key: 'email',
          header: '이메일',
          sortable: true,
          accessor: (r: any) => r?.email || '',
          render: (r: any) => r?.email || '-',
        },
        {
          key: 'company',
          header: '회사',
          sortable: true,
          accessor: (r: any) => r?.company_name || '',
          render: (r: any) => r?.company_name || '-',
        },
        {
          key: 'requested_role',
          header: '역할',
          sortable: true,
          accessor: (r: any) => r?.requested_role || '',
          render: (r: any) => r?.requested_role || '-',
        },
        {
          key: 'status',
          header: '상태',
          sortable: true,
          accessor: (r: any) => r?.status || '',
          render: (r: any) => r?.status || '-',
        },
      ]}
    />
  )
}
