'use client'

import React from 'react'
import { DataTable } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { openFileRecordInNewTab } from '@/lib/files/preview'
import { REQUIRED_DOC_STATUS_LABELS, normalizeRequiredDocStatus } from '@/lib/documents/status'
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
          header: '제출일',
          sortable: true,
          accessor: (d: any) => (d?.submission_date ? new Date(d.submission_date).getTime() : 0),
          render: (d: any) =>
            d?.submission_date ? new Date(d.submission_date).toLocaleDateString('ko-KR') : '-',
        },
        {
          key: 'title',
          header: '문서명',
          sortable: true,
          accessor: (d: any) => d?.title || '',
          render: (d: any) => (
            <span className="font-medium text-foreground">{d?.title || '-'}</span>
          ),
        },
        {
          key: 'submitted_by',
          header: '제출자',
          sortable: true,
          accessor: (d: any) => d?.submitted_by?.full_name || d?.submitted_by?.email || '',
          render: (d: any) =>
            d?.submitted_by?.id ? (
              <a
                href={`/dashboard/admin/users/${d.submitted_by.id}`}
                className="underline underline-offset-2"
                title="사용자 상세"
                onClick={e => e.stopPropagation()}
              >
                {d?.submitted_by?.full_name || d?.submitted_by?.email || '-'}
              </a>
            ) : (
              d?.submitted_by?.full_name || d?.submitted_by?.email || '-'
            ),
        },
        {
          key: 'document_type',
          header: '문서 유형',
          sortable: true,
          accessor: (d: any) => d?.document_type_label || d?.document_type || '',
          render: (d: any) => d?.document_type_label || d?.document_type || '-',
        },
        {
          key: 'status',
          header: '상태',
          sortable: true,
          accessor: (d: any) => d?.status || '',
          render: (d: any) => {
            if (!d?.status) return '-'
            const normalized = normalizeRequiredDocStatus(d.status)
            return REQUIRED_DOC_STATUS_LABELS[normalized] || REQUIRED_DOC_STATUS_LABELS.pending
          },
        },
        {
          key: 'actions',
          header: '동작',
          sortable: false,
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
              <div className="flex items-center gap-2 whitespace-nowrap">
                <Button
                  type="button"
                  variant="outline"
                  size="compact"
                  className="px-2 py-1 text-sm"
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
                  열기
                </Button>
                {onApprove ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="compact"
                    className="px-2 py-1 text-sm"
                    onClick={() => actionable && onApprove(d)}
                    disabled={!actionable}
                  >
                    승인
                  </Button>
                ) : null}
                {onReject ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="compact"
                    className="px-2 py-1 text-sm"
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
