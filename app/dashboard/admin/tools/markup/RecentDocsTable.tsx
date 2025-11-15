'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import DataTable, { type Column } from '@/components/admin/DataTable'
import { buttonVariants } from '@/components/ui/button'

export default function RecentDocsTable({ docs }: { docs: any[] }) {
  const router = useRouter()

  const resolveSource = (doc: any) => {
    if (doc?.source === 'shared') return 'shared'
    if (typeof doc?.id === 'string' && doc.id.startsWith('shared-')) return 'shared'
    return 'markup'
  }

  const getUnifiedDocumentId = (doc: any) => {
    if (!doc) return undefined
    if (doc.unified_document_id) return doc.unified_document_id
    if (doc.unifiedId) return doc.unifiedId
    if (doc.source_document_id) return doc.source_document_id
    if (typeof doc.id === 'string' && doc.id.startsWith('shared-')) {
      return doc.id.replace('shared-', '')
    }
    return undefined
  }

  const getActionLabel = (doc: any) => (resolveSource(doc) === 'shared' ? '열기' : '수정')

  const buildEditHref = (doc: any): string | undefined => {
    if (resolveSource(doc) === 'shared') {
      if (!doc?.original_blueprint_url) return undefined
      const params = new URLSearchParams()
      params.set('blueprintUrl', doc.original_blueprint_url)
      if (doc?.title) params.set('title', doc.title)
      if (doc?.site_id) params.set('siteId', doc.site_id)
      const unifiedId = getUnifiedDocumentId(doc)
      if (unifiedId) params.set('unifiedDocumentId', unifiedId)
      params.set('startEmpty', '1')
      return `/dashboard/admin/tools/markup?${params.toString()}`
    }
    if (!doc?.id) return undefined
    return `/dashboard/admin/tools/markup?docId=${doc.id}`
  }

  const buildSiteLabel = (doc: any) => doc?.site?.name || '-'

  const buildSiteHref = (doc: any) => {
    const siteId = doc?.site?.id || doc?.site_id
    return siteId ? `/dashboard/admin/sites/${siteId}` : undefined
  }

  const handleDelete = async (doc: any) => {
    if (!doc) return
    const source = resolveSource(doc)
    const targetId =
      source === 'shared' ? getUnifiedDocumentId(doc) : (doc?.id as string | undefined)
    if (!targetId) {
      alert('문서 식별자를 확인할 수 없습니다.')
      return
    }
    const ok = window.confirm('해당 문서를 삭제하시겠습니까?')
    if (!ok) return
    try {
      const endpoint =
        source === 'shared'
          ? `/api/unified-documents/${targetId}`
          : `/api/markup-documents/${targetId}`
      const res = await fetch(endpoint, { method: 'DELETE' })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || j?.error) throw new Error(j?.error || '삭제 실패')
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : '삭제 중 오류가 발생했습니다.')
    }
  }

  const formatDailyReportStatus = (status?: string | null) => {
    if (!status) return '상태 미정'
    const map: Record<string, string> = {
      submitted: '제출 완료',
      draft: '임시 저장',
      saved: '임시 저장',
      pending: '검토 중',
      approved: '승인 완료',
      rejected: '반려',
    }
    const normalized = status.toLowerCase()
    return map[normalized] || status
  }

  const formatDailyReportLabel = (log?: any | null) => {
    if (!log) return '미연결'
    const dateLabel = log.work_date
      ? new Date(log.work_date).toLocaleDateString('ko-KR')
      : '날짜 미정'
    const memberLabel = log.member_name || '작성자 미상'
    const statusLabel = formatDailyReportStatus(log.status)
    return `${dateLabel} · ${memberLabel} · ${statusLabel}`
  }

  return (
    <DataTable<any>
      data={docs}
      rowKey="id"
      stickyHeader
      emptyMessage="표시할 문서가 없습니다."
      initialSort={{ columnKey: 'created_at', direction: 'desc' }}
      columns={
        [
          {
            key: 'created_at',
            header: '생성일',
            sortable: true,
            accessor: (d: any) => (d?.created_at ? new Date(d.created_at).getTime() : 0),
            render: (d: any) =>
              d?.created_at ? new Date(d.created_at).toLocaleString('ko-KR') : '-',
            width: 180,
          },
          {
            key: 'title',
            header: '제목',
            sortable: true,
            accessor: (d: any) => d?.title || '',
            render: (d: any) => (
              <span className="font-medium text-foreground">{d?.title || '-'}</span>
            ),
          },
          {
            key: 'site',
            header: '현장',
            sortable: true,
            accessor: (d: any) => d?.site?.name || '',
            render: (d: any) => {
              const label = buildSiteLabel(d)
              const href = buildSiteHref(d)
              return href ? (
                <Link href={href} className="text-blue-600 hover:underline">
                  {label}
                </Link>
              ) : (
                label
              )
            },
            width: 140,
          },
          {
            key: 'daily_report',
            header: '작업일지',
            sortable: true,
            accessor: (d: any) =>
              d?.daily_report?.work_date ? new Date(d.daily_report.work_date).getTime() : 0,
            render: (d: any) => formatDailyReportLabel(d?.daily_report),
            width: 240,
            className: 'whitespace-nowrap',
          },
          {
            key: 'creator',
            header: '작성자',
            sortable: true,
            accessor: (d: any) => d?.creator?.full_name || d?.creator?.email || '',
            render: (d: any) => d?.creator?.full_name || d?.creator?.email || '-',
            width: 140,
          },
          {
            key: 'actions',
            header: '작업',
            render: (d: any) => (
              <div className="flex items-center gap-1 whitespace-nowrap">
                {(() => {
                  const href = buildEditHref(d)
                  const label = getActionLabel(d)
                  if (!href) {
                    return (
                      <span
                        className={buttonVariants({
                          variant: 'secondary',
                          size: 'compact',
                        })}
                        aria-disabled="true"
                      >
                        {label}
                      </span>
                    )
                  }
                  return (
                    <Link
                      href={href}
                      className={buttonVariants({ variant: 'secondary', size: 'compact' })}
                      role="button"
                    >
                      {label}
                    </Link>
                  )
                })()}
                <button
                  onClick={() => handleDelete(d)}
                  className={buttonVariants({ variant: 'destructive', size: 'compact' })}
                >
                  삭제
                </button>
              </div>
            ),
            width: 240,
          },
        ] as Column<any>[]
      }
    />
  )
}
