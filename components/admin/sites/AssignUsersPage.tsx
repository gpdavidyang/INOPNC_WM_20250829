'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type AvailableWorker = {
  id: string
  full_name?: string
  email?: string
  phone?: string
  role?: string
  company?: string
}

export default function AssignUsersPage({ siteId }: { siteId: string }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<AvailableWorker[]>([])
  const [assigned, setAssigned] = useState<any[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  // 단순화: 역할/필터/정렬 상태 제거
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [availableTotal, setAvailableTotal] = useState<number | null>(null)
  // 단순화: 자동 이동 제거

  // Assigned panel: 검색만 유지
  const [assignedQuery, setAssignedQuery] = useState('')
  const [assignedPage, setAssignedPage] = useState(0)
  const [assignedPageSize, setAssignedPageSize] = useState(20)

  // Fetch available users (server-side filters/sort/pagination)
  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (query.trim()) params.set('q', query.trim())
        params.set('limit', String(pageSize))
        params.set('offset', String(page * pageSize))
        const res = await fetch(
          `/api/admin/sites/${siteId}/workers/available?${params.toString()}`,
          {
            cache: 'no-store',
            credentials: 'include',
          }
        )
        const j = await res.json().catch(() => ({}))
        if (!active) return
        if (res.ok && Array.isArray(j?.data)) {
          setItems(j.data)
          setAvailableTotal(typeof j?.total === 'number' ? j.total : (j?.total ?? j?.count ?? null))
        } else {
          setItems([])
          setAvailableTotal(0)
        }
      } catch (e: any) {
        if (active) setError(e?.message || '가용 인원을 불러오지 못했습니다.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [siteId, query, page, pageSize])

  // Fetch assigned users (server-side filters/sort/pagination)
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const params = new URLSearchParams()
        if (assignedQuery.trim()) params.set('q', assignedQuery.trim())
        params.set('limit', String(assignedPageSize))
        params.set('offset', String(assignedPage * assignedPageSize))
        const res = await fetch(`/api/admin/sites/${siteId}/assignments?${params.toString()}`, {
          cache: 'no-store',
          credentials: 'include',
        })
        const j = await res.json().catch(() => ({}))
        if (!active) return
        if (res.ok && Array.isArray(j?.data)) {
          setAssigned(j.data)
          setAssignedTotal(typeof j?.total === 'number' ? j.total : (j?.total ?? null))
        } else {
          setAssigned([])
          setAssignedTotal(0)
        }
      } catch {
        /* noop */
      }
    })()
    return () => {
      active = false
    }
  }, [siteId, assignedQuery, assignedPage, assignedPageSize])

  // 소속 옵션 계산 제거

  // Normalize each row with a stable selection key so selection works even if id is missing/number
  const getKey = (w: Partial<AvailableWorker> & { user_id?: string | number }): string => {
    const raw = (w.id ?? w.user_id ?? w.email ?? w.phone ?? '') as string | number
    return String(raw)
  }
  const filtered = useMemo(() => items, [items])

  const getId = (w: Partial<AvailableWorker> & { user_id?: string | number }): string | null => {
    const raw = (w.id ?? w.user_id) as string | number | undefined
    return raw != null ? String(raw) : null
  }

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((availableTotal || 0) / pageSize)),
    [availableTotal, pageSize]
  )
  const paged = useMemo(() => {
    // Server-paged: items already current page rows
    return filtered
  }, [filtered])

  // 배정 소속 옵션 계산 제거

  const assignedFiltered = useMemo(() => assigned, [assigned])

  const [assignedTotal, setAssignedTotal] = useState<number>(0)
  const assignedTotalPages = useMemo(
    () => Math.max(1, Math.ceil((assignedTotal || 0) / assignedPageSize)),
    [assignedTotal, assignedPageSize]
  )
  const assignedPaged = useMemo(() => {
    // Server-paged: assigned already current page rows
    return assignedFiltered
  }, [assignedFiltered])

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelected(prev => {
      const next = new Set(prev)
      const all = paged.map(w => getKey(w))
      const allSelected = all.length > 0 && all.every(id => next.has(id))
      if (allSelected) all.forEach(id => next.delete(id))
      else all.forEach(id => next.add(id))
      return next
    })
  }

  const assign = async () => {
    if (selected.size === 0) return
    setAssigning(true)
    setError(null)
    try {
      // Map selection keys back to actual user IDs for API
      const workerIds = items
        .filter(w => selected.has(getKey(w)))
        .map(w => getId(w))
        .filter((v): v is string => !!v)

      if (workerIds.length === 0) {
        setAssigning(false)
        toast({
          title: '선택 오류',
          description: '선택된 사용자 ID를 찾을 수 없습니다.',
          variant: 'destructive' as any,
        })
        return
      }
      const res = await fetch(`/api/admin/sites/${siteId}/workers/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worker_ids: workerIds }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || j?.error)
        throw new Error(j?.details || j?.error || res.statusText || '배정 실패')
      // 자동 이동 제거: 현재 페이지에서 소프트 리프레시
      // Soft refresh lists
      toast({
        title: '배정 완료',
        description: `${selected.size}명이 배정되었습니다.`,
        variant: 'success' as any,
      })
      setSelected(new Set())
      // Re-fetch data (soft)
      try {
        setLoading(true)
        const p1 = new URLSearchParams()
        if (query.trim()) p1.set('q', query.trim())
        p1.set('limit', String(pageSize))
        p1.set('offset', String(page * pageSize))
        const res1 = await fetch(`/api/admin/sites/${siteId}/workers/available?${p1.toString()}`, {
          cache: 'no-store',
          credentials: 'include',
        })
        const j1 = await res1.json().catch(() => ({}))
        if (Array.isArray(j1?.data)) setItems(j1.data)
        const p2 = new URLSearchParams()
        if (assignedQuery.trim()) p2.set('q', assignedQuery.trim())
        p2.set('limit', String(assignedPageSize))
        p2.set('offset', String(assignedPage * assignedPageSize))
        const res2 = await fetch(`/api/admin/sites/${siteId}/assignments?${p2.toString()}`, {
          cache: 'no-store',
          credentials: 'include',
        })
        const j2 = await res2.json().catch(() => ({}))
        if (Array.isArray(j2?.data)) {
          setAssigned(j2.data)
          setAssignedTotal(typeof j2?.total === 'number' ? j2.total : (j2?.total ?? 0))
        }
      } finally {
        setLoading(false)
      }
    } catch (e: any) {
      setError(e?.message || '배정 중 오류가 발생했습니다.')
      toast({
        title: '배정 실패',
        description: e?.message || '배정 중 오류가 발생했습니다.',
        variant: 'destructive' as any,
      })
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="이름/이메일/회사 검색"
            className="w-64"
          />
          <Button variant="outline" size="sm" onClick={() => setQuery('')} disabled={!query}>
            초기화
          </Button>
        </div>
        <div className="flex items-center flex-wrap gap-3 text-sm">
          <span className="text-muted-foreground">
            가용 인원:{' '}
            <span className="text-foreground font-medium">{availableTotal ?? items.length}</span>
          </span>
          <span className="text-muted-foreground">
            선택: <span className="text-foreground font-medium">{selected.size}</span>
          </span>
          {/* 단순화: 역할/자동이동/필터/정렬 컨트롤 제거 */}
          <Button size="sm" onClick={assign} disabled={assigning || selected.size === 0}>
            {assigning ? '배정 중…' : `배정 (${selected.size})`}
          </Button>
        </div>
      </div>

      {error && <div className="mb-2 text-sm text-destructive">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Available users */}
        <div className="overflow-x-auto rounded border">
          <div className="px-3 py-2 text-xs text-muted-foreground">가용 사용자</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[64px]">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      role="checkbox"
                      aria-label="전체 선택"
                      onChange={toggleAll}
                      checked={filtered.length > 0 && filtered.every(w => selected.has(getKey(w)))}
                      className="h-4 w-4 border border-gray-400 rounded-sm accent-blue-600"
                    />
                    <span className="text-xs">선택</span>
                  </label>
                </TableHead>
                <TableHead>이름</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>역할</TableHead>
                <TableHead>회사</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                    불러오는 중…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                    가용 인원이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                paged.map(w => (
                  <TableRow key={getKey(w)}>
                    <TableCell>
                      <input
                        type="checkbox"
                        role="checkbox"
                        className="h-4 w-4 border border-gray-400 rounded-sm accent-blue-600"
                        checked={selected.has(getKey(w))}
                        onChange={() => toggle(getKey(w))}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {w.full_name || '-'}
                    </TableCell>
                    <TableCell>{w.email || '-'}</TableCell>
                    <TableCell>{w.role || '-'}</TableCell>
                    <TableCell>{w.company || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between p-2 text-xs text-muted-foreground">
            <div>
              {availableTotal ?? 0}명 중 {(availableTotal ?? 0) === 0 ? 0 : page * pageSize + 1}–
              {Math.min((page + 1) * pageSize, availableTotal ?? 0)} 표시
            </div>
            <div className="flex items-center gap-2">
              <label>페이지 크기</label>
              <select
                value={pageSize}
                onChange={e => {
                  setPage(0)
                  setPageSize(Number(e.target.value))
                }}
                className="rounded border px-2 py-1"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                이전
              </Button>
              <span>
                페이지 {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page + 1 >= totalPages}
              >
                다음
              </Button>
            </div>
          </div>
        </div>

        {/* Currently assigned */}
        <div className="overflow-x-auto rounded border">
          <div className="px-3 py-2 text-xs text-muted-foreground">현재 배정된 사용자</div>
          <div className="flex items-center gap-2 px-3 pb-2">
            <Input
              value={assignedQuery}
              onChange={e => {
                setAssignedPage(0)
                setAssignedQuery(e.target.value)
              }}
              placeholder="이름/이메일/소속/역할 검색"
              className="w-64"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>소속</TableHead>
                <TableHead>역할</TableHead>
                <TableHead>배정일</TableHead>
                <TableHead>작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignedFiltered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                    배정된 사용자가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                assignedPaged.map((a: any, idx: number) => (
                  <TableRow key={`${a?.id ?? a?.user_id ?? 'a'}-${idx}`}>
                    <TableCell className="font-medium text-foreground">
                      {a?.profile?.full_name || '-'}
                    </TableCell>
                    <TableCell>{a?.profile?.organization?.name || '-'}</TableCell>
                    <TableCell>{a?.role || '-'}</TableCell>
                    <TableCell>
                      {a?.assigned_date
                        ? new Date(a.assigned_date).toLocaleDateString('ko-KR')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="text-xs underline text-red-600"
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/admin/sites/${siteId}/workers/unassign`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ worker_id: a.user_id }),
                            })
                            const j = await res.json().catch(() => ({}))
                            if (!res.ok || j?.error) throw new Error(j?.error || '제외 실패')
                            // refresh lists
                            toast({
                              title: '제외 완료',
                              description: `${a?.profile?.full_name || ''} 제외됨`,
                              variant: 'success' as any,
                            })
                            // Soft refresh
                            const p1 = new URLSearchParams()
                            if (query.trim()) p1.set('q', query.trim())
                            p1.set('limit', String(pageSize))
                            p1.set('offset', String(page * pageSize))
                            const res1 = await fetch(
                              `/api/admin/sites/${siteId}/workers/available?${p1.toString()}`,
                              { cache: 'no-store', credentials: 'include' }
                            )
                            const j1 = await res1.json().catch(() => ({}))
                            if (Array.isArray(j1?.data)) setItems(j1.data)
                            const p2 = new URLSearchParams()
                            if (assignedQuery.trim()) p2.set('q', assignedQuery.trim())
                            p2.set('limit', String(assignedPageSize))
                            p2.set('offset', String(assignedPage * assignedPageSize))
                            const res2 = await fetch(
                              `/api/admin/sites/${siteId}/assignments?${p2.toString()}`,
                              { cache: 'no-store', credentials: 'include' }
                            )
                            const j2 = await res2.json().catch(() => ({}))
                            if (Array.isArray(j2?.data)) {
                              setAssigned(j2.data)
                              setAssignedTotal(
                                typeof j2?.total === 'number' ? j2.total : (j2?.total ?? 0)
                              )
                            }
                          } catch {
                            toast({
                              title: '제외 실패',
                              description: '제외 중 오류가 발생했습니다.',
                              variant: 'destructive' as any,
                            })
                          }
                        }}
                      >
                        제외
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between p-2 text-xs text-muted-foreground">
            <div>
              {assignedTotal}명 중 {assignedTotal === 0 ? 0 : assignedPage * assignedPageSize + 1}–
              {Math.min((assignedPage + 1) * assignedPageSize, assignedTotal)} 표시
            </div>
            <div className="flex items-center gap-2">
              <label>페이지 크기</label>
              <select
                value={assignedPageSize}
                onChange={e => {
                  setAssignedPage(0)
                  setAssignedPageSize(Number(e.target.value))
                }}
                className="rounded border px-2 py-1"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAssignedPage(p => Math.max(0, p - 1))}
                disabled={assignedPage === 0}
              >
                이전
              </Button>
              <span>
                페이지 {assignedPage + 1} / {assignedTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAssignedPage(p => Math.min(assignedTotalPages - 1, p + 1))}
                disabled={assignedPage + 1 >= assignedTotalPages}
              >
                다음
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
