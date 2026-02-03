'use client'

import DataTable from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  isMaterialPriorityValue,
  MATERIAL_PRIORITY_BADGE_VARIANTS,
  MATERIAL_PRIORITY_LABELS,
  MaterialPriorityValue,
} from '@/lib/materials/priorities'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

interface RequestsSectionProps {
  requests: any[]
  loading: boolean
  query: string
  onQueryChange: (q: string) => void
  status: string
  onStatusChange: (s: string) => void
  sort: string
  onSortChange: (s: string) => void
  page: number
  onPageChange: (p: any) => void
  pageSize: number
  onPageSizeChange: (s: number) => void
  total: number | null
  hasNext: boolean
}

const STATUS_LABELS: Record<string, string> = {
  pending: '대기',
  approved: '승인',
  rejected: '반려',
  fulfilled: '완료',
  cancelled: '취소',
}

export function RequestsSection({
  requests,
  loading,
  query,
  onQueryChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
  page,
  onPageChange,
  pageSize,
  onPageSizeChange,
  total,
  hasNext,
}: RequestsSectionProps) {
  const columns: any[] = [
    {
      key: 'number',
      header: '요청 정보',
      render: (rq: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground">#{rq.request_number || rq.id}</span>
          <span className="text-[10px] text-muted-foreground">
            {new Date(rq.created_at).toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      key: 'materials',
      header: '품목',
      render: (rq: any) => {
        const items = rq.material_request_items || []
        const primary = items[0]?.materials?.name || '자재'
        return (
          <div className="flex flex-col">
            <span className="font-medium text-foreground">
              {primary}
              {items.length > 1 ? ` 외 ${items.length - 1}건` : ''}
            </span>
            <a
              href={`/dashboard/admin/materials/requests/${rq.id}`}
              className="text-[10px] text-blue-600 hover:underline inline-block w-fit"
            >
              상세보기
            </a>
          </div>
        )
      },
    },
    {
      key: 'requester',
      header: '요청자',
      render: (rq: any) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold">
            {rq.requester?.full_name?.charAt(0) || '?'}
          </div>
          <span className="text-sm font-medium">{rq.requester?.full_name || '-'}</span>
        </div>
      ),
    },
    {
      key: 'priority',
      header: '우선순위',
      render: (rq: any) => {
        const val = isMaterialPriorityValue(rq.priority)
          ? (rq.priority as MaterialPriorityValue)
          : null
        return val ? (
          <Badge variant={MATERIAL_PRIORITY_BADGE_VARIANTS[val]}>
            {MATERIAL_PRIORITY_LABELS[val]}
          </Badge>
        ) : (
          '-'
        )
      },
    },
    {
      key: 'status',
      header: '상태',
      render: (rq: any) => <Badge variant="outline">{STATUS_LABELS[rq.status] || rq.status}</Badge>,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-black text-foreground">자재 요청 내역</h3>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={e => onQueryChange(e.target.value)}
              placeholder="검색..."
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-gray-50 border-none text-xs"
            />
          </div>
          <select
            value={status}
            onChange={e => onStatusChange(e.target.value)}
            className="h-9 rounded-lg bg-gray-50 border-none px-3 text-xs"
          >
            <option value="all">전체 상태</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={e => onSortChange(e.target.value)}
            className="h-9 rounded-lg bg-gray-50 border-none px-3 text-xs"
          >
            <option value="date_desc">최신순</option>
            <option value="date_asc">오래된순</option>
            <option value="status">상태순</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {loading && requests.length === 0 ? (
          <div className="p-20 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <DataTable
              data={requests}
              columns={columns}
              rowKey="id"
              emptyMessage="요청 내역이 없습니다."
            />

            {/* Pagination UI */}
            <div className="p-4 border-t flex items-center justify-between bg-gray-50/30">
              <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                Total <span className="text-foreground italic">{total ?? 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => onPageChange((p: number) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs font-black min-w-[4rem] text-center">Page {page + 1}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => onPageChange((p: number) => p + 1)}
                  disabled={!hasNext}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
