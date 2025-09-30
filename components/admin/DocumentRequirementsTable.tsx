'use client'

import React from 'react'
import DataTable from '@/components/admin/DataTable'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export default function DocumentRequirementsTable({ types }: { types: any[] }) {
  return (
    <DataTable
      data={types}
      rowKey="id"
      emptyMessage="표시할 문서 유형이 없습니다."
      stickyHeader
      columns={[
        {
          key: 'code',
          header: '코드',
          sortable: true,
          accessor: (t: any) => t?.code || '',
          render: (t: any) => <span className="font-medium text-foreground">{t?.code || '-'}</span>,
        },
        {
          key: 'name',
          header: '이름(국문)',
          sortable: true,
          accessor: (t: any) => t?.name_ko || t?.name_en || '',
          render: (t: any) => (
            <Link
              href={`/dashboard/admin/document-requirements/${t.id}`}
              className="underline text-blue-600"
            >
              {t?.name_ko || t?.name_en || '-'}
            </Link>
          ),
        },
        {
          key: 'file_types',
          header: '허용 확장자',
          sortable: true,
          accessor: (t: any) => (Array.isArray(t?.file_types) ? t.file_types.join(', ') : ''),
          render: (t: any) => (
            <span
              className="truncate inline-block max-w-[260px]"
              title={(t?.file_types || []).join(', ')}
            >
              {(t?.file_types || []).join(', ') || '-'}
            </span>
          ),
        },
        {
          key: 'max_file_size',
          header: '최대 크기',
          align: 'right',
          sortable: true,
          accessor: (t: any) => t?.max_file_size || 0,
          render: (t: any) =>
            t?.max_file_size ? `${Math.round(t.max_file_size / (1024 * 1024))} MB` : '-',
        },
        {
          key: 'is_active',
          header: '활성',
          sortable: true,
          accessor: (t: any) => (t?.is_active ? 1 : 0),
          render: (t: any) => (
            <Badge variant={t?.is_active ? 'default' : 'outline'}>
              {t?.is_active ? '활성' : '비활성'}
            </Badge>
          ),
        },
        {
          key: 'sort_order',
          header: '정렬',
          align: 'right',
          sortable: true,
          accessor: (t: any) => t?.sort_order ?? 0,
          render: (t: any) => String(t?.sort_order ?? 0),
        },
        {
          key: 'created_at',
          header: '생성일',
          sortable: true,
          accessor: (t: any) => (t?.created_at ? new Date(t.created_at).getTime() : 0),
          render: (t: any) =>
            t?.created_at ? new Date(t.created_at).toLocaleDateString('ko-KR') : '-',
        },
      ]}
    />
  )
}
