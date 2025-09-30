'use client'

import React from 'react'
import DataTable from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'

export default function DailyReportsTable({ reports }: { reports: any[] }) {
  return (
    <DataTable
      data={reports}
      rowKey="id"
      emptyMessage="표시할 작업일지가 없습니다."
      stickyHeader
      columns={[
        {
          key: 'work_date',
          header: '작업일자',
          sortable: true,
          accessor: (r: any) =>
            r?.work_date || r?.report_date ? new Date(r.work_date || r.report_date).getTime() : 0,
          render: (r: any) => (
            <a href={`/dashboard/admin/daily-reports/${r.id}`} className="underline text-blue-600">
              {r?.work_date || r?.report_date
                ? new Date(r.work_date || r.report_date).toLocaleDateString('ko-KR')
                : '-'}
            </a>
          ),
        },
        {
          key: 'site',
          header: '현장',
          sortable: true,
          accessor: (r: any) => r?.sites?.name || r?.site?.name || '',
          render: (r: any) => r?.sites?.name || r?.site?.name || '-',
        },
        {
          key: 'author',
          header: '작성자',
          sortable: true,
          accessor: (r: any) => r?.profiles?.full_name || r?.submitted_by_profile?.full_name || '',
          render: (r: any) => r?.profiles?.full_name || r?.submitted_by_profile?.full_name || '-',
        },
        {
          key: 'status',
          header: '상태',
          sortable: true,
          accessor: (r: any) => r?.status || '',
          render: (r: any) => (
            <Badge variant={r?.status === 'submitted' ? 'default' : 'outline'}>
              {r?.status === 'submitted'
                ? '제출됨'
                : r?.status === 'draft'
                  ? '임시저장'
                  : r?.status || '미정'}
            </Badge>
          ),
        },
        {
          key: 'workers',
          header: '인원',
          sortable: true,
          accessor: (r: any) => r?.worker_details_count ?? r?.total_workers ?? 0,
          render: (r: any) => String(r?.worker_details_count ?? r?.total_workers ?? 0),
        },
        {
          key: 'docs',
          header: '문서',
          sortable: true,
          accessor: (r: any) => r?.daily_documents_count ?? 0,
          render: (r: any) => String(r?.daily_documents_count ?? 0),
        },
        {
          key: 'total_manhours',
          header: '총공수',
          sortable: true,
          accessor: (r: any) => r?.total_manhours ?? 0,
          render: (r: any) => (
            <div className="flex items-center gap-3">
              <span>{r?.total_manhours ?? 0}</span>
              <a
                href={`/dashboard/admin/daily-reports/${r.id}/edit`}
                className="underline text-blue-600 text-xs"
              >
                수정
              </a>
            </div>
          ),
        },
      ]}
    />
  )
}
