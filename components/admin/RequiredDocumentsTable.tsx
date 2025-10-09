'use client'

import React from 'react'
import { DataTable } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function RequiredDocumentsTable({
  docs,
  onOpen,
}: {
  docs: any[]
  onOpen?: (doc: any) => void
}) {
  return (
    <DataTable
      data={docs}
      rowKey="id"
      emptyMessage="표시할 문서가 없습니다."
      stickyHeader
      columns={[
        {
          key: 'submission_date',
          header: '제출일',
          sortable: true,
          accessor: (d: any) => (d?.submission_date ? new Date(d.submission_date).getTime() : 0),
          render: (d: any) =>
            d?.submission_date ? new Date(d.submission_date).toLocaleDateString('ko-KR') : '-',
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
          key: 'submitted_by',
          header: '제출자',
          sortable: true,
          accessor: (d: any) => d?.submitted_by?.full_name || d?.submitted_by?.email || '',
          render: (d: any) => d?.submitted_by?.full_name || d?.submitted_by?.email || '-',
        },
        {
          key: 'status',
          header: '상태',
          sortable: true,
          accessor: (d: any) => d?.status || '',
          render: (d: any) => d?.status || '-',
        },
        {
          key: 'actions',
          header: '동작',
          sortable: false,
          render: (d: any) => (
            <Button
              type="button"
              variant="outline"
              size="compact"
              className="px-2 py-1 text-sm"
              onClick={() => onOpen?.(d)}
              disabled={!onOpen}
              title="문서 보기"
            >
              보기
            </Button>
          ),
        },
      ]}
    />
  )
}
