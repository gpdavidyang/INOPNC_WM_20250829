'use client'

import { DataTable } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/use-confirm'
import { Loader2, Trash2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getDailyReportColumns } from './daily-reports/table/DailyReportColumns'
import { useDailyReportsTable } from './table/useDailyReportsTable'

export default function DailyReportsTable({ reports }: { reports: any[] }) {
  const router = useRouter()
  const sp = useSearchParams()
  const { confirm } = useConfirm()
  const { state, actions } = useDailyReportsTable(reports)

  const sortKey = (sp?.get('sort') || 'work_date') as string
  const sortDir = (sp?.get('dir') || 'desc') as 'asc' | 'desc'

  const allSelected =
    state.reportIds.length > 0 && state.selectedIds.length === state.reportIds.length

  const onSortChange = (key: string, dir: 'asc' | 'desc') => {
    const params = new URLSearchParams(sp?.toString() || '')
    params.set('sort', key)
    params.set('dir', dir)
    params.set('page', '1')
    actions.startTransition(() => router.push(`?${params.toString()}`))
  }

  const columns = getDailyReportColumns({
    selectedIds: state.selectedIds,
    onToggleSelect: id =>
      actions.setSelectedIds(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      ),
    onToggleSelectAll: () => actions.setSelectedIds(allSelected ? [] : [...state.reportIds]),
    allSelected,
    isDeleting: state.isDeleting,
    approvalLoadingId: state.approvalLoadingId,
    rejectingId: state.rejectingId,
    rejectionReason: state.rejectionReason,
    onRejectReasonChange: actions.setRejectionReason,
    onStatusChange: actions.handleStatusChange,
    onSetRejectingId: actions.setRejectingId,
    onSingleDelete: async id => {
      const ok = await confirm({
        title: '삭제 확인',
        description: '이 보고서를 삭제하시겠습니까?',
        confirmText: '삭제',
        variant: 'destructive',
      })
      if (ok) {
        try {
          const res = await fetch(`/api/admin/daily-reports/${id}`, { method: 'DELETE' })
          if (res.ok) {
            actions.setSelectedIds(prev => prev.filter(i => i !== id))
            actions.startTransition(() => router.refresh())
          }
        } catch (e) {
          console.error('[DailyReportsTable] delete failed:', e)
        }
      }
    },
    reports,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">
            작업일지 목록 ({reports.length})
          </h3>
          {state.selectedIds.length > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 transition-all">
              <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                {state.selectedIds.length}개 항목 선택됨
              </span>
              <Button
                variant="destructive"
                size="sm"
                className="h-8 rounded-lg font-black uppercase text-[10px] tracking-widest gap-2 bg-red-600 shadow-lg shadow-red-200"
                onClick={actions.handleBulkDelete}
                disabled={state.isDeleting}
              >
                {state.isDeleting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
                선택 항목 삭제
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-2xl shadow-black/5 overflow-hidden border border-gray-100">
        <DataTable
          data={reports}
          rowKey="id"
          emptyMessage="표시할 작업일지가 없습니다."
          stickyHeader
          initialSort={{ columnKey: sortKey, direction: sortDir }}
          onSortChange={onSortChange}
          columns={columns}
        />
      </div>

      {(state.isPending || state.isDeleting) && (
        <div className="fixed inset-0 z-[60] bg-white/40 backdrop-blur-[2px] pointer-events-none flex items-center justify-center">
          <div className="bg-white p-6 rounded-3xl shadow-2xl border border-gray-100 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
              요청을 처리 중입니다
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
