'use client'

import React from 'react'
import DataTable from '@/components/admin/DataTable'
import Link from 'next/link'

export default function RequiredDocumentsTable({ docs }: { docs: any[] }) {
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
          key: 'document_type',
          header: '유형',
          sortable: true,
          accessor: (d: any) => d?.document_type || 'unknown',
          render: (d: any) => (
            <Link
              href={`/dashboard/admin/documents/required/${encodeURIComponent(d?.document_type || 'unknown')}`}
              className="underline text-blue-600"
            >
              {d?.document_type || 'unknown'}
            </Link>
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
      ]}
    />
  )
}
