'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Loader2, RotateCcw, X } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = {
  draft: '임시',
  submitted: '제출',
  approved: '승인',
  rejected: '반려',
  completed: '완료',
  revision: '수정 필요',
  archived: '보관됨',
}

const renderStatus = (value?: string | null) => {
  if (!value) return '-'
  return STATUS_LABEL[value] || value
}

const formatDate = (value?: string) => {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString('ko-KR')
  } catch {
    return value
  }
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
  showEditGuidance,
}: ReportHeaderProps) {
  return (
    <CardHeader className="space-y-2 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <span>{siteName || '-'}</span>
            <Badge
              variant="outline"
              className="px-2 py-0.5 text-[11px] font-bold whitespace-nowrap"
            >
              {renderStatus(status)}
            </Badge>
          </CardTitle>
          <CardDescription>{formatDate(workDate)}</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {status === 'rejected' && rejectionReason && (
            <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-1 text-xs text-rose-700">
              반려 사유: {rejectionReason}
            </div>
          )}

          {status === 'submitted' && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={approvalLoading || rejecting}
                onClick={() => onStatusChange('approve')}
              >
                {approvalLoading && !rejecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                승인
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={approvalLoading}
                onClick={() => setRejecting(!rejecting)}
              >
                <X className="mr-2 h-4 w-4" />
                반려
              </Button>
            </div>
          )}

          {(status === 'approved' || status === 'rejected') && (
            <Button
              variant="outline"
              size="sm"
              disabled={approvalLoading}
              onClick={() => onStatusChange('revert')}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              상태 초기화
            </Button>
          )}

          {canEditReport && editHref ? (
            <Button asChild size="sm" className="bg-[#1A254F] text-white hover:bg-[#111836]">
              <a href={editHref}>작업일지 수정</a>
            </Button>
          ) : null}
        </div>
      </div>
      {showEditGuidance && (
        <p className="text-xs text-muted-foreground">
          제출·반려 상태에서도 수정 후 다시 제출할 수 있습니다.
        </p>
      )}
    </CardHeader>
  )
}
