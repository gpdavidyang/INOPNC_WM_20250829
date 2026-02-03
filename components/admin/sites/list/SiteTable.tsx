'use client'

import DataTable, { type Column, type SortDirection } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/ui/strings'
import type { Site } from '@/types'
import { Calendar, MapPin, User } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'

const STATUS_LABELS: Record<string, string> = {
  planning: '준비 중',
  active: '진행 중',
  inactive: '중단',
  completed: '완료',
}

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('ko-KR')
}

interface SiteTableProps {
  sites: Site[]
  statsMap: Record<string, any>
  managersMap: Record<string, any>
  loading: boolean
  sortKey: string
  sortDir: SortDirection
  onSortChange: (key: string, dir: SortDirection) => void
  onDelete: (site: Site) => void
}

export const SiteTable = ({
  sites,
  statsMap,
  managersMap,
  loading,
  sortKey,
  sortDir,
  onSortChange,
  onDelete,
}: SiteTableProps) => {
  const columns: Column<Site>[] = useMemo(
    () => [
      {
        key: 'name',
        header: t('sites.table.name'),
        sortable: true,
        render: s => (
          <div className="flex items-start gap-3 py-1">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg shrink-0">
              <MapPin className="w-4 h-4 text-blue-500" />
            </div>
            <div className="min-w-0">
              <Link
                href={`/dashboard/admin/sites/${s.id}`}
                className="font-bold text-gray-900 dark:text-gray-100 hover:text-blue-600 transition-colors block border-b border-transparent hover:border-blue-600 w-fit"
              >
                {s.name}
              </Link>
              <div className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[200px]">
                {s.address}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        header: t('sites.table.status'),
        sortable: true,
        className: 'w-[100px]',
        render: s => (
          <Badge
            variant={s.status === 'active' ? 'default' : 'outline'}
            className="rounded-md font-bold text-[10px] px-2 py-0.5"
          >
            {STATUS_LABELS[s.status || ''] || '미정'}
          </Badge>
        ),
      },
      {
        key: 'start_date',
        header: '공사 기간',
        sortable: true,
        render: s => (
          <div className="text-xs text-gray-500 font-medium">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 opacity-50" />
              {formatDate(s.start_date)}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-3 h-3" />~ {formatDate(s.end_date || null)}
            </div>
          </div>
        ),
      },
      {
        key: 'manager_name',
        header: '담당자',
        sortable: true,
        render: s => {
          const m = managersMap[s.id]
          return (
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {m?.full_name || (s as any).manager_name || '미지정'}
              </span>
            </div>
          )
        },
      },
      {
        key: 'daily_reports_count',
        header: '통계 (보고서/공수)',
        sortable: false,
        render: s => {
          const stats = statsMap[s.id] || {
            daily_reports_count: s.daily_reports_count ?? 0,
            total_labor_hours: s.total_labor_hours ?? 0,
          }
          return (
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">
                  Reports
                </span>
                <span className="text-sm font-black text-gray-900 dark:text-gray-100 italic">
                  {stats.daily_reports_count}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">
                  Labor
                </span>
                <span className="text-sm font-black text-blue-600 dark:text-blue-400 italic">
                  {(stats.total_labor_hours || 0).toFixed(1)}{' '}
                  <small className="text-[10px] uppercase font-bold not-italic ml-0.5">mh</small>
                </span>
              </div>
            </div>
          )
        },
      },
      {
        key: 'actions',
        header: '',
        sortable: false,
        align: 'right',
        render: s => (
          <div className="flex items-center justify-end gap-1">
            <Button asChild variant="secondary" size="xs" className="h-8 rounded-lg font-bold">
              <Link href={`/dashboard/admin/sites/${s.id}`}>상세</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="xs"
              className="h-8 rounded-lg font-bold border-amber-200 text-amber-700 hover:bg-amber-50"
            >
              <Link href={`/dashboard/admin/sites/${s.id}?tab=edit`}>수정</Link>
            </Button>
            <Button
              variant="ghost"
              size="xs"
              className="h-8 rounded-lg font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              onClick={() => onDelete(s)}
            >
              삭제
            </Button>
          </div>
        ),
      },
    ],
    [statsMap, managersMap, onDelete]
  )

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
      <DataTable
        data={sites}
        columns={columns}
        rowKey="id"
        initialSort={{ columnKey: sortKey, direction: sortDir }}
        onSortChange={onSortChange}
      />
      {sites.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <MapPin className="w-12 h-12 mb-4 opacity-10" />
          <p className="font-medium">{t('sites.empty')}</p>
        </div>
      )}
    </div>
  )
}
