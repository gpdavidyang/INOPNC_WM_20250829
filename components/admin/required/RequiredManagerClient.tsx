'use client'

import RequiredDocumentsTable from '@/components/admin/RequiredDocumentsTable'
import RequiredTypesSettings from '@/components/admin/required/RequiredTypesSettings'
import { Button } from '@/components/ui/button'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import {
  REQUIRED_DOC_STATUS_LABELS,
  type RequiredDocStatus,
  normalizeRequiredDocStatus,
} from '@/lib/documents/status'
import { cn } from '@/lib/utils'
import { Calendar, Files, RefreshCw, Search, Settings2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

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
        <div className="sticky top-0 z-10 bg-gradient-to-b from-white via-white to-transparent pb-4 -mx-2 px-2 mb-2">
          <TabsList className="grid grid-cols-2 h-auto items-center gap-2 bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100 shadow-sm">
            <TabsTrigger
              value="submissions"
              className="relative flex h-11 items-center justify-center gap-2.5 rounded-xl px-3 text-sm font-bold transition-all hover:text-gray-900 hover:bg-white/60 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-md data-[state=active]:shadow-blue-100/50 whitespace-nowrap"
            >
              <Files className="w-4 h-4" />
              제출현황
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="relative flex h-11 items-center justify-center gap-2.5 rounded-xl px-3 text-sm font-bold transition-all hover:text-gray-900 hover:bg-white/60 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-md data-[state=active]:shadow-blue-100/50 whitespace-nowrap"
            >
              <Settings2 className="w-4 h-4" />
              유형 설정
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="submissions" className="w-full space-y-6 pt-2">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              {
                key: 'all' as StatusFilter,
                label: '전체 제출',
                value: stats.total,
                bgSelected: 'bg-indigo-100/80',
                bgUnselected: 'bg-indigo-50/50',
                textSelected: 'text-[#1A254F]',
                textUnselected: 'text-[#1A254F]/70',
              },
              {
                key: 'pending' as StatusFilter,
                label: '승인 대기',
                value: stats.pending,
                bgSelected: 'bg-amber-100',
                bgUnselected: 'bg-amber-50/50',
                textSelected: 'text-amber-700',
                textUnselected: 'text-amber-600/70',
              },
              {
                key: 'approved' as StatusFilter,
                label: '승인 완료',
                value: stats.approved,
                bgSelected: 'bg-emerald-100',
                bgUnselected: 'bg-emerald-50/50',
                textSelected: 'text-emerald-700',
                textUnselected: 'text-emerald-600/70',
              },
              {
                key: 'rejected' as StatusFilter,
                label: '반려됨',
                value: stats.rejected,
                bgSelected: 'bg-rose-100',
                bgUnselected: 'bg-rose-50/50',
                textSelected: 'text-rose-700',
                textUnselected: 'text-rose-600/70',
              },
              {
                key: 'not_submitted' as StatusFilter,
                label: '미제출',
                value: missingCount,
                bgSelected: 'bg-sky-100',
                bgUnselected: 'bg-sky-50/50',
                textSelected: 'text-sky-700',
                textUnselected: 'text-sky-600/70',
              },
            ].map(card => (
              <button
                key={card.key}
                type="button"
                onClick={() => handleStatusChange(card.key)}
                className={cn(
                  'relative flex flex-col gap-1 p-4 sm:p-5 rounded-xl transition-all border-none text-left w-full h-full min-h-[96px]',
                  status === card.key
                    ? cn(card.bgSelected, card.textSelected, 'shadow-md shadow-black/5')
                    : cn(card.bgUnselected, card.textUnselected, 'hover:bg-opacity-80')
                )}
              >
                <span
                  className={cn(
                    'text-[10px] font-black uppercase tracking-widest leading-none',
                    status === card.key ? 'opacity-50' : 'opacity-30'
                  )}
                >
                  {card.label}
                </span>
                <div className="flex items-baseline gap-0.5 mt-auto">
                  <span className={cn('text-2xl font-black italic tracking-tighter leading-none')}>
                    {card.value.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-bold opacity-30 ml-1">건</span>
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground tracking-tight ml-1">
                  상세 검색
                </span>
                <div className="relative">
                  <Input
                    className="h-10 w-full rounded-xl bg-gray-50 border-none pl-10 pr-4 text-sm font-medium"
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    placeholder="문서명/파일명/제출자"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground tracking-tight ml-1">
                  상태 필터
                </span>
                <CustomSelect
                  value={status}
                  onValueChange={v => handleStatusChange(v as StatusFilter)}
                >
                  <CustomSelectTrigger className="h-10 rounded-xl bg-gray-50 border-none px-4 text-sm font-medium w-full">
                    <CustomSelectValue placeholder="상태 선택" />
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    <CustomSelectItem value="all">전체 상태</CustomSelectItem>
                    <CustomSelectItem value="pending">승인 대기</CustomSelectItem>
                    <CustomSelectItem value="approved">승인 완료</CustomSelectItem>
                    <CustomSelectItem value="rejected">반려됨</CustomSelectItem>
                    <CustomSelectItem value="not_submitted">미제출</CustomSelectItem>
                  </CustomSelectContent>
                </CustomSelect>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground tracking-tight ml-1">
                  문서 유형
                </span>
                <CustomSelect value={docType} onValueChange={v => setDocType(v)}>
                  <CustomSelectTrigger className="h-10 rounded-xl bg-gray-50 border-none px-4 text-sm font-medium w-full">
                    <CustomSelectValue placeholder="유형 선택" />
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    <CustomSelectItem value="all">전체 유형</CustomSelectItem>
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

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground tracking-tight ml-1">
                  제출자
                </span>
                <CustomSelect value={submittedBy} onValueChange={v => setSubmittedBy(v)}>
                  <CustomSelectTrigger className="h-10 rounded-xl bg-gray-50 border-none px-4 text-sm font-medium w-full">
                    <CustomSelectValue placeholder="작업자 선택" />
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    <CustomSelectItem value="all">전체 작업자</CustomSelectItem>
                    {Array.from(
                      new Map(
                        (docs || []).map((d: any) => [
                          String(d?.submitted_by?.id || ''),
                          {
                            id: String(d?.submitted_by?.id || ''),
                            label:
                              (d?.submitted_by?.full_name || d?.submitted_by?.email || '').trim() ||
                              'Unknown',
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

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground tracking-tight ml-1">
                  시작일
                </span>
                <div className="relative">
                  <Input
                    type="date"
                    className="h-10 w-full rounded-xl bg-gray-50 border-none pl-10 pr-4 text-sm font-medium"
                    value={from}
                    onChange={e => setFrom(e.target.value)}
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground tracking-tight ml-1">
                  종료일
                </span>
                <div className="relative">
                  <Input
                    type="date"
                    className="h-10 w-full rounded-xl bg-gray-50 border-none pl-10 pr-4 text-sm font-medium"
                    value={to}
                    onChange={e => setTo(e.target.value)}
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center pt-2 border-t border-gray-100 gap-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-xl px-4 border-gray-200 font-bold"
                  onClick={() => {
                    setQ('')
                    handleStatusChange('all')
                    setDocType('all')
                    setSubmittedBy('all')
                    setFrom('')
                    setTo('')
                  }}
                >
                  필터 초기화
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-xl px-4 border-gray-200 font-bold"
                  onClick={exportCsv}
                >
                  CSV 다운로드
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  페이지당 개수
                </span>
                <select
                  className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium"
                  value={limit}
                  onChange={e => {
                    setLimit(Number(e.target.value))
                    setPage(1)
                  }}
                >
                  <option value={10}>10개씩</option>
                  <option value={20}>20개씩</option>
                  <option value={50}>50개씩</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden text-sm">
            <div className="flex flex-col gap-2 p-6 pb-2">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <div className="w-1.5 h-6 bg-blue-600 rounded-sm" />
                필수서류 제출 상세 목록
              </h2>
            </div>

            <div className="px-6 pb-6">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin opacity-20" />
                  <p className="text-sm font-medium">문서 데이터를 불러오는 중...</p>
                </div>
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
                      toast({ title: '승인 완료', description: '해당 서류가 승인되었습니다.' })
                    } catch (error) {
                      toast({
                        variant: 'destructive',
                        title: '승인 실패',
                        description:
                          error instanceof Error ? error.message : '승인 처리 중 오류 발생',
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
                      toast({ title: '반려 처리 완료', description: '해당 서류가 반려되었습니다.' })
                    } catch (error) {
                      toast({
                        variant: 'destructive',
                        title: '반려 실패',
                        description:
                          error instanceof Error ? error.message : '반려 처리 중 오류 발생',
                      })
                    } finally {
                      setBusy(null)
                    }
                  }}
                />
              )}
            </div>
          </div>

          <div className="flex items-center justify-center pt-2 gap-4">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl px-4 border-gray-200 disabled:opacity-50 font-bold"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              이전 페이지
            </Button>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-blue-700">{page}</span>
              <span className="text-sm text-gray-300">/</span>
              <span className="text-sm font-medium text-gray-500">{totalPages}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl px-4 border-gray-200 disabled:opacity-50 font-bold"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              다음 페이지
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="w-full space-y-6 pt-2">
          <RequiredTypesSettings initialTypes={typesState} onTypesUpdated={setTypesState} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
