'use client'

import DataTable from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ExternalLink, Search } from 'lucide-react'

interface ShipmentsSectionProps {
  shipments: any[]
  loading: boolean
  query: string
  onQueryChange: (q: string) => void
}

const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  pending: '대기',
  shipped: '배송중',
  delivered: '완료',
  cancelled: '취소',
}

export function ShipmentsSection({
  shipments,
  loading,
  query,
  onQueryChange,
}: ShipmentsSectionProps) {
  const columns: any[] = [
    {
      key: 'number',
      header: '배송 번호',
      render: (s: any) => (
        <a
          href={`/dashboard/admin/materials/shipments/${s.id}`}
          className="flex items-center gap-1.5 font-bold text-blue-600 hover:underline"
        >
          #{s.shipment_number || s.id}
          <ExternalLink className="w-3 h-3" />
        </a>
      ),
    },
    {
      key: 'items',
      header: '배송 품목',
      render: (s: any) => {
        const items = s.shipment_items || []
        return (
          <div className="flex flex-col">
            <span className="font-medium text-foreground">
              {items[0]?.materials?.name || '-'}{' '}
              {items.length > 1 ? ` 외 ${items.length - 1}건` : ''}
            </span>
            <span className="text-[10px] text-muted-foreground italic">
              총 {items.reduce((acc: number, cur: any) => acc + (cur.quantity || 0), 0)} 단위
            </span>
          </div>
        )
      },
    },
    {
      key: 'date',
      header: '배송 예정/완료일',
      render: (s: any) => (
        <span className="text-xs">
          {s.shipment_date ? new Date(s.shipment_date).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      key: 'status',
      header: '배송 상태',
      render: (s: any) => (
        <Badge variant={s.status === 'delivered' ? 'default' : 'outline'}>
          {SHIPMENT_STATUS_LABELS[s.status] || s.status}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-foreground">자재 반입(배송) 내역</h3>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            placeholder="배송번호 검색..."
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
            data={shipments}
            columns={columns}
            rowKey="id"
            emptyMessage="배송 내역이 없습니다."
          />
        )}
      </div>
    </div>
  )
}
