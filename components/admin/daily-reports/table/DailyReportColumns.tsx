'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import {
  STATUS_META,
  formatManhours,
  formatMemberTypes,
  resolveAuthorLabel,
} from './daily-report-helpers'

interface ColumnProps {
  selectedIds: string[]
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  allSelected: boolean
  isDeleting: boolean
  approvalLoadingId: string | null
  rejectingId: string | null
  rejectionReason: string
  onRejectReasonChange: (val: string) => void
  onStatusChange: (id: string, action: any, reason?: string) => void
  onSetRejectingId: (id: string | null) => void
  onSingleDelete: (id: string) => void
  reports: any[]
}

export function getDailyReportColumns({
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  allSelected,
  isDeleting,
  approvalLoadingId,
  rejectingId,
  rejectionReason,
  onRejectReasonChange,
  onStatusChange,
  onSetRejectingId,
  onSingleDelete,
  reports,
}: ColumnProps) {
  return [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-600"
          disabled={reports.length === 0 || isDeleting}
          checked={allSelected}
          onChange={onToggleSelectAll}
        />
      ),
      align: 'center',
      width: 40,
      render: (r: any) => (
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-600"
          disabled={isDeleting}
          checked={selectedIds.includes(String(r.id))}
          onChange={() => onToggleSelect(String(r.id))}
        />
      ),
    },
    {
      key: 'work_date',
      header: '작업일자',
      sortable: true,
      render: (r: any) => (
        <a
          href={`/dashboard/admin/daily-reports/${r.id}`}
          className="font-bold text-blue-600 hover:text-blue-800 transition-colors"
        >
          {new Date(r.work_date || r.report_date).toLocaleDateString('ko-KR')}
        </a>
      ),
      width: 120,
    },
    {
      key: 'site_name',
      header: '현장명',
      sortable: true,
      render: (r: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-gray-900">{r?.sites?.name || r?.site?.name || '-'}</span>
          <span className="text-[11px] text-gray-400 truncate max-w-[200px]">
            {r?.sites?.address || r?.site?.address || '-'}
          </span>
        </div>
      ),
      width: 250,
    },
    {
      key: 'organization',
      header: '소속',
      render: (r: any) => (
        <span className="text-gray-600 font-medium">{r?.organization?.name || '-'}</span>
      ),
      width: 150,
    },
    {
      key: 'component_name',
      header: '부재명',
      render: (r: any) => (
        <span className="truncate block font-medium">{formatMemberTypes(r) || '-'}</span>
      ),
      width: 180,
    },
    {
      key: 'author',
      header: '작성자',
      render: (r: any) => <span className="font-semibold">{resolveAuthorLabel(r)}</span>,
      width: 120,
    },
    {
      key: 'status',
      header: '상태',
      render: (r: any) => {
        const meta = STATUS_META[r?.status as keyof typeof STATUS_META] || {
          label: r?.status || '미정',
          className: 'bg-gray-100',
        }
        return (
          <Badge
            variant="outline"
            className={cn('rounded-full px-3 py-0.5 font-bold border-none', meta.className)}
          >
            {meta.label}
          </Badge>
        )
      },
      width: 100,
    },
    {
      key: 'total_manhours',
      header: '총공수',
      align: 'right',
      render: (r: any) => (
        <span className="font-black italic text-gray-900">{formatManhours(r?.total_manhours)}</span>
      ),
      width: 80,
    },
    {
      key: 'actions',
      header: '관리',
      align: 'left',
      width: 280,
      render: (r: any) => {
        const rid = String(r.id)
        const isRejecting = rejectingId === rid
        const isLoading = approvalLoadingId === rid

        return (
          <div className="flex flex-col gap-2">
            <div className="flex gap-1.5">
              <Button
                asChild
                variant="secondary"
                size="xs"
                className="h-8 rounded-md font-normal px-4"
              >
                <a href={`/dashboard/admin/daily-reports/${r.id}`}>상세</a>
              </Button>
              <Button
                variant="ghost"
                size="xs"
                className="h-8 rounded-md font-normal text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-4 border border-rose-200"
                onClick={() => onSingleDelete(rid)}
              >
                삭제
              </Button>

              {r?.status === 'submitted' && (
                <>
                  <Button
                    variant="default"
                    size="xs"
                    className="h-8 rounded-md font-normal bg-emerald-600 hover:bg-emerald-700 text-white px-4"
                    disabled={isLoading}
                    onClick={() => onStatusChange(rid, 'approve')}
                  >
                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : '승인'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="xs"
                    className="h-8 rounded-md font-normal px-4"
                    disabled={isLoading}
                    onClick={() => onSetRejectingId(isRejecting ? null : rid)}
                  >
                    반려
                  </Button>
                </>
              )}

              {(r?.status === 'approved' || r?.status === 'rejected') && (
                <Button
                  variant="outline"
                  size="xs"
                  className="h-8 rounded-md font-normal px-4"
                  onClick={() => onStatusChange(rid, 'revert')}
                >
                  초기화
                </Button>
              )}
            </div>

            {isRejecting && (
              <div className="mt-1 p-3 rounded-xl bg-gray-50 border border-gray-200 animate-in slide-in-from-top-2 duration-300">
                <textarea
                  className="w-full text-xs p-2 rounded-lg border border-gray-300 focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  placeholder="반려 사유 입력"
                  value={rejectionReason}
                  onChange={e => onRejectReasonChange(e.target.value)}
                  rows={2}
                />
                <div className="flex justify-end gap-1 mt-2">
                  <Button
                    size="xs"
                    variant="ghost"
                    className="h-7 text-[11px]"
                    onClick={() => onSetRejectingId(null)}
                  >
                    취소
                  </Button>
                  <Button
                    size="xs"
                    className="h-7 text-[11px] bg-red-600"
                    onClick={() => onStatusChange(rid, 'reject', rejectionReason)}
                  >
                    확정
                  </Button>
                </div>
              </div>
            )}
          </div>
        )
      },
    },
  ]
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
