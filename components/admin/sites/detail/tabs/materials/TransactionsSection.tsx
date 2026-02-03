'use client'

import DataTable from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

interface TransactionsSectionProps {
  transactions: any[]
  loading: boolean
  query: string
  onQueryChange: (q: string) => void
  page: number
  onPageChange: (p: any) => void
  pageSize: number
  onPageSizeChange: (s: number) => void
  total: number | null
  hasNext: boolean
}

const TX_TYPE_LABELS: Record<string, string> = {
  incoming: '반입',
  outgoing: '반출/사용',
  adjustment: '조정',
  return: '회수',
}

const TX_TYPE_STYLES: Record<string, string> = {
  incoming: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  outgoing: 'bg-blue-50 text-blue-700 border-blue-100',
  adjustment: 'bg-amber-50 text-amber-700 border-amber-100',
  return: 'bg-rose-50 text-rose-700 border-rose-100',
}

export function TransactionsSection({
  transactions,
  loading,
  query,
  onQueryChange,
  page,
  onPageChange,
  pageSize,
  onPageSizeChange,
  total,
  hasNext,
}: TransactionsSectionProps) {
  const columns: any[] = [
    {
      key: 'date',
      header: '일시',
      render: (tx: any) => (
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
          {tx.transaction_date ? new Date(tx.transaction_date).toLocaleString() : '-'}
        </span>
      ),
    },
    {
      key: 'type',
      header: '구분',
      render: (tx: any) => (
        <Badge
          variant="outline"
          className={`${TX_TYPE_STYLES[tx.transaction_type] || ''} whitespace-nowrap`}
        >
          {TX_TYPE_LABELS[tx.transaction_type] || tx.transaction_type}
        </Badge>
      ),
    },
    {
      key: 'material',
      header: '자재',
      render: (tx: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground">{tx.materials?.name || '-'}</span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {tx.materials?.code || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: '수량',
      align: 'right',
      render: (tx: any) => (
        <span
          className={`font-black italic ${tx.transaction_type === 'incoming' ? 'text-emerald-600' : 'text-foreground'}`}
        >
          {tx.transaction_type === 'outgoing' ? '-' : '+'}
          {Math.abs(tx.quantity).toLocaleString()}
          <small className="not-italic ml-1 text-[10px] text-muted-foreground uppercase">
            {tx.materials?.unit}
          </small>
        </span>
      ),
    },
    {
      key: 'reference',
      header: '참조',
      render: (tx: any) => {
        if (tx.reference_type === 'shipment') {
          return (
            <a
              href={`/dashboard/admin/materials/shipments/${tx.reference_id}`}
              className="text-[10px] text-blue-600 hover:underline"
            >
              배정/{tx.reference_id}
            </a>
          )
        }
        if (tx.reference_type === 'work_log') {
          return (
            <a
              href={`/dashboard/admin/daily-reports/${tx.reference_id}`}
              className="text-[10px] text-blue-600 hover:underline"
            >
              작업일지/{tx.reference_id}
            </a>
          )
        }
        return <span className="text-[10px] text-muted-foreground">{tx.notes || '-'}</span>
      },
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-black text-foreground">자재 변동 이력 (트랜잭션)</h3>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={e => onQueryChange(e.target.value)}
            placeholder="자재 검색..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-gray-50 border-none text-sm focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {loading && transactions.length === 0 ? (
          <div className="p-20 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <DataTable
              data={transactions}
              columns={columns}
              rowKey="id"
              emptyMessage="변동 이력이 없습니다."
            />

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
