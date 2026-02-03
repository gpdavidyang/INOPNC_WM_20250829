'use client'

import DataTable from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Search } from 'lucide-react'

interface InventorySectionProps {
  inventory: any[]
  loading: boolean
  query: string
  onQueryChange: (q: string) => void
  siteId: string
}

const INVENTORY_STATUS_LABELS: Record<string, string> = {
  normal: '정상',
  low: '부족',
  out: '소진',
}

const INVENTORY_STATUS_STYLES: Record<string, string> = {
  normal: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  low: 'bg-amber-50 text-amber-700 border-amber-100',
  out: 'bg-rose-50 text-rose-700 border-rose-100',
}

export function InventorySection({
  inventory,
  loading,
  query,
  onQueryChange,
  siteId,
}: InventorySectionProps) {
  const columns: any[] = [
    {
      key: 'material',
      header: '자재명',
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
      key: 'quantity',
      header: '현재 재고',
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
      key: 'minimum',
      header: '최소 재고',
      align: 'right',
      render: (it: any) => (
        <span className="font-bold text-muted-foreground">
          {it.minimum_stock?.toLocaleString() || '-'}
        </span>
      ),
    },
    {
      key: 'status',
      header: '상태',
      render: (it: any) => (
        <Badge variant="outline" className={INVENTORY_STATUS_STYLES[it.status] || ''}>
          {INVENTORY_STATUS_LABELS[it.status] || it.status}
        </Badge>
      ),
    },
    {
      key: 'updated',
      header: '최근 업데이트',
      render: (it: any) => (
        <span className="text-xs text-muted-foreground">
          {it.last_updated ? new Date(it.last_updated).toLocaleDateString() : '-'}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-foreground">현장 재고 현황</h3>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            placeholder="자재명/코드 검색..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-gray-50 border-none text-sm focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <DataTable
            data={inventory}
            columns={columns}
            rowKey="id"
            emptyMessage="재고 정보가 없습니다."
          />
        )}
      </div>
    </div>
  )
}
