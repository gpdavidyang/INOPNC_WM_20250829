'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/ui/strings'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

type Category = 'shared' | 'markup' | 'required' | 'invoice' | 'photo_grid'

const CATEGORY_LABEL: Record<Category, string> = {
  shared: '공유문서',
  markup: '도면마킹',
  required: '필수서류',
  invoice: '정산문서',
  photo_grid: '사진대지',
}

interface DocumentRow {
  id: string
  title?: string
  status?: string
  created_at?: string
  site?: { name?: string } | null
  file_name?: string
  file_url?: string
  description?: string
  uploader?: { full_name?: string; email?: string } | null
}

export default function TabbedDocumentsClient({
  defaultTab = 'shared' as Category,
}: {
  defaultTab?: Category
}) {
  const [active, setActive] = useState<Category>(defaultTab)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [siteId, setSiteId] = useState('')
  const [limit, setLimit] = useState(10)
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<DocumentRow[]>([])
  const [total, setTotal] = useState(0)
  const [statsStatus, setStatsStatus] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<DocumentRow | null>(null)
  const [history, setHistory] = useState<
    Array<{ changed_at?: string; action?: string; user?: { full_name?: string; email?: string } }>
  >([])
  const [accessLogs, setAccessLogs] = useState<
    Array<{ created_at?: string; action?: string; accessed_by?: string }>
  >([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busyAction, setBusyAction] = useState<'approve' | 'reject' | null>(null)
  const [actionMsg, setActionMsg] = useState<string>('')
  const offset = (page - 1) * limit

  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit])

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', String(limit))
      params.set('page', String(page))
      params.set('category_type', active)
      params.set('sort_by', 'created_at')
      params.set('sort_order', 'desc')
      params.set('include_stats', 'false')
      if (search) params.set('search', search)
      if (siteId) params.set('site_id', siteId)
      if (status && status !== 'all') params.set('status', status)
      const res = await fetch(`/api/unified-documents/v2?${params.toString()}`, {
        cache: 'no-store',
      })
      const json = await res.json()
      if (!res.ok || json?.error) throw new Error(json?.error || '조회 실패')
      const data: DocumentRow[] = json?.data || []
      setRows(data)
      setTotal(json?.pagination?.total || 0)
      const byStatus: Record<string, number> = json?.statusBreakdown || {}
      setStatsStatus(byStatus)
      setSelected(new Set())
    } catch (e) {
      setRows([])
      setTotal(0)
      setStatsStatus({})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, limit, page])

  useEffect(() => {
    const fetchHistory = async () => {
      if (!detail?.id) {
        setHistory([])
        return
      }
      try {
        const res = await fetch(`/api/unified-documents/v2/${detail.id}`)
        const json = await res.json()
        if (res.ok) {
          setHistory(Array.isArray(json?.history) ? json.history.slice(0, 5) : [])
          setAccessLogs(Array.isArray(json?.accessLogs) ? json.accessLogs.slice(0, 5) : [])
        } else {
          setHistory([])
          setAccessLogs([])
        }
      } catch (_) {
        setHistory([])
        setAccessLogs([])
      }
    }
    void fetchHistory()
  }, [detail?.id])

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    void load()
  }

  const toggleAll = () => {
    if (selected.size === rows.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(rows.map(r => r.id)))
    }
  }

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const bulkAction = async (action: 'approve' | 'reject') => {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    setBusyAction(action)
    setActionMsg('')
    try {
      const res = await fetch('/api/unified-documents/v2', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, documentIds: ids }),
      })
      const json = await res.json()
      if (!res.ok || json?.success === false) throw new Error(json?.error || '처리 실패')
      setActionMsg(`${ids.length}건 ${action === 'approve' ? '승인' : '반려'} 완료`)
      await load()
    } catch (e: any) {
      setActionMsg(e?.message || '처리 실패')
    } finally {
      setBusyAction(null)
    }
  }

  const Status = ({ s }: { s?: string }) => (
    <Badge variant={s === 'approved' ? 'default' : 'outline'}>{s || '-'}</Badge>
  )

  return (
    <div className="w-full">
      <Tabs
        value={active}
        onValueChange={v => {
          setActive(v as Category)
          setPage(1)
        }}
        className="w-full"
      >
        <TabsList className="mb-4">
          {(Object.keys(CATEGORY_LABEL) as Category[]).map(c => (
            <TabsTrigger key={c} value={c}>
              {CATEGORY_LABEL[c]}
            </TabsTrigger>
          ))}
        </TabsList>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>{CATEGORY_LABEL[active]}</CardTitle>
            <CardDescription>상세 검색과 페이지 이동이 가능합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={applyFilters}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 items-end"
            >
              <div className="lg:col-span-2">
                <label className="block text-sm text-muted-foreground mb-1">검색어</label>
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="제목/파일명/설명"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">상태</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">전체</option>
                  <option value="active">active</option>
                  <option value="uploaded">uploaded</option>
                  <option value="pending">pending</option>
                  <option value="approved">approved</option>
                  <option value="rejected">rejected</option>
                  <option value="archived">archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">현장 ID</label>
                <Input
                  value={siteId}
                  onChange={e => setSiteId(e.target.value)}
                  placeholder="site_id"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">페이지 크기</label>
                <select
                  value={limit}
                  onChange={e => setLimit(Number(e.target.value))}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="lg:col-span-2 flex gap-2">
                <Button type="submit" variant="outline">
                  {t('common.apply')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSearch('')
                    setStatus('all')
                    setSiteId('')
                    setPage(1)
                    void load()
                  }}
                >
                  {t('common.reset')}
                </Button>
                <Link
                  href={`/dashboard/admin/documents/${active === 'photo_grid' ? 'photo-grid' : active === 'required' ? 'required' : active}`}
                  className={buttonVariants({ variant: 'outline', size: 'standard' })}
                  role="button"
                >
                  전체 보기
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          {Object.entries(statsStatus).map(([k, v]) => (
            <Badge key={k} variant="outline">
              {k}: {v}
            </Badge>
          ))}
        </div>

        <TabsContent value={active} className="w-full">
          <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
            <div className="mb-3 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={busyAction !== null || selected.size === 0}
                onClick={() => bulkAction('approve')}
              >
                선택 승인
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busyAction !== null || selected.size === 0}
                onClick={() => bulkAction('reject')}
              >
                선택 반려
              </Button>
              {actionMsg && <span className="text-xs text-muted-foreground">{actionMsg}</span>}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[36px]">
                    <input
                      type="checkbox"
                      aria-label="전체선택"
                      checked={selected.size === rows.length && rows.length > 0}
                      onChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>등록일</TableHead>
                  <TableHead>문서명</TableHead>
                  <TableHead>현장</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>동작</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      로딩 중…
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      표시할 문서가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map(d => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          aria-label="선택"
                          checked={selected.has(d.id)}
                          onChange={() => toggleOne(d.id)}
                        />
                      </TableCell>
                      <TableCell>
                        {d.created_at ? new Date(d.created_at).toLocaleDateString('ko-KR') : '-'}
                      </TableCell>
                      <TableCell
                        className="font-medium text-foreground truncate max-w-[360px]"
                        title={d.title || ''}
                      >
                        {d.title || '-'}
                      </TableCell>
                      <TableCell>{d.site?.name || '-'}</TableCell>
                      <TableCell>
                        <Status s={d.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/dashboard/admin/documents/${d.id}`}
                            className="underline text-blue-600"
                          >
                            자세히
                          </Link>
                          <button className="underline text-blue-600" onClick={() => setDetail(d)}>
                            미리보기
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {total}건 중 {total === 0 ? 0 : (page - 1) * limit + 1}–
                {Math.min(page * limit, total)} 표시
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  {t('common.prev')}
                </Button>
                <Button
                  variant="outline"
                  disabled={page >= pages}
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                >
                  {t('common.next')}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog
        open={!!detail}
        onOpenChange={o => {
          if (!o) setDetail(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detail?.title || '-'}</DialogTitle>
            <DialogDescription>{detail?.description || ''}</DialogDescription>
          </DialogHeader>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>
              현장: <span className="text-foreground font-medium">{detail?.site?.name || '-'}</span>
            </div>
            <div>
              상태: <Status s={detail?.status} />
            </div>
            <div>
              파일: {detail?.file_name || '-'}
              {detail?.file_url ? (
                <>
                  {' '}
                  —{' '}
                  <a
                    href={detail.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-blue-600"
                  >
                    열기
                  </a>
                </>
              ) : null}
            </div>
            <div>작성자: {detail?.uploader?.full_name || detail?.uploader?.email || '-'}</div>
            {history.length > 0 ? (
              <div className="pt-3">
                <div className="text-foreground font-medium mb-1">최근 이력</div>
                <ul className="space-y-1">
                  {history.map((h, idx) => (
                    <li key={idx} className="flex items-center justify-between gap-2">
                      <span className="truncate max-w-[60%]">{h.action || '-'}</span>
                      <span className="truncate max-w-[40%] text-xs">
                        {h.user?.full_name || h.user?.email || '-'}
                      </span>
                      <span className="text-xs">
                        {h.changed_at ? new Date(h.changed_at).toLocaleString('ko-KR') : '-'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {accessLogs.length > 0 ? (
              <div className="pt-3">
                <div className="text-foreground font-medium mb-1">최근 접근</div>
                <ul className="space-y-1">
                  {accessLogs.map((l, idx) => (
                    <li key={idx} className="flex items-center justify-between gap-2">
                      <span className="truncate max-w-[60%]">{l.action || '-'}</span>
                      <span className="truncate max-w-[40%] text-xs">{l.accessed_by || '-'}</span>
                      <span className="text-xs">
                        {l.created_at ? new Date(l.created_at).toLocaleString('ko-KR') : '-'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="pt-2">
              <Link
                href={`/dashboard/admin/documents/${detail?.id}`}
                className="underline text-blue-600"
              >
                상세 페이지로 이동
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
