'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Calendar, Check, Loader2, MapPin, Pencil, RotateCcw, X } from 'lucide-react'

const STATUS_META: Record<
  string,
  { label: string; color: string; variant: 'default' | 'outline' | 'secondary' | 'destructive' }
> = {
  draft: {
    label: '임시 저장',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    variant: 'outline',
  },
  submitted: {
    label: '결재 대기',
    color: 'bg-blue-50 text-blue-700 border-blue-100',
    variant: 'secondary',
  },
  approved: {
    label: '최종 승인',
    color: 'bg-emerald-500 text-white border-emerald-500',
    variant: 'default',
  },
  rejected: {
    label: '반려됨',
    color: 'bg-rose-500 text-white border-rose-500',
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
    color: 'bg-gray-100',
    variant: 'outline',
  }
  const isApproved = status.toLowerCase() === 'approved'
  const isRejected = status.toLowerCase() === 'rejected'
  const isSubmitted = status.toLowerCase() === 'submitted'

  return (
    <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl border-b p-6 sm:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant={meta.variant}
              className={cn(
                'text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-sm',
                meta.color
              )}
            >
              {meta.label}
            </Badge>
            {isRejected && rejectionReason && (
              <div className="bg-rose-50 text-rose-700 text-[10px] font-bold px-3 py-0.5 rounded-full border border-rose-100 animate-in fade-in slide-in-from-left-2">
                반려 사유: {rejectionReason}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
              {siteName}
              <div className="hidden sm:block h-6 w-px bg-gray-200" />
              <span className="text-muted-foreground/40 font-light hidden sm:inline">
                Daily Report
              </span>
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-muted-foreground uppercase tracking-wider opacity-60">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />{' '}
                {workDate ? format(new Date(workDate), 'yyyy년 MM월 dd일') : '-'}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> INOPNC SITE SYSTEM
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isSubmitted && (
            <>
              <Button
                onClick={() => onStatusChange('approve')}
                disabled={approvalLoading || rejecting}
                className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-2xl h-11 px-6 font-black gap-2 shadow-lg shadow-emerald-500/20"
              >
                {approvalLoading && !rejecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                승인 완료
              </Button>
              <Button
                variant="outline"
                onClick={() => setRejecting(!rejecting)}
                disabled={approvalLoading}
                className={cn(
                  'rounded-2xl h-11 px-6 font-black gap-2 border-2',
                  rejecting
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                )}
              >
                <X className="w-4 h-4" />
                반려 처리
              </Button>
            </>
          )}

          {(isApproved || isRejected) && (
            <Button
              variant="ghost"
              onClick={() => onStatusChange('revert')}
              disabled={approvalLoading}
              className="rounded-2xl h-11 px-6 font-black gap-2 text-muted-foreground hover:bg-gray-100"
            >
              <RotateCcw className={cn('w-4 h-4', approvalLoading && 'animate-spin')} />
              상태 초기화
            </Button>
          )}

          {canEditReport && editHref && (
            <Button
              asChild
              className="bg-blue-600 text-white hover:bg-blue-700 rounded-2xl h-11 px-8 font-black gap-2 shadow-lg shadow-blue-500/20"
            >
              <a href={editHref}>
                <Pencil className="w-4 h-4" /> 일지 편집
              </a>
            </Button>
          )}
        </div>
      </div>

      {showEditGuidance && (
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-2 flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <p className="text-[11px] font-bold text-blue-700 uppercase tracking-tight">
            현재 {isRejected ? '반려' : '제출'} 상태입니다. 내용 수정 후 다시 제출 시 결재
            프로세스가 초기화됩니다.
          </p>
        </div>
      )}
    </div>
  )
}
