'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  PillTabs as Tabs,
  PillTabsList as TabsList,
  PillTabsTrigger as TabsTrigger,
  PillTabsContent as TabsContent,
} from '@/components/ui/pill-tabs'
import RequiredDocumentsTable from '@/components/admin/RequiredDocumentsTable'
import RequiredTypesSettings from '@/components/admin/required/RequiredTypesSettings'
import {
  CustomSelect,
  CustomSelectTrigger,
  CustomSelectValue,
  CustomSelectContent,
  CustomSelectItem,
} from '@/components/ui/custom-select'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import {
  REQUIRED_DOC_STATUS_LABELS,
  type RequiredDocStatus,
  normalizeRequiredDocStatus,
} from '@/lib/documents/status'

type Props = {
  initialDocs: any[]
  types: any[]
  defaultTab?: 'submissions' | 'settings'
}

type StatusFilter = 'all' | RequiredDocStatus

export default function RequiredManagerClient({
  initialDocs,
  types,
  defaultTab = 'submissions',
}: Props) {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [tab, setTab] = useState<'submissions' | 'settings'>(defaultTab)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [docType, setDocType] = useState<string>('all')
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')
  const [submittedBy, setSubmittedBy] = useState<string>('all')
  const [docs, setDocs] = useState<any[]>(initialDocs || [])
  const [typesState, setTypesState] = useState<any[]>(types || [])
  const initialStats = useMemo(() => {
    const total = (initialDocs || []).length
    const approved = (initialDocs || []).filter((d: any) => d?.status === 'approved').length
    const pending = (initialDocs || []).filter((d: any) => d?.status === 'pending').length
    const rejected = (initialDocs || []).filter((d: any) => d?.status === 'rejected').length
    return { total, approved, pending, rejected }
  }, [initialDocs])
  const [stats, setStats] = useState<{
    total: number
    approved: number
    pending: number
    rejected: number
  }>(initialStats)
  const [loading, setLoading] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [totalPages, setTotalPages] = useState(1)

  // removed: 유형 옵션(요구 사항에 따라 유형 필터 제거)

  const typeLabelMap = useMemo(() => {
    const map = new Map<string, string>()
    ;(typesState || []).forEach(t => {
      if (!t?.code && !t?.id) return
      const key = t.code || t.id
      map.set(key, t.name_ko || t.name_en || key)
    })
    return map
  }, [typesState])

  const mergedDocs = useMemo(() => {
    const normalizedDocs = (docs || []).map((doc: any) => {
      const typeCode = doc.document_type_code || doc.sub_category || doc.document_type || null
      const typeLabel =
        (typeCode && typeLabelMap.get(typeCode)) || doc.document_type || doc.title || '문서'
      const canonicalStatus = normalizeRequiredDocStatus(doc?.status)
      return {
        ...doc,
        status: canonicalStatus,
        document_type_code: typeCode,
        document_type_label: typeLabel,
      }
    })
    const seenCodes = new Set(
      normalizedDocs.map((doc: any) => doc.document_type_code || doc.document_type).filter(Boolean)
    )
    const placeholders =
      typesState
        ?.filter(t => t?.code && !seenCodes.has(t.code))
        .map(t => ({
          id: `missing-${t.id}`,
          title: t.name_ko || t.name_en || t.code,
          document_type: t.name_ko || t.name_en || t.code,
          document_type_code: t.code,
          document_type_label: t.name_ko || t.name_en || t.code,
          status: 'not_submitted',
          submission_date: null,
          submitted_by: null,
          file_url: null,
          is_placeholder: true,
        })) || []
    return [...normalizedDocs, ...placeholders]
  }, [docs, typesState])

  const missingCount = useMemo(
    () =>
      mergedDocs.filter(doc => normalizeRequiredDocStatus(doc?.status) === 'not_submitted').length,
    [mergedDocs]
  )

  const filteredDocs = useMemo(() => {
    return (mergedDocs || []).filter((d: any) => {
      if (status !== 'all' && normalizeRequiredDocStatus(d?.status) !== status) return false
      if (docType !== 'all' && (d?.document_type_code || d?.document_type) !== docType) return false
      if (q) {
        const hay =
          `${d?.title || ''} ${d?.file_name || ''} ${d?.submitted_by?.full_name || ''}`.toLowerCase()
        if (!hay.includes(q.toLowerCase())) return false
      }
      if (from) {
        const t = d?.submission_date ? new Date(d.submission_date).getTime() : 0
        const f = new Date(from).getTime()
        if (t < f) return false
      }
      if (to) {
        const t = d?.submission_date ? new Date(d.submission_date).getTime() : 0
        const end = new Date(to)
        end.setHours(23, 59, 59, 999)
        if (t > end.getTime()) return false
      }
      return true
    })
  }, [mergedDocs, q, status, docType, from, to])

  // One-time initialization from URL params
  useEffect(() => {
    try {
      const spQ = searchParams.get('q') || ''
      const spStatus = searchParams.get('status') || ''
      const spFrom = searchParams.get('from') || ''
      const spTo = searchParams.get('to') || ''
      const spSubmittedBy = searchParams.get('submitted_by') || ''
      if (spQ) setQ(spQ)
      if (spStatus) {
        const mapped = spStatus === 'missing' ? 'not_submitted' : (spStatus as StatusFilter)
        if (['all', 'pending', 'approved', 'rejected', 'not_submitted'].includes(mapped)) {
          setStatus(mapped as StatusFilter)
        }
      }
      if (spFrom) setFrom(spFrom)
      if (spTo) setTo(spTo)
      if (spSubmittedBy) setSubmittedBy(spSubmittedBy)
    } catch {
      // noop
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 서버측 필터 적용: 목록 + 요약 동기화
  useEffect(() => {
    let aborted = false
    const doFetch = async () => {
      setLoading(true)
      try {
        const sp = new URLSearchParams()
        if (q) sp.set('q', q)
        if (status) sp.set('status', status)
        if (from) sp.set('from', from)
        if (to) sp.set('to', to)
        if (submittedBy && submittedBy !== 'all') sp.set('submitted_by', submittedBy)
        if (docType && docType !== 'all') sp.set('document_type', docType)
        sp.set('limit', String(limit))
        sp.set('page', String(page))
        const [listRes, ovRes] = await Promise.all([
          fetch(`/api/admin/required-docs/submissions?${sp.toString()}`, { cache: 'no-store' }),
          fetch(`/api/admin/required-docs/overview?${sp.toString()}`, { cache: 'no-store' }),
        ])
        const listJson = await listRes.json().catch(() => ({}))
        const ovJson = await ovRes.json().catch(() => ({}))
        if (!aborted) {
          if (listRes.ok && listJson?.success)
            setDocs(Array.isArray(listJson.data) ? listJson.data : [])
          else setDocs([])
          if (listRes.ok && listJson?.pagination) setTotalPages(listJson.pagination.totalPages || 1)
          if (ovRes.ok && ovJson?.success)
            setStats(ovJson.counts || { total: 0, approved: 0, pending: 0, rejected: 0 })
          else setStats({ total: 0, approved: 0, pending: 0, rejected: 0 })
        }
      } catch (_) {
        if (!aborted) {
          setDocs([])
          setStats({ total: 0, approved: 0, pending: 0, rejected: 0 })
        }
      } finally {
        if (!aborted) setLoading(false)
      }
    }
    void doFetch()
    return () => {
      aborted = true
    }
  }, [q, status, docType, from, to, submittedBy, page, limit, refresh])

  const handleStatusChange = (nextStatus: StatusFilter) => {
    setStatus(nextStatus)
    setPage(1)
  }

  const exportCsv = () => {
    const header = ['제출일', '문서명', '유형', '제출자', '상태']
    const rows = filteredDocs.map((d: any) => [
      d?.submission_date ? new Date(d.submission_date).toLocaleString('ko-KR') : '',
      d?.title || '',
      d?.document_type_label || d?.document_type || '',
      d?.submitted_by?.full_name || d?.submitted_by?.email || '',
      REQUIRED_DOC_STATUS_LABELS[normalizeRequiredDocStatus(d?.status)] ||
        REQUIRED_DOC_STATUS_LABELS.pending,
    ])
    const csv = [header, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `required-submissions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className="w-full">
      <Tabs value={tab} onValueChange={v => setTab(v as any)} className="w-full">
        <TabsList className="mb-4 w-full" fill>
          <TabsTrigger value="submissions" fill>
            제출현황
          </TabsTrigger>
          <TabsTrigger value="settings" fill>
            설정
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="w-full">
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {[
                { key: 'all' as StatusFilter, label: '전체 제출', value: stats.total },
                {
                  key: 'pending' as StatusFilter,
                  label: REQUIRED_DOC_STATUS_LABELS.pending,
                  value: stats.pending,
                },
                {
                  key: 'approved' as StatusFilter,
                  label: REQUIRED_DOC_STATUS_LABELS.approved,
                  value: stats.approved,
                },
                {
                  key: 'rejected' as StatusFilter,
                  label: REQUIRED_DOC_STATUS_LABELS.rejected,
                  value: stats.rejected,
                },
                {
                  key: 'not_submitted' as StatusFilter,
                  label: REQUIRED_DOC_STATUS_LABELS.not_submitted,
                  value: missingCount,
                },
              ].map(card => (
                <button
                  key={card.key}
                  type="button"
                  aria-pressed={status === card.key}
                  onClick={() => handleStatusChange(card.key)}
                  className={cn(
                    'rounded-xl border p-4 min-h-[96px] text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                    status === card.key
                      ? 'border-[#4C63B6] bg-[#E0E7FF] ring-[#4C63B6]'
                      : 'border-[#BAC6E1] bg-[#F3F7FA] hover:border-[#94A3B8]'
                  )}
                >
                  <div className="text-sm text-[#6C7DA5] mb-1">{card.label}</div>
                  <div className="text-2xl font-semibold text-[#1F2A44]">
                    {card.value.toLocaleString('ko-KR')}
                  </div>
                </button>
              ))}
            </div>

            <div className="rounded-lg border bg-card p-4 shadow-sm space-y-3">
              <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">검색어</label>
                  <input
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    placeholder="문서명/파일명/제출자"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">상태</label>
                  <CustomSelect
                    value={status}
                    onValueChange={v => handleStatusChange(v as StatusFilter)}
                  >
                    <CustomSelectTrigger className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-full">
                      <CustomSelectValue placeholder="상태 선택" />
                    </CustomSelectTrigger>
                    <CustomSelectContent className="max-h-60 overflow-auto">
                      <CustomSelectItem value="all">전체</CustomSelectItem>
                      <CustomSelectItem value="pending">
                        {REQUIRED_DOC_STATUS_LABELS.pending}
                      </CustomSelectItem>
                      <CustomSelectItem value="approved">
                        {REQUIRED_DOC_STATUS_LABELS.approved}
                      </CustomSelectItem>
                      <CustomSelectItem value="rejected">
                        {REQUIRED_DOC_STATUS_LABELS.rejected}
                      </CustomSelectItem>
                      <CustomSelectItem value="not_submitted">
                        {REQUIRED_DOC_STATUS_LABELS.not_submitted}
                      </CustomSelectItem>
                    </CustomSelectContent>
                  </CustomSelect>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">문서 유형</label>
                  <CustomSelect value={docType} onValueChange={v => setDocType(v)}>
                    <CustomSelectTrigger className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-full">
                      <CustomSelectValue placeholder="문서 유형 선택" />
                    </CustomSelectTrigger>
                    <CustomSelectContent className="max-h-60 overflow-auto">
                      <CustomSelectItem value="all">전체</CustomSelectItem>
                      {(typesState || [])
                        .filter(t => !!t?.code)
                        .map(t => (
                          <CustomSelectItem key={t.id} value={t.code || t.id}>
                            {t.name_ko || t.name_en || t.code}
                          </CustomSelectItem>
                        ))}
                    </CustomSelectContent>
                  </CustomSelect>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">제출자</label>
                  <CustomSelect value={submittedBy} onValueChange={v => setSubmittedBy(v)}>
                    <CustomSelectTrigger className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-full">
                      <CustomSelectValue placeholder="제출자 선택" />
                    </CustomSelectTrigger>
                    <CustomSelectContent className="max-h-60 overflow-auto">
                      <CustomSelectItem value="all">전체</CustomSelectItem>
                      {Array.from(
                        new Map(
                          (docs || []).map((d: any) => [
                            String(d?.submitted_by?.id || ''),
                            {
                              id: String(d?.submitted_by?.id || ''),
                              label:
                                (
                                  d?.submitted_by?.full_name ||
                                  d?.submitted_by?.email ||
                                  ''
                                ).trim() || 'Unknown',
                            },
                          ])
                        ).values()
                      )
                        .filter(opt => !!opt.id)
                        .map(opt => (
                          <CustomSelectItem key={opt.id} value={opt.id}>
                            {opt.label}
                          </CustomSelectItem>
                        ))}
                    </CustomSelectContent>
                  </CustomSelect>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">시작일</label>
                  <input
                    type="date"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={from}
                    onChange={e => setFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">종료일</label>
                  <input
                    type="date"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={to}
                    onChange={e => setTo(e.target.value)}
                  />
                </div>
              </form>
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  className="h-10 rounded-md border px-3 text-sm whitespace-nowrap flex-shrink-0"
                  onClick={() => {
                    setQ('')
                    handleStatusChange('all')
                    setDocType('all')
                    setSubmittedBy('all')
                    setFrom('')
                    setTo('')
                  }}
                >
                  초기화
                </button>
                <button
                  type="button"
                  className="h-10 rounded-md border px-3 text-sm whitespace-nowrap flex-shrink-0"
                  onClick={exportCsv}
                >
                  CSV 내보내기
                </button>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
              {loading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">불러오는 중…</div>
              ) : (
                <RequiredDocumentsTable
                  docs={filteredDocs}
                  onApprove={async doc => {
                    if (busy || !doc?.id) return
                    setBusy('approve')
                    try {
                      const r = await fetch('/api/admin/required-docs/actions', {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({
                          action: 'approve',
                          id: doc.id,
                          submissionId: doc.submission_id || null,
                        }),
                      })
                      const j = await r.json().catch(() => ({}))
                      if (!r.ok || j?.success === false) throw new Error(j?.error || '승인 실패')
                      setRefresh(x => x + 1)
                    } catch (error) {
                      toast({
                        variant: 'destructive',
                        title: '승인 실패',
                        description:
                          error instanceof Error
                            ? error.message
                            : '승인 처리 중 오류가 발생했습니다.',
                      })
                    } finally {
                      setBusy(null)
                    }
                  }}
                  onReject={async doc => {
                    if (busy || !doc?.id) return
                    setBusy('reject')
                    try {
                      const r = await fetch('/api/admin/required-docs/actions', {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({
                          action: 'reject',
                          id: doc.id,
                          submissionId: doc.submission_id || null,
                        }),
                      })
                      const j = await r.json().catch(() => ({}))
                      if (!r.ok || j?.success === false) throw new Error(j?.error || '반려 실패')
                      setRefresh(x => x + 1)
                    } catch (error) {
                      toast({
                        variant: 'destructive',
                        title: '반려 실패',
                        description:
                          error instanceof Error
                            ? error.message
                            : '반려 처리 중 오류가 발생했습니다.',
                      })
                    } finally {
                      setBusy(null)
                    }
                  }}
                />
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                페이지 {page} / {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  value={limit}
                  onChange={e => {
                    setLimit(Number(e.target.value))
                    setPage(1)
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <button
                  className="h-9 rounded-md border px-3 text-sm disabled:opacity-50"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  이전
                </button>
                <button
                  className="h-9 rounded-md border px-3 text-sm disabled:opacity-50"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  다음
                </button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="w-full">
          <RequiredTypesSettings initialTypes={typesState} onTypesUpdated={setTypesState} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
