'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  PillTabs as Tabs,
  PillTabsList as TabsList,
  PillTabsTrigger as TabsTrigger,
  PillTabsContent as TabsContent,
} from '@/components/ui/pill-tabs'
import RequiredDocumentsTable from '@/components/admin/RequiredDocumentsTable'
import DocumentRequirementsTable from '@/components/admin/DocumentRequirementsTable'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  CustomSelect,
  CustomSelectTrigger,
  CustomSelectValue,
  CustomSelectContent,
  CustomSelectItem,
} from '@/components/ui/custom-select'

type Props = {
  initialDocs: any[]
  types: any[]
  defaultTab?: 'submissions' | 'settings'
}

export default function RequiredManagerClient({
  initialDocs,
  types,
  defaultTab = 'submissions',
}: Props) {
  const [tab, setTab] = useState<'submissions' | 'settings'>(defaultTab)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')
  const [submittedBy, setSubmittedBy] = useState<string>('all')
  const [docs, setDocs] = useState<any[]>(initialDocs || [])
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
  const [detail, setDetail] = useState<any | null>(null)
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [totalPages, setTotalPages] = useState(1)

  // removed: 유형 옵션(요구 사항에 따라 유형 필터 제거)

  const filteredDocs = useMemo(() => {
    return (docs || []).filter((d: any) => {
      if (status !== 'all' && d?.status !== status) return false
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
  }, [docs, q, status, from, to])

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
  }, [q, status, from, to, submittedBy, page, limit, refresh])

  const exportCsv = () => {
    const header = ['제출일', '문서명', '유형', '제출자', '상태']
    const rows = filteredDocs.map((d: any) => [
      d?.submission_date ? new Date(d.submission_date).toLocaleString('ko-KR') : '',
      d?.title || '',
      d?.document_type || '',
      d?.submitted_by?.full_name || d?.submitted_by?.email || '',
      d?.status || '',
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="text-sm text-muted-foreground">총 제출</div>
                <div className="text-2xl font-semibold">{stats.total}</div>
              </div>
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="text-sm text-muted-foreground">승인</div>
                <div className="text-2xl font-semibold">{stats.approved}</div>
              </div>
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="text-sm text-muted-foreground">대기</div>
                <div className="text-2xl font-semibold">{stats.pending}</div>
              </div>
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="text-sm text-muted-foreground">반려</div>
                <div className="text-2xl font-semibold">{stats.rejected}</div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
                <div className="lg:col-span-2">
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
                  <CustomSelect value={status} onValueChange={v => setStatus(v as any)}>
                    <CustomSelectTrigger className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-full">
                      <CustomSelectValue placeholder="상태 선택" />
                    </CustomSelectTrigger>
                    <CustomSelectContent className="max-h-60 overflow-auto">
                      <CustomSelectItem value="all">전체</CustomSelectItem>
                      <CustomSelectItem value="pending">대기</CustomSelectItem>
                      <CustomSelectItem value="approved">승인</CustomSelectItem>
                      <CustomSelectItem value="rejected">반려</CustomSelectItem>
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
                <div className="lg:col-span-1 flex gap-2">
                  <button
                    type="button"
                    className="h-10 rounded-md border px-3 text-sm"
                    onClick={() => {
                      setQ('')
                      setStatus('all')
                      setSubmittedBy('all')
                      setFrom('')
                      setTo('')
                    }}
                  >
                    초기화
                  </button>
                  <button
                    type="button"
                    className="h-10 rounded-md border px-3 text-sm"
                    onClick={exportCsv}
                  >
                    CSV 내보내기
                  </button>
                </div>
              </form>
            </div>

            <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
              {loading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">불러오는 중…</div>
              ) : (
                <RequiredDocumentsTable docs={filteredDocs} onOpen={setDetail} />
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
          <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
            <DocumentRequirementsTable types={types} />
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!detail} onOpenChange={o => !o && setDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detail?.title || '-'}</DialogTitle>
            <DialogDescription>{detail?.document_type || ''}</DialogDescription>
          </DialogHeader>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>
              제출자: {detail?.submitted_by?.full_name || detail?.submitted_by?.email || '-'}
            </div>
            <div>
              제출일:{' '}
              {detail?.submission_date
                ? new Date(detail.submission_date).toLocaleString('ko-KR')
                : '-'}
            </div>
            <div>상태: {detail?.status || '-'}</div>
            {detail?.file_name ? <div>파일명: {detail.file_name}</div> : null}
            {detail?.file_url ? (
              <div>
                파일:{' '}
                <a
                  href={detail.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline text-blue-600"
                >
                  열기
                </a>
              </div>
            ) : null}
            <div className="pt-3 flex gap-2">
              <button
                className="px-3 py-2 text-sm rounded-md border disabled:opacity-50"
                disabled={busy !== null}
                onClick={async () => {
                  if (!detail?.id) return
                  setBusy('approve')
                  try {
                    const r = await fetch('/api/admin/required-docs/actions', {
                      method: 'POST',
                      headers: { 'content-type': 'application/json' },
                      body: JSON.stringify({ action: 'approve', id: detail.id }),
                    })
                    const j = await r.json().catch(() => ({}))
                    if (!r.ok || j?.success === false) throw new Error(j?.error || '승인 실패')
                    setDetail({ ...detail, status: 'approved' })
                    setRefresh(x => x + 1)
                  } catch (_) {
                    /* no-op */
                  } finally {
                    setBusy(null)
                  }
                }}
              >
                승인
              </button>
              <button
                className="px-3 py-2 text-sm rounded-md border disabled:opacity-50"
                disabled={busy !== null}
                onClick={async () => {
                  if (!detail?.id) return
                  setBusy('reject')
                  try {
                    const r = await fetch('/api/admin/required-docs/actions', {
                      method: 'POST',
                      headers: { 'content-type': 'application/json' },
                      body: JSON.stringify({ action: 'reject', id: detail.id }),
                    })
                    const j = await r.json().catch(() => ({}))
                    if (!r.ok || j?.success === false) throw new Error(j?.error || '반려 실패')
                    setDetail({ ...detail, status: 'rejected' })
                    setRefresh(x => x + 1)
                  } catch (_) {
                    /* no-op */
                  } finally {
                    setBusy(null)
                  }
                }}
              >
                반려
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
