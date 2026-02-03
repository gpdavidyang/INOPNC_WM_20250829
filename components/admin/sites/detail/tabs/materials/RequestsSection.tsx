'use client'

import DataTable from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import StatsCard from '@/components/ui/stats-card'
import {
  isMaterialPriorityValue,
  MATERIAL_PRIORITY_BADGE_VARIANTS,
  MATERIAL_PRIORITY_LABELS,
  MaterialPriorityValue,
  normalizeMaterialPriority,
} from '@/lib/materials/priorities'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useMemo } from 'react'

// --- Helpers from B Page ---
const numberFormatter = new Intl.NumberFormat('ko-KR')

function summarizeMaterial(items: any[]): string {
  if (!Array.isArray(items) || items.length === 0) return '-'
  const primary = items[0]
  // Handle various shapes of item data (from relation or raw content)
  const baseLabel =
    primary.materials?.name || primary.material_name || primary.material_code || '자재'
  return items.length > 1 ? `${baseLabel} 외 ${items.length - 1}건` : baseLabel
}

function summarizeQuantity(items: any[]): string {
  if (!Array.isArray(items) || items.length === 0) return '-'
  const total = items.reduce(
    (sum: number, item: any) => sum + Number(item.requested_quantity ?? 0),
    0
  )
  if (!total) return '-'
  // Unit check
  const unit = items.length === 1 ? items[0]?.materials?.unit || items[0]?.unit || '' : ''
  const formatted = numberFormatter.format(total)
  return unit ? `${formatted} ${unit}` : formatted
}

const PRIORITY_NOTE_TAG_REGEX =
  /^\s*\[(?:낮음|보통|높음|긴급|일반|최우선|low|normal|high|urgent)\]\s*/i

function cleanPriorityNote(note?: string | null): string {
  if (!note) return ''
  return note.replace(PRIORITY_NOTE_TAG_REGEX, '').trim()
}
// --------------------------

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
  // Calculate stats locally from the current page/dataset or if we had full dataset.
  // Note: 'requests' here might be paginated. The B page calculates stats from the 'requests' array passed to it.
  // If 'requests' is only 1 page, stats are only for that page.
  // ideally we should get stats from backend, but for now we follow B page pattern (which seems to do it on the fly or receives it).
  // The B page code: `requests.reduce(...)`.
  // Wait, B page 'requests' seems to be the current page list. So the stats might be limited to current page?
  // Actually B Page `getMaterialRequests` likely returns paginated data.
  // The user request said "same implementation".
  // Let's implement the stats calculation on the `requests` prop which mimics B page behavior.

  // Stats Logic (Local)
  const stats = useMemo(() => {
    const totalReq = requests.length

    const totalRequestQuantity = requests.reduce((sum, rq) => {
      const items = Array.isArray(rq.items)
        ? rq.items
        : Array.isArray(rq.material_request_items)
          ? rq.material_request_items
          : []
      const itemSum = items.reduce(
        (acc: number, item: any) => acc + Number(item?.requested_quantity ?? 0),
        0
      )
      return sum + itemSum
    }, 0)

    const priorityCounts: Record<MaterialPriorityValue, number> = {
      low: 0,
      normal: 0,
      high: 0,
      urgent: 0,
    }
    requests.forEach(rq => {
      const priority = normalizeMaterialPriority(rq?.priority)
      priorityCounts[priority] += 1
    })

    return { totalReq, totalRequestQuantity, priorityCounts }
  }, [requests])

  const columns: any[] = [
    {
      key: 'materials',
      header: '자재명',
      render: (rq: any) => {
        // Use helper to summarize
        const items = rq.material_request_items || rq.items || []
        return <span className="font-medium text-foreground">{summarizeMaterial(items)}</span>
      },
    },
    {
      key: 'quantity',
      header: '요청수량',
      align: 'right',
      render: (rq: any) => {
        const items = rq.material_request_items || rq.items || []
        return <span className="font-bold">{summarizeQuantity(items)}</span>
      },
    },
    {
      key: 'requester',
      header: '요청자',
      render: (rq: any) => (
        <div className="flex items-center gap-2">
          {/* Link to user if possible, or just text */}
          <span className="text-sm font-medium">
            {rq.requester?.full_name || rq.requested_by || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'date',
      header: '요청일',
      render: (rq: any) => (
        <span className="text-sm">
          {rq.request_date ? new Date(rq.request_date).toLocaleDateString('ko-KR') : '-'}
        </span>
      ),
    },
    {
      key: 'priority',
      header: '긴급도',
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
      key: 'notes',
      header: '비고',
      render: (rq: any) => {
        const note = cleanPriorityNote(rq.note || rq.notes)
        return (
          <span className="text-xs text-muted-foreground truncate max-w-[200px] block" title={note}>
            {note || '-'}
          </span>
        )
      },
    },
  ]

  const priorityOrder: MaterialPriorityValue[] = ['urgent', 'high', 'normal', 'low']

  return (
    <div className="space-y-4">
      {/* Functionally identical stats cards to B page */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <StatsCard label="요청건수" value={stats.totalReq} unit="건" />
        <StatsCard label="요청수량" value={stats.totalRequestQuantity} unit="ea" />
        {priorityOrder.map(priority => (
          <StatsCard
            key={priority}
            label={`긴급도 (${MATERIAL_PRIORITY_LABELS[priority]})`}
            value={stats.priorityCounts[priority]}
            unit="건"
          />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-6">
        <div className="flex flex-wrap items-end gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={e => onQueryChange(e.target.value)}
              placeholder="검색..."
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-gray-50 border-none text-xs"
            />
          </div>

          {/* Priority Filter (Visual for now) */}
          <CustomSelect value="all">
            <CustomSelectTrigger className="h-9 rounded-lg bg-gray-50 border-none px-3 text-xs w-28">
              <CustomSelectValue placeholder="전체 긴급도" />
            </CustomSelectTrigger>
            <CustomSelectContent>
              <CustomSelectItem value="all">전체 긴급도</CustomSelectItem>
              {/* Hardcoded options for UI match - logic pending hook update */}
              <CustomSelectItem value="urgent">긴급</CustomSelectItem>
            </CustomSelectContent>
          </CustomSelect>

          <Button variant="outline" size="sm" className="h-9">
            적용
          </Button>
          <Button variant="ghost" size="sm" className="h-9">
            초기화
          </Button>

          {/* Excel */}
          <a
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
            role="button"
            href={`/api/admin/materials/export?tab=requests${query ? `&search=${encodeURIComponent(query)}` : ''}`}
          >
            엑셀 다운로드
          </a>
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
                전체 <span className="text-foreground italic">{total ?? 0}</span>
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
                <span className="text-xs font-black min-w-[4rem] text-center">
                  페이지 {page + 1}
                </span>
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
