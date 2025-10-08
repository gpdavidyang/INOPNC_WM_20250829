'use client'

import React from 'react'
import { DataTable } from '@/components/admin/DataTable'

export default function WorkOptionsTable({ items }: { items: any[] }) {
  return (
    <DataTable
      data={items}
      rowKey="id"
      emptyMessage="등록된 옵션이 없습니다."
      stickyHeader
      columns={[
        {
          key: 'option_value',
          header: '값',
          sortable: true,
          accessor: (o: any) => o?.option_value || '',
          render: (o: any) => (
            <span className="font-medium text-foreground">{o?.option_value || '-'}</span>
          ),
        },
        {
          key: 'option_label',
          header: '라벨',
          sortable: true,
          accessor: (o: any) => o?.option_label || '',
          render: (o: any) => o?.option_label || '-',
        },
        {
          key: 'display_order',
          header: '정렬',
          align: 'right',
          sortable: true,
          accessor: (o: any) => o?.display_order ?? 0,
          render: (o: any) => String(o?.display_order ?? 0),
        },
        {
          key: 'is_active',
          header: '활성',
          sortable: true,
          accessor: (o: any) => (o?.is_active ? 1 : 0),
          render: (o: any) => (o?.is_active ? '활성' : '비활성'),
        },
      ]}
    />
  )
}
