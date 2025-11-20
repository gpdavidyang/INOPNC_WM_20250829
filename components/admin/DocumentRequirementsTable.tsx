'use client'

import React from 'react'
import { DataTable } from '@/components/admin/DataTable'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type DocumentRequirementRow = {
  id: string
  code: string
  name_ko?: string | null
  name_en?: string | null
  description?: string | null
  instructions?: string | null
  file_types?: string[] | null
  max_file_size?: number | null
  is_active?: boolean | null
  sort_order?: number | null
  created_at?: string | null
}

type Props = {
  types: DocumentRequirementRow[]
  onEdit?: (row: DocumentRequirementRow) => void
  onToggleActive?: (row: DocumentRequirementRow) => void
  onDelete?: (row: DocumentRequirementRow) => void
}

export default function DocumentRequirementsTable({
  types,
  onEdit,
  onToggleActive,
  onDelete,
}: Props) {
  const columns: any[] = [
    {
      key: 'name',
      header: '이름(국문)',
      sortable: true,
      accessor: (t: DocumentRequirementRow) => t?.name_ko || t?.name_en || '',
      render: (t: DocumentRequirementRow) => (
        <Link
          href={`/dashboard/admin/document-requirements/${t.id}`}
          className="underline text-blue-600"
        >
          {t?.name_ko || t?.name_en || '-'}
        </Link>
      ),
    },
    {
      key: 'max_file_size',
      header: '최대 크기',
      align: 'right',
      sortable: true,
      accessor: (t: DocumentRequirementRow) => t?.max_file_size || 0,
      render: (t: DocumentRequirementRow) =>
        t?.max_file_size ? `${Math.round(t.max_file_size / (1024 * 1024))} MB` : '-',
    },
    {
      key: 'is_active',
      header: '활성',
      sortable: true,
      accessor: (t: DocumentRequirementRow) => (t?.is_active ? 1 : 0),
      render: (t: DocumentRequirementRow) => (
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
      accessor: (t: DocumentRequirementRow) => t?.sort_order ?? 0,
      render: (t: DocumentRequirementRow) => String(t?.sort_order ?? 0),
    },
    {
      key: 'created_at',
      header: '생성일',
      sortable: true,
      accessor: (t: DocumentRequirementRow) =>
        t?.created_at ? new Date(t.created_at).getTime() : 0,
      render: (t: DocumentRequirementRow) =>
        t?.created_at ? new Date(t.created_at).toLocaleDateString('ko-KR') : '-',
    },
  ]

  if (onEdit || onToggleActive || onDelete) {
    columns.push({
      key: 'actions',
      header: '동작',
      align: 'right',
      render: (t: DocumentRequirementRow) => (
        <div className="flex items-center justify-end gap-2">
          {onEdit ? (
            <Button
              type="button"
              variant="outline"
              size="compact"
              onClick={e => {
                e.stopPropagation()
                onEdit(t)
              }}
            >
              수정
            </Button>
          ) : null}
          {onToggleActive ? (
            <Button
              type="button"
              variant="outline"
              size="compact"
              onClick={e => {
                e.stopPropagation()
                onToggleActive(t)
              }}
            >
              {t?.is_active ? '비활성' : '활성'}
            </Button>
          ) : null}
          {onDelete ? (
            <Button
              type="button"
              variant="destructive"
              size="compact"
              onClick={e => {
                e.stopPropagation()
                onDelete(t)
              }}
            >
              삭제
            </Button>
          ) : null}
        </div>
      ),
    })
  }

  return (
    <DataTable
      data={types}
      rowKey="id"
      emptyMessage="표시할 문서 유형이 없습니다."
      stickyHeader
      columns={columns}
    />
  )
}
