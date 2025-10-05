'use client'

import React from 'react'
import DataTable from '@/components/admin/DataTable'
import Link from 'next/link'
import { formatBytes } from '@/lib/utils'

export default function PhotoGridReportsTable({ reports }: { reports: any[] }) {
  const handleDownload = async (id: string) => {
    try {
      const res = await fetch(`/api/photo-grid-reports/${id}/download`, {
        cache: 'no-store',
      })
      const json = await res.json()
      const url: string | undefined = json?.data?.url || json?.data?.signedUrl || json?.url
      if (url) window.open(url, '_blank', 'noopener')
    } catch {
      // ignore
    }
  }
  return (
    <DataTable
      data={reports}
      rowKey="id"
      emptyMessage="표시할 문서가 없습니다."
      stickyHeader
      columns={[
        {
          key: 'created_at',
          header: '생성일',
          sortable: true,
          accessor: (r: any) => (r?.created_at ? new Date(r.created_at).getTime() : 0),
          render: (r: any) =>
            r?.created_at ? new Date(r.created_at).toLocaleString('ko-KR') : '-',
        },
        {
          key: 'title',
          header: '제목',
          sortable: true,
          accessor: (r: any) => r?.title || '',
          render: (r: any) => (
            <span className="font-medium text-foreground">{r?.title || '-'}</span>
          ),
        },
        {
          key: 'site',
          header: '현장',
          sortable: true,
          accessor: (r: any) => r?.daily_report?.site?.name || '',
          render: (r: any) => r?.daily_report?.site?.name || '-',
        },
        {
          key: 'file_size',
          header: '파일',
          sortable: true,
          accessor: (r: any) => r?.file_size || 0,
          render: (r: any) => (r?.file_size ? formatBytes(r.file_size) : '-'),
        },
        {
          key: 'creator',
          header: '생성자',
          sortable: true,
          accessor: (r: any) =>
            r?.generated_by_profile?.full_name || r?.generated_by_profile?.email || '',
          render: (r: any) =>
            r?.generated_by_profile?.full_name || r?.generated_by_profile?.email || '-',
        },
        {
          key: 'actions',
          header: '동작',
          render: (r: any) => (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleDownload(r?.id)}
                className="underline text-blue-600"
              >
                다운로드
              </button>
              <Link
                href={`/dashboard/admin/documents/photo-grid/${r.id}`}
                className="underline text-blue-600"
              >
                상세보기
              </Link>
            </div>
          ),
        },
      ]}
    />
  )
}
