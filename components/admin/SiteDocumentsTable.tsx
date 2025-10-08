'use client'

import React from 'react'
import { DataTable } from '@/components/admin/DataTable'

export default function SiteDocumentsTable({ docs }: { docs: any[] }) {
  return (
    <DataTable
      data={docs}
      rowKey="id"
      emptyMessage="표시할 문서가 없습니다."
      stickyHeader
      columns={[
        {
          key: 'created_at',
          header: '등록일',
          sortable: true,
          accessor: (d: any) => (d?.created_at ? new Date(d.created_at).getTime() : 0),
          render: (d: any) =>
            d?.created_at ? new Date(d.created_at).toLocaleDateString('ko-KR') : '-',
        },
        {
          key: 'title',
          header: '문서명',
          sortable: true,
          accessor: (d: any) => d?.title || '',
          render: (d: any) => (
            <span className="font-medium text-foreground">{d?.title || '-'}</span>
          ),
        },
        {
          key: 'category_type',
          header: '유형',
          sortable: true,
          accessor: (d: any) => d?.category_type || '',
          render: (d: any) => d?.category_type || '-',
        },
        {
          key: 'status',
          header: '상태',
          sortable: true,
          accessor: (d: any) => d?.status || '',
          render: (d: any) => d?.status || '-',
        },
      ]}
    />
  )
}
