'use client'

import { memo } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type { DocumentWithApproval } from '@/app/actions/admin/documents'
import type { DocumentType, ApprovalStatus } from '@/types'

const TYPE_LABELS: Partial<Record<DocumentType, string>> = {
  personal: '개인 문서',
  shared: '공유 문서',
  blueprint: '도면',
  drawing: '도면',
  report: '보고서',
  certificate: '증명서',
  contract: '계약서',
  manual: '매뉴얼',
  other: '기타',
}

const APPROVAL_LABELS: Record<ApprovalStatus, string> = {
  pending: '승인 대기',
  approved: '승인 완료',
  rejected: '반려',
  cancelled: '취소됨',
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '-'
  try {
    return format(new Date(value), 'yyyy.MM.dd HH:mm')
  } catch (error) {
    return '-'
  }
}

type DocumentDetailSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  document?: DocumentWithApproval | null
  loading?: boolean
}

export const DocumentDetailSheet = memo(function DocumentDetailSheet({
  open,
  onOpenChange,
  document,
  loading = false,
}: DocumentDetailSheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">문서 상세 정보</DialogTitle>
          <DialogDescription>문서의 메타데이터와 승인 상태를 확인할 수 있습니다.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <LoadingSpinner />
        ) : !document ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            문서 정보를 불러오지 못했습니다. 다시 시도해 주세요.
          </p>
        ) : (
          <div className="space-y-6">
            <section className="space-y-2">
              <div className="text-lg font-semibold text-foreground">{document.title || document.file_name}</div>
              <div className="text-sm text-muted-foreground">{document.description || '설명 없음'}</div>
              <div className="flex flex-wrap items-center gap-2 pt-2 text-sm">
                {document.document_type && (
                  <Badge variant="secondary">{TYPE_LABELS[document.document_type] || document.document_type}</Badge>
                )}
                {document.approval_status && (
                  <Badge variant={document.approval_status === 'approved' ? 'default' : 'outline'}>
                    {APPROVAL_LABELS[document.approval_status as ApprovalStatus] || document.approval_status}
                  </Badge>
                )}
                <span className="text-muted-foreground">업로드 {formatDateTime(document.created_at)}</span>
                <span className="text-muted-foreground">수정 {formatDateTime(document.updated_at)}</span>
              </div>
            </section>

            <Separator />

            <section className="grid gap-3 md:grid-cols-2 text-sm">
              <div>
                <h3 className="font-semibold text-muted-foreground">소유자</h3>
                <div className="mt-1 font-medium text-foreground">
                  {document.owner?.full_name || '미지정'}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-muted-foreground">연결 현장</h3>
                <div className="mt-1 font-medium text-foreground">
                  {document.site?.name || '미지정'}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-muted-foreground">파일명</h3>
                <div className="mt-1 break-all text-foreground">
                  {document.file_name}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-muted-foreground">파일 크기</h3>
                <div className="mt-1 text-foreground">
                  {document.file_size ? `${(document.file_size / (1024 * 1024)).toFixed(2)} MB` : '-'}
                </div>
              </div>
            </section>

            {document.approval_status && (
              <section className="rounded-md border p-4 text-sm">
                <h3 className="font-semibold text-muted-foreground mb-2">승인 정보</h3>
                <div className="space-y-1">
                  <div>
                    상태: {APPROVAL_LABELS[document.approval_status as ApprovalStatus] || document.approval_status}
                  </div>
                  <div>요청일: {formatDateTime(document.approval_requested_at)}</div>
                  {document.requested_by && (
                    <div>
                      요청자: {document.requested_by.full_name} ({document.requested_by.email})
                    </div>
                  )}
                  {document.approval_comments && (
                    <div>비고: {document.approval_comments}</div>
                  )}
                </div>
              </section>
            )}

            <section className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                문서 다운로드는 새 탭에서 열립니다.
              </div>
              <Link
                href={document.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                다운로드
              </Link>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
})
