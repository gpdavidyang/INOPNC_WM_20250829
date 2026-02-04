'use client'

import { DataTable } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'

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
      header: '유형 명칭',
      sortable: true,
      accessor: (t: DocumentRequirementRow) => t?.name_ko || t?.name_en || '',
      render: (t: DocumentRequirementRow) => (
        <div className="flex flex-col">
          <Link
            href={`/dashboard/admin/document-requirements/${t.id}`}
            className="font-bold text-blue-700 hover:underline underline-offset-4"
          >
            {t?.name_ko || t?.name_en || '-'}
          </Link>
          <span className="text-[10px] font-medium text-gray-400 font-mono">{t.code}</span>
        </div>
      ),
    },
    {
      key: 'max_file_size',
      header: '제한용량',
      align: 'right',
      sortable: true,
      accessor: (t: DocumentRequirementRow) => t?.max_file_size || 0,
      render: (t: DocumentRequirementRow) =>
        t?.max_file_size ? (
          <span className="font-medium text-gray-700">
            {Math.round(t.max_file_size / (1024 * 1024))}{' '}
            <span className="text-[10px] opacity-50">MB</span>
          </span>
        ) : (
          '-'
        ),
    },
    {
      key: 'is_active',
      header: '상태',
      sortable: true,
      accessor: (t: DocumentRequirementRow) => (t?.is_active ? 1 : 0),
      render: (t: DocumentRequirementRow) => (
        <Badge
          className={cn(
            'rounded-lg px-2 py-0.5 text-[10px] font-bold italic uppercase transition-all',
            t?.is_active
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-gray-50 text-gray-400 border-gray-200'
          )}
          variant="outline"
        >
          {t?.is_active ? '노출' : '숨김'}
        </Badge>
      ),
    },
    {
      key: 'sort_order',
      header: '순서',
      align: 'center',
      sortable: true,
      accessor: (t: DocumentRequirementRow) => t?.sort_order ?? 0,
      render: (t: DocumentRequirementRow) => (
        <span className="font-mono font-medium text-gray-400">{t?.sort_order ?? 0}</span>
      ),
    },
    {
      key: 'created_at',
      header: '등록일',
      sortable: true,
      accessor: (t: DocumentRequirementRow) =>
        t?.created_at ? new Date(t.created_at).getTime() : 0,
      render: (t: DocumentRequirementRow) => (
        <span className="text-gray-400 font-medium">
          {t?.created_at ? new Date(t.created_at).toLocaleDateString() : '-'}
        </span>
      ),
    },
  ]

  if (onEdit || onToggleActive || onDelete) {
    columns.push({
      key: 'actions',
      header: '동작',
      align: 'right',
      render: (t: DocumentRequirementRow) => (
        <div className="flex items-center justify-end gap-1.5">
          {onEdit ? (
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="h-8 rounded-md border-amber-200 text-amber-700 font-medium px-3 hover:bg-amber-50"
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
              size="xs"
              className={cn(
                'h-8 rounded-md font-medium px-3',
                t?.is_active
                  ? 'border-gray-200 text-gray-400 hover:bg-gray-50'
                  : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
              )}
              onClick={e => {
                e.stopPropagation()
                onToggleActive(t)
              }}
            >
              {t?.is_active ? '숨김' : '노출'}
            </Button>
          ) : null}
          {onDelete ? (
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="h-8 rounded-md border-rose-200 text-rose-700 font-medium px-3 hover:bg-rose-50"
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
