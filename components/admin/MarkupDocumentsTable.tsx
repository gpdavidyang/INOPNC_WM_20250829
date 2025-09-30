'use client'

import React from 'react'
import DataTable from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default function MarkupDocumentsTable({ docs }: { docs: any[] }) {
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
          accessor: (d: any) => (d?.created_at ? new Date(d.created_at).getTime() : 0),
          render: (d: any) =>
            d?.created_at ? new Date(d.created_at).toLocaleString('ko-KR') : '-',
        },
        {
          key: 'title',
          header: '제목',
          sortable: true,
          accessor: (d: any) => d?.title || '',
          render: (d: any) => (
            <span className="font-medium text-foreground">{d?.title || '-'}</span>
          ),
        },
        {
          key: 'site',
          header: '현장',
          sortable: true,
          accessor: (d: any) => d?.site?.name || '',
          render: (d: any) => d?.site?.name || '-',
        },
        {
          key: 'creator',
          header: '작성자',
          sortable: true,
          accessor: (d: any) => d?.creator?.full_name || d?.creator?.email || '',
          render: (d: any) => d?.creator?.full_name || d?.creator?.email || '-',
        },
        {
          key: 'status',
          header: '상태',
          sortable: true,
          accessor: (d: any) => d?.status || '',
          render: (d: any) => (
            <Badge variant={d?.status === 'approved' ? 'default' : 'outline'}>
              {d?.status || '-'}
            </Badge>
          ),
        },
        {
          key: 'open',
          header: '보기',
          render: (d: any) => (
            <Link
              href={`/dashboard/admin/documents/markup/${d.id}`}
              className="underline text-blue-600"
            >
              열기
            </Link>
          ),
        },
      ]}
    />
  )
}
