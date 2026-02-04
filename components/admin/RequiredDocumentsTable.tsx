'use client'

import { DataTable } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { REQUIRED_DOC_STATUS_LABELS, normalizeRequiredDocStatus } from '@/lib/documents/status'
import { openFileRecordInNewTab } from '@/lib/files/preview'
import { cn } from '@/lib/utils'
import { FileText, User } from 'lucide-react'
import Link from 'next/link'

type Props = {
  docs: any[]
  onOpen?: (doc: any) => void
  onApprove?: (doc: any) => void
  onReject?: (doc: any) => void
}

export default function RequiredDocumentsTable({ docs, onOpen, onApprove, onReject }: Props) {
  return (
    <DataTable
      data={docs}
      rowKey="id"
      emptyMessage="표시할 문서가 없습니다."
      stickyHeader
      columns={[
        {
          key: 'submission_date',
          header: '제출일자',
          sortable: true,
          accessor: (d: any) => (d?.submission_date ? new Date(d.submission_date).getTime() : 0),
          render: (d: any) =>
            d?.submission_date ? (
              <span className="text-gray-500 font-medium">
                {new Date(d.submission_date).toLocaleDateString('ko-KR')}
              </span>
            ) : (
              <span className="text-gray-300">-</span>
            ),
        },
        {
          key: 'title',
          header: '문서 제목',
          sortable: true,
          accessor: (d: any) => d?.title || '',
          render: (d: any) => (
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-blue-500/50" />
              <span className="font-bold text-gray-900">{d?.title || '-'}</span>
            </div>
          ),
        },
        {
          key: 'submitted_by',
          header: '제출자',
          sortable: true,
          accessor: (d: any) => d?.submitted_by?.full_name || d?.submitted_by?.email || '',
          render: (d: any) =>
            d?.submitted_by?.id ? (
              <Link
                href={`/dashboard/admin/users/${d.submitted_by.id}`}
                className="flex items-center gap-1.5 font-semibold text-gray-700 hover:text-blue-700 hover:underline underline-offset-4 transition-colors"
                onClick={e => e.stopPropagation()}
              >
                <User className="w-3 h-3 opacity-30" />
                {d?.submitted_by?.full_name || d?.submitted_by?.email || '-'}
              </Link>
            ) : (
              <span className="text-gray-500 font-medium">
                {d?.submitted_by?.full_name || d?.submitted_by?.email || '-'}
              </span>
            ),
        },
        {
          key: 'document_type',
          header: '문서 구분',
          sortable: true,
          accessor: (d: any) => d?.document_type_label || d?.document_type || '',
          render: (d: any) => (
            <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-tight">
              {d?.document_type_label || d?.document_type || '-'}
            </span>
          ),
        },
        {
          key: 'status',
          header: '처리 상태',
          sortable: true,
          accessor: (d: any) => d?.status || '',
          render: (d: any) => {
            if (!d?.status) return '-'
            const normalized = normalizeRequiredDocStatus(d.status)
            const label =
              REQUIRED_DOC_STATUS_LABELS[normalized] || REQUIRED_DOC_STATUS_LABELS.pending

            return (
              <Badge
                className={cn(
                  'rounded-lg px-2 py-0.5 text-[10px] font-bold italic uppercase transition-all whitespace-nowrap',
                  normalized === 'approved'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : normalized === 'rejected'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : normalized === 'pending'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-gray-50 text-gray-400 border-gray-200'
                )}
                variant="outline"
              >
                {label}
              </Badge>
            )
          },
        },
        {
          key: 'actions',
          header: '관리 동작',
          sortable: false,
          align: 'right',
          render: (d: any) => {
            const actionable = Boolean(d?.file_url) && (!d?.is_placeholder || !!d?.document_id)
            const fileRecord = {
              file_url: d?.file_url,
              storage_bucket: d?.storage_bucket || d?.document?.storage_bucket || undefined,
              storage_path:
                d?.storage_path ||
                d?.document?.storage_path ||
                d?.folder_path ||
                d?.document?.folder_path ||
                undefined,
              file_name: d?.file_name || d?.title,
              title: d?.title,
            }
            return (
              <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className="h-8 rounded-md border-blue-200 text-blue-700 font-medium px-3 hover:bg-blue-50"
                  onClick={() => {
                    if (!d?.file_url) return
                    if (onOpen) onOpen(d)
                    else {
                      openFileRecordInNewTab(fileRecord).catch(error => {
                        console.error('Failed to open document', error)
                        window.open(d.file_url, '_blank')
                      })
                    }
                  }}
                  disabled={!d?.file_url}
                >
                  미리보기
                </Button>
                {onApprove && d?.status === 'pending' ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    className="h-8 rounded-md border-emerald-200 text-emerald-700 font-medium px-3 hover:bg-emerald-50"
                    onClick={() => actionable && onApprove(d)}
                    disabled={!actionable}
                  >
                    승인
                  </Button>
                ) : null}
                {onReject && d?.status === 'pending' ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    className="h-8 rounded-md border-rose-200 text-rose-700 font-medium px-3 hover:bg-rose-50"
                    onClick={() => actionable && onReject(d)}
                    disabled={!actionable}
                  >
                    반려
                  </Button>
                ) : null}
              </div>
            )
          },
        },
      ]}
    />
  )
}
