'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { AlertCircle, Calendar, Loader2, MapPin, RotateCcw } from 'lucide-react'

const STATUS_META: Record<
  string,
  { label: string; color: string; variant: 'default' | 'outline' | 'secondary' | 'destructive' }
> = {
  draft: {
    label: '임시 저장',
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    variant: 'outline',
  },
  submitted: {
    label: '결재 대기',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    variant: 'secondary',
  },
  approved: {
    label: '최종 승인',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    variant: 'default',
  },
  rejected: {
    label: '반려됨',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    variant: 'destructive',
  },
}

interface ReportHeaderProps {
  siteName: string
  workDate: string
  status: string
  rejectionReason?: string | null
  approvalLoading: boolean
  rejecting: boolean
  setRejecting: (val: boolean) => void
  onStatusChange: (action: 'approve' | 'revert' | 'reject', reason?: string) => void
  canEditReport: boolean
  editHref: string | null
  markupHref?: string | null
  showEditGuidance: boolean
}

export function ReportHeader({
  siteName,
  workDate,
  status,
  rejectionReason,
  approvalLoading,
  rejecting,
  setRejecting,
  onStatusChange,
  canEditReport,
  editHref,
  markupHref,
  showEditGuidance,
}: ReportHeaderProps) {
  const meta = STATUS_META[status.toLowerCase()] || {
    label: status,
    color: 'bg-gray-100 text-gray-600',
    variant: 'outline',
  }
  const isApproved = status.toLowerCase() === 'approved'
  const isRejected = status.toLowerCase() === 'rejected'
  const isSubmitted = status.toLowerCase() === 'submitted'

  return (
    <div className="relative overflow-hidden bg-white border-b p-5 sm:px-8 sm:py-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md border-none shadow-none',
                meta.color
              )}
            >
              • {meta.label}
            </Badge>
            {isRejected && rejectionReason && (
              <div className="bg-rose-50 text-rose-600 text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-rose-100 flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3" />
                반려: {rejectionReason}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">
              {siteName}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-muted-foreground/50 tracking-tight">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                <span className="text-gray-500 font-bold">
                  {workDate ? format(new Date(workDate), 'yyyy. MM. dd') : '-'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3" />
                <span>본사 관리 시스템</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isSubmitted && (
            <>
              <Button
                onClick={() => onStatusChange('approve')}
                disabled={approvalLoading || rejecting}
                className="bg-[#1A254F] text-white hover:bg-black rounded-lg h-9 px-4 font-bold text-xs gap-1.5 whitespace-nowrap shadow-sm transition-all"
              >
                {approvalLoading && !rejecting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                승인
              </Button>
              <Button
                variant="outline"
                onClick={() => setRejecting(!rejecting)}
                disabled={approvalLoading}
                className={cn(
                  'rounded-lg h-9 px-4 font-bold text-xs gap-1.5 border-gray-200 whitespace-nowrap',
                  rejecting
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                )}
              >
                반려
              </Button>
            </>
          )}

          {(isApproved || isRejected) && (
            <Button
              variant="outline"
              onClick={() => onStatusChange('revert')}
              disabled={approvalLoading}
              className="bg-white hover:bg-gray-50 text-gray-400 rounded-lg h-9 px-3.5 font-bold text-xs gap-1.5 whitespace-nowrap border-gray-200 transition-all shadow-sm"
            >
              <RotateCcw className={cn('w-3 h-3', approvalLoading && 'animate-spin')} />
              상태 초기화
            </Button>
          )}
        </div>
      </div>

      {showEditGuidance && (
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-2.5 flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <p className="text-[11px] font-bold text-blue-700 tracking-tight">
            현재 {isRejected ? '반려' : '제출'} 상태입니다. 내용 수정 후 다시 제출 시 결재
            프로세스가 초기화됩니다.
          </p>
        </div>
      )}
    </div>
  )
}
