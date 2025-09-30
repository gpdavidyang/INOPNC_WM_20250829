'use client'

import React from 'react'
import DataTable from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'

export default function SystemConfigsTable({ configs }: { configs: any[] }) {
  return (
    <DataTable
      data={configs}
      rowKey={(c: any) => `${c.category}:${c.setting_key}`}
      emptyMessage="표시할 설정이 없습니다."
      stickyHeader
      columns={[
        {
          key: 'category',
          header: '카테고리',
          sortable: true,
          accessor: (c: any) => c?.category || '',
          render: (c: any) => c?.category || '-',
        },
        {
          key: 'setting_key',
          header: '키',
          sortable: true,
          accessor: (c: any) => c?.setting_key || '',
          render: (c: any) => c?.setting_key || '-',
        },
        {
          key: 'setting_value',
          header: '값',
          sortable: true,
          accessor: (c: any) =>
            typeof c?.setting_value === 'object'
              ? JSON.stringify(c.setting_value)
              : String(c?.setting_value ?? ''),
          render: (c: any) => (
            <span
              className="max-w-[420px] truncate inline-block"
              title={
                typeof c?.setting_value === 'object'
                  ? JSON.stringify(c.setting_value)
                  : String(c?.setting_value ?? '')
              }
            >
              {typeof c?.setting_value === 'object'
                ? JSON.stringify(c.setting_value)
                : String(c?.setting_value ?? '')}
            </span>
          ),
        },
        {
          key: 'is_public',
          header: '공개',
          sortable: true,
          accessor: (c: any) => (c?.is_public ? 1 : 0),
          render: (c: any) => (
            <Badge variant={c?.is_public ? 'outline' : 'outline'}>
              {c?.is_public ? '공개' : '비공개'}
            </Badge>
          ),
        },
        {
          key: 'updated_at',
          header: '수정일',
          sortable: true,
          accessor: (c: any) =>
            c?.updated_at || c?.created_at ? new Date(c.updated_at || c.created_at).getTime() : 0,
          render: (c: any) =>
            c?.updated_at || c?.created_at
              ? new Date(c.updated_at || c.created_at).toLocaleDateString('ko-KR')
              : '-',
        },
      ]}
    />
  )
}
