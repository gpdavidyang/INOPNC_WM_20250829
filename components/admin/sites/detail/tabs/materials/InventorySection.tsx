'use client'

import DataTable, { type Column } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import StatsCard from '@/components/ui/stats-card'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'

interface InventorySectionProps {
  inventory: any[]
  stats: {
    inventory_total: number
    low_stock: number
    out_of_stock: number
  }
  loading: boolean
  query: string
  onQueryChange: (q: string) => void
  siteId: string
}

const INVENTORY_STATUS_LABELS: Record<string, string> = {
  normal: '정상',
  low: '부족',
  out: '소진',
  out_of_stock: '재고 없음',
}

const INVENTORY_STATUS_STYLES: Record<string, string> = {
  normal: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  low: 'bg-amber-50 text-amber-700 border-amber-100',
  out: 'bg-rose-50 text-rose-700 border-rose-100',
  out_of_stock: 'bg-rose-50 text-rose-700 border-rose-100',
}

export function InventorySection({
  inventory,
  stats,
  loading,
  query,
  onQueryChange,
  siteId,
}: InventorySectionProps) {
  const [sortColumn, setSortColumn] = useState<string>('updated_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const handleSort = (key: string) => {
    if (sortColumn === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(key)
      setSortDirection('desc') // default desc for new column
    }
  }

  const sortedData = useMemo(() => {
    if (!inventory) return []
    const sorted = [...inventory]
    sorted.sort((a, b) => {
      let valA, valB
      switch (sortColumn) {
        case 'material':
          valA = a.materials?.name || ''
          valB = b.materials?.name || ''
          break
        case 'current_stock':
        case 'quantity':
          valA = Number(a.quantity || 0)
          valB = Number(b.quantity || 0)
          break
        case 'updated_at':
        case 'updated':
          valA = new Date(a.last_updated || 0).getTime()
          valB = new Date(b.last_updated || 0).getTime()
          break
        default:
          return 0
      }
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [inventory, sortColumn, sortDirection])

  const exportUrl = `/api/admin/materials/export?tab=inventory&siteId=${siteId}${
    query ? `&search=${encodeURIComponent(query)}` : ''
  }`

  const columns: Column<any>[] = [
    {
      key: 'material',
      header: '자재명',
      sortable: true,
      render: (it: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground">{it.materials?.name || '-'}</span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {it.materials?.code || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'current_stock', // Match Key in HandleSort
      header: '현재 재고',
      sortable: true,
      align: 'right',
      render: (it: any) => (
        <span className="font-black italic text-base">
          {it.quantity?.toLocaleString()}{' '}
          <small className="not-italic text-[10px] text-muted-foreground uppercase">
            {it.materials?.unit || ''}
          </small>
        </span>
      ),
    },
    {
      key: 'status',
      header: '상태',
      render: (it: any) => {
        const statusKey = it.quantity <= 0 ? 'out_of_stock' : it.status || 'normal'
        return (
          <Badge
            variant="outline"
            className={INVENTORY_STATUS_STYLES[statusKey] || INVENTORY_STATUS_STYLES.normal}
          >
            {INVENTORY_STATUS_LABELS[statusKey] || statusKey}
          </Badge>
        )
      },
    },
    {
      key: 'updated_at', // Match Key in HandleSort
      header: '최근 업데이트',
      sortable: true,
      render: (it: any) => (
        <span className="text-xs text-muted-foreground">
          {it.last_updated ? new Date(it.last_updated).toLocaleDateString() : '-'}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatsCard label="관리 품목" value={stats.inventory_total} unit="종" />
        <StatsCard label="재고 부족" value={stats.low_stock} unit="건" />
        <StatsCard label="재고 없음" value={stats.out_of_stock} unit="건" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            placeholder="자재명/코드 검색..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-gray-50 border-none text-sm focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <a
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
            role="button"
            href={exportUrl}
          >
            엑셀 다운로드
          </a>
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <DataTable
            data={sortedData}
            columns={columns}
            rowKey="id"
            emptyMessage="재고 정보가 없습니다."
            onSort={handleSort}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
          />
        )}
      </div>
    </div>
  )
}
