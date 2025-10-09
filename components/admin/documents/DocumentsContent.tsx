'use client'

import { useCallback, useMemo, useState } from 'react'
import { RefreshCw, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import StatsCard from '@/components/ui/stats-card'
import DataTable, { type Column } from '@/components/admin/DataTable'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type { DocumentWithApproval } from '@/app/actions/admin/documents'
import type { ApprovalStatus } from '@/types'
import type { DocumentType } from '@/types/documents'
import { DocumentDetailSheet } from './DocumentDetailSheet'
import { t } from '@/lib/ui/strings'

interface DocumentsContentProps {
  initialDocuments: DocumentWithApproval[]
  initialTotal: number
  initialPages: number
  pageSize: number
  initialLoadErrored?: boolean
}

type DocumentFilterOption = 'all' | DocumentType
type ApprovalFilterOption = 'all' | ApprovalStatus

const DOCUMENT_TYPE_OPTIONS: { value: DocumentFilterOption; label: string }[] = [
  { value: 'all', label: '전체 유형' },
  { value: 'blueprint', label: '도면' },
  { value: 'report', label: '보고서' },
  { value: 'certificate', label: '증명서' },
  { value: 'contract', label: '계약서' },
  { value: 'manual', label: '매뉴얼' },
  { value: 'shared', label: '공유 문서' },
  { value: 'personal', label: '개인 문서' },
  { value: 'other', label: '기타' },
]

const APPROVAL_OPTIONS: { value: ApprovalFilterOption; label: string }[] = [
  { value: 'all', label: '전체 상태' },
  { value: 'pending', label: '승인 대기' },
  { value: 'approved', label: '승인 완료' },
  { value: 'rejected', label: '반려' },
  { value: 'cancelled', label: '취소됨' },
]

const TYPE_LABELS: Partial<Record<DocumentType, string>> = {
  blueprint: '도면',
  report: '보고서',
  certificate: '증명서',
  contract: '계약서',
  manual: '매뉴얼',
  shared: '공유 문서',
  personal: '개인 문서',
  other: '기타',
}

const APPROVAL_LABELS: Partial<Record<ApprovalStatus, string>> = {
  pending: '승인 대기',
  approved: '승인 완료',
  rejected: '반려',
  cancelled: '취소됨',
}

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }
  return date.toLocaleDateString('ko-KR')
}

export function DocumentsContent({
  initialDocuments,
  initialTotal,
  initialPages,
  pageSize,
  initialLoadErrored = false,
}: DocumentsContentProps) {
  const [documents, setDocuments] = useState<DocumentWithApproval[]>(initialDocuments)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(Math.max(initialPages, 1))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    initialLoadErrored ? '초기 문서 데이터를 불러오지 못했습니다.' : null
  )

  const [searchTerm, setSearchTerm] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [typeFilter, setTypeFilter] = useState<DocumentFilterOption>('all')
  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilterOption>('all')

  const [selectedDocument, setSelectedDocument] = useState<DocumentWithApproval | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const approvalStats = useMemo(() => {
    const counts: Record<string, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
    }
    documents.forEach(doc => {
      if (doc.approval_status && counts[doc.approval_status] !== undefined) {
        counts[doc.approval_status] += 1
      }
    })
    return counts
  }, [documents])

  const fetchDocuments = useCallback(
    async (
      nextPage: number,
      overrides?: {
        search?: string
        type?: DocumentFilterOption
        approval?: ApprovalFilterOption
      }
    ) => {
      setLoading(true)
      setError(null)

      const effectiveSearch = overrides?.search ?? searchTerm
      const effectiveType = overrides?.type ?? typeFilter
      const effectiveApproval = overrides?.approval ?? approvalFilter

      try {
        const params = new URLSearchParams({
          page: String(nextPage),
          limit: String(pageSize),
        })

        if (effectiveSearch.trim()) {
          params.set('search', effectiveSearch.trim())
        }
        if (effectiveType !== 'all') {
          params.set('type', effectiveType)
        }
        if (effectiveApproval !== 'all') {
          params.set('approval_status', effectiveApproval)
        }

        const response = await fetch(`/api/admin/documents/list?${params.toString()}`, {
          cache: 'no-store',
        })
        const payload = await response.json()

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || '문서 목록을 불러오지 못했습니다.')
        }

        setDocuments(payload.data?.documents ?? [])
        setTotal(payload.data?.total ?? 0)
        setPages(Math.max(payload.data?.pages ?? 1, 1))
        setPage(nextPage)
        setSearchTerm(effectiveSearch)
        setSearchInput(effectiveSearch)
        setTypeFilter(effectiveType)
        setApprovalFilter(effectiveApproval)
      } catch (err) {
        console.error('Failed to fetch documents', err)
        setError(err instanceof Error ? err.message : '문서 목록을 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    },
    [approvalFilter, pageSize, searchTerm, typeFilter]
  )

  const handleSearch = useCallback(() => {
    fetchDocuments(1, { search: searchInput })
  }, [fetchDocuments, searchInput])

  const handleResetFilters = useCallback(() => {
    setSearchInput('')
    fetchDocuments(1, { search: '', type: 'all', approval: 'all' })
  }, [fetchDocuments])

  const handleOpenDetail = useCallback((document: DocumentWithApproval) => {
    setSelectedDocument(document)
    setDetailLoading(false)
  }, [])

  const handleCloseDetail = useCallback(() => {
    setSelectedDocument(null)
    setDetailLoading(false)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">문서 관리</h1>
          <p className="text-sm text-muted-foreground">
            통합 문서함의 업로드 기록과 승인 상태를 확인하세요.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchDocuments(page)} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </Button>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <StatsCard label="전체 문서" value={total.toLocaleString()} />
        <StatsCard label="승인 대기" value={approvalStats.pending ?? 0} unit="건" />
        <StatsCard label="승인 완료" value={approvalStats.approved ?? 0} unit="건" />
      </section>

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <div className="relative flex-1 md:w-72">
              <Input
                placeholder={t('common.search')}
                value={searchInput}
                onChange={event => setSearchInput(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    handleSearch()
                  }
                }}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <Button variant="secondary" onClick={handleSearch} disabled={loading}>
              {t('common.search')}
            </Button>
            <Select
              value={typeFilter}
              onValueChange={value => fetchDocuments(1, { type: value as DocumentFilterOption })}
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="문서 유형" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={approvalFilter}
              onValueChange={value =>
                fetchDocuments(1, { approval: value as ApprovalFilterOption })
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="승인 상태" />
              </SelectTrigger>
              <SelectContent>
                {APPROVAL_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" size="sm" onClick={handleResetFilters} disabled={loading}>
            {t('common.reset')}
          </Button>
        </div>

        <div className="mt-6">
          {loading && <LoadingSpinner />}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>목록을 불러오는 중 문제가 발생했습니다.</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Search className="h-8 w-8" />
              <p>조건에 맞는 문서가 없습니다.</p>
            </div>
          ) : (
            <DataTable<DocumentWithApproval>
              data={documents}
              rowKey={d => d.id}
              stickyHeader
              columns={
                [
                  {
                    key: 'title',
                    header: '제목',
                    sortable: true,
                    render: (d: DocumentWithApproval) => (
                      <div className="cursor-pointer" onClick={() => handleOpenDetail(d)}>
                        <div className="font-medium text-foreground">{d.title || d.file_name}</div>
                        <div className="text-xs text-muted-foreground">{d.file_name}</div>
                      </div>
                    ),
                  },
                  {
                    key: 'document_type',
                    header: '유형',
                    sortable: true,
                    render: (d: DocumentWithApproval) => (
                      <Badge variant="outline">
                        {TYPE_LABELS[d.document_type as DocumentType] || d.document_type || '기타'}
                      </Badge>
                    ),
                  },
                  {
                    key: 'approval_status',
                    header: '승인 상태',
                    sortable: true,
                    render: (d: DocumentWithApproval) => (
                      <Badge variant={d.approval_status === 'approved' ? 'default' : 'outline'}>
                        {APPROVAL_LABELS[d.approval_status as ApprovalStatus] ||
                          d.approval_status ||
                          '미정'}
                      </Badge>
                    ),
                  },
                  {
                    key: 'owner',
                    header: '소유자',
                    sortable: true,
                    render: (d: DocumentWithApproval) => d.owner?.full_name || '미지정',
                  },
                  {
                    key: 'site',
                    header: '현장',
                    sortable: true,
                    render: (d: DocumentWithApproval) => d.site?.name || '미연결',
                  },
                  {
                    key: 'created_at',
                    header: '업로드',
                    sortable: true,
                    render: (d: DocumentWithApproval) => formatDate(d.created_at),
                  },
                  {
                    key: 'details',
                    header: t('common.details'),
                    sortable: false,
                    align: 'right',
                    render: (d: DocumentWithApproval) => (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation()
                          handleOpenDetail(d)
                        }}
                      >
                        {t('common.details')}
                      </Button>
                    ),
                  },
                ] as Column<DocumentWithApproval>[]
              }
            />
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <div>
            총 <span className="font-medium text-foreground">{total.toLocaleString()}</span> 개 문서
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDocuments(Math.max(page - 1, 1))}
              disabled={loading || page <= 1}
            >
              {t('common.prev')}
            </Button>
            <span>
              {page} / {pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDocuments(Math.min(page + 1, pages))}
              disabled={loading || page >= pages}
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
      </section>

      <DocumentDetailSheet
        open={Boolean(selectedDocument)}
        onOpenChange={open => {
          if (!open) {
            handleCloseDetail()
          }
        }}
        document={selectedDocument}
        loading={detailLoading}
      />
    </div>
  )
}
