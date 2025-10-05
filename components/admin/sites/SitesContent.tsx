'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
// No direct router navigation needed; links used inline
import DataTable, { type Column, type SortDirection } from '@/components/admin/DataTable'
import { Building2, MapPin, RefreshCw, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type { Site, SiteStatus } from '@/types'
import { useConfirm } from '@/components/ui/use-confirm'
import { useToast } from '@/components/ui/use-toast'
// Detail view moved to dedicated page: /dashboard/admin/sites/[id]
import { t } from '@/lib/ui/strings'

function StatsCell({ siteId, type }: { siteId: string; type: 'reports' | 'labor' }) {
  const [value, setValue] = useState<number | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/sites/${siteId}/stats`, { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!active) return
        if (res.ok && json?.success) {
          setValue(
            type === 'reports'
              ? (json.data?.daily_reports_count ?? 0)
              : (json.data?.total_labor_hours ?? 0)
          )
        } else {
          setValue(0)
        }
      } catch {
        if (active) setValue(0)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [siteId, type])

  if (loading) return <>…</>
  if (value == null) return <>-</>
  if (type === 'labor') {
    const v = Math.floor(Number(value) * 10) / 10
    return <>{v.toFixed(1)} 공수</>
  }
  return <>{value}</>
}

interface SitesContentProps {
  initialSites: Site[]
  initialTotal: number
  initialPages: number
  pageSize: number
  initialLoadErrored?: boolean
  fetchBaseUrl?: string // default: /api/admin/sites
  assignmentsBaseUrl?: string // default: /api/admin/sites
  hideHeader?: boolean
}

type StatusFilterOption = 'all' | SiteStatus

const STATUS_OPTIONS: { value: StatusFilterOption; label: string }[] = [
  { value: 'all', label: '전체 상태' },
  { value: 'active', label: '진행 중' },
  { value: 'inactive', label: '중단' },
  { value: 'completed', label: '완료' },
]

const STATUS_LABELS: Record<StatusFilterOption, string> = {
  all: '전체',
  active: '진행 중',
  inactive: '중단',
  completed: '완료',
}

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }
  return date.toLocaleDateString('ko-KR')
}

export function SitesContent({
  initialSites,
  initialTotal,
  initialPages,
  pageSize,
  initialLoadErrored = false,
  fetchBaseUrl = '/api/admin/sites',
  assignmentsBaseUrl = '/api/admin/sites',
  hideHeader = false,
}: SitesContentProps) {
  const [sites, setSites] = useState<Site[]>(initialSites)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(Math.max(initialPages, 1))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    initialLoadErrored ? t('sites.errors.fetchSites') : null
  )

  const [searchTerm, setSearchTerm] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('all')
  const [sortKey, setSortKey] = useState<string>('created_at')
  const [sortDir, setSortDir] = useState<SortDirection>('desc')
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [onlyDeleted, setOnlyDeleted] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const activeCount = useMemo(() => sites.filter(site => site.status === 'active').length, [sites])
  const allSelected = useMemo(
    () => sites.length > 0 && sites.every(s => selected.has(s.id)),
    [sites, selected]
  )
  const selectedCount = selected.size
  const { confirm } = useConfirm()
  const { toast } = useToast()

  const fetchSites = useCallback(
    async (
      nextPage: number,
      overrides?: {
        search?: string
        status?: StatusFilterOption
        sort?: string
        direction?: SortDirection
      }
    ) => {
      setLoading(true)
      setError(null)

      const effectiveSearch = overrides?.search ?? searchTerm
      const effectiveStatus = overrides?.status ?? statusFilter
      const effectiveSort = overrides?.sort ?? sortKey
      const effectiveDirection = overrides?.direction ?? sortDir

      try {
        const params = new URLSearchParams({
          page: String(nextPage),
          limit: String(pageSize),
        })

        if (effectiveSearch.trim()) {
          params.set('search', effectiveSearch.trim())
        }
        if (effectiveStatus !== 'all') {
          params.set('status', effectiveStatus)
        }

        params.set('sort', effectiveSort)
        params.set('direction', effectiveDirection)
        if (onlyDeleted) params.set('only_deleted', '1')
        else if (includeDeleted) params.set('include_deleted', '1')

        const response = await fetch(`${fetchBaseUrl}?${params.toString()}`, { cache: 'no-store' })
        const payload = await response.json()

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || '현장 목록을 불러오지 못했습니다.')
        }

        setSites(payload.data?.sites ?? [])
        setTotal(payload.data?.total ?? 0)
        setPages(Math.max(payload.data?.pages ?? 1, 1))
        setPage(nextPage)
        setSearchTerm(effectiveSearch)
        setSearchInput(effectiveSearch)
        setStatusFilter(effectiveStatus)
        setSelected(new Set())
      } catch (err) {
        console.error('Failed to fetch sites', err)
        setError(err instanceof Error ? err.message : '현장 목록을 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    },
    [pageSize, searchTerm, statusFilter, sortKey, sortDir, includeDeleted, onlyDeleted]
  )

  const handleSearch = useCallback(() => {
    fetchSites(1, { search: searchInput })
  }, [fetchSites, searchInput])

  const handleResetFilters = useCallback(() => {
    setSearchInput('')
    fetchSites(1, { search: '', status: 'all', sort: 'created_at', direction: 'desc' })
    setSortKey('created_at')
    setSortDir('desc')
    setIncludeDeleted(false)
    setOnlyDeleted(false)
  }, [fetchSites])

  const toggleSelectAll = useCallback(() => {
    setSelected(prev => {
      const next = new Set<string>(prev)
      if (sites.length > 0 && sites.every(s => next.has(s.id))) {
        sites.forEach(s => next.delete(s.id))
      } else {
        sites.forEach(s => next.add(s.id))
      }
      return next
    })
  }, [sites])

  const toggleSelectOne = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set<string>(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const bulkUpdateStatus = useCallback(
    async (status: SiteStatus) => {
      if (selected.size === 0) return
      const ok = await confirm({
        title: '상태 변경',
        description: `선택한 ${selected.size}개 현장의 상태를 '${STATUS_LABELS[status as any] || status}'로 변경할까요?`,
        confirmText: '변경',
        cancelText: '취소',
        variant: 'warning',
      })
      if (!ok) return
      try {
        const res = await fetch('/api/admin/sites/bulk-status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ siteIds: Array.from(selected), status }),
        })
        const j = await res.json().catch(() => ({}))
        if (!res.ok || !j?.success) throw new Error(j?.error || '상태 변경 실패')
        toast({ title: '완료', description: '상태가 변경되었습니다.', variant: 'success' })
        await fetchSites(page)
      } catch (e: any) {
        const msg = e?.message || '상태 변경 중 오류가 발생했습니다.'
        setError(msg)
        toast({ title: '오류', description: msg, variant: 'destructive' })
      }
    },
    [selected, fetchSites, page, confirm, toast]
  )

  const bulkDelete = useCallback(async () => {
    if (selected.size === 0) return
    const ok = await confirm({
      title: '현장 삭제',
      description: `선택한 ${selected.size}개 현장을 삭제할까요? 이 작업은 되돌릴 수 없습니다.`,
      confirmText: '삭제',
      cancelText: '취소',
      variant: 'destructive',
    })
    if (!ok) return
    try {
      const res = await fetch('/api/admin/sites/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteIds: Array.from(selected) }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j?.success) throw new Error(j?.error || '삭제 실패')
      toast({
        title: '삭제 완료',
        description: `${selected.size}개 현장이 삭제되었습니다.`,
        variant: 'success',
      })
      await fetchSites(Math.min(page, pages))
    } catch (e: any) {
      const msg = e?.message || '삭제 중 오류가 발생했습니다.'
      setError(msg)
      toast({ title: '오류', description: msg, variant: 'destructive' })
    }
  }, [selected, fetchSites, page, pages, confirm, toast])

  const bulkRestore = useCallback(async () => {
    if (selected.size === 0) return
    const ok = await confirm({
      title: '복구',
      description: `선택한 ${selected.size}개 현장을 복구할까요?`,
      confirmText: '복구',
      cancelText: '취소',
      variant: 'info',
    })
    if (!ok) return
    try {
      const res = await fetch('/api/admin/sites/bulk-restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteIds: Array.from(selected) }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j?.success) throw new Error(j?.error || '복구 실패')
      toast({
        title: '복구 완료',
        description: `${selected.size}개 현장을 복구했습니다.`,
        variant: 'success',
      })
      await fetchSites(1)
    } catch (e: any) {
      const msg = e?.message || '복구 중 오류가 발생했습니다.'
      setError(msg)
      toast({ title: '오류', description: msg, variant: 'destructive' })
    }
  }, [selected, confirm, toast, fetchSites])

  const bulkPurge = useCallback(async () => {
    if (selected.size === 0) return
    const ok = await confirm({
      title: '영구 삭제',
      description: `선택한 ${selected.size}개 현장을 완전히 삭제합니다. 되돌릴 수 없습니다.`,
      confirmText: '영구 삭제',
      cancelText: '취소',
      variant: 'destructive',
    })
    if (!ok) return
    try {
      const res = await fetch('/api/admin/sites/bulk-purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteIds: Array.from(selected) }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j?.success) throw new Error(j?.error || '영구 삭제 실패')
      toast({
        title: '완전 삭제',
        description: `${selected.size}개 현장을 완전히 삭제했습니다.`,
        variant: 'success',
      })
      await fetchSites(1)
    } catch (e: any) {
      const msg = e?.message || '영구 삭제 중 오류가 발생했습니다.'
      setError(msg)
      toast({ title: '오류', description: msg, variant: 'destructive' })
    }
  }, [selected, confirm, toast, fetchSites])

  // Detail navigation handled via anchor links in DataTable cells

  const columns: Column<Site>[] = useMemo(
    () => [
      {
        key: 'select',
        header: (
          <input
            type="checkbox"
            aria-label="전체 선택"
            checked={allSelected}
            onChange={toggleSelectAll}
          />
        ),
        width: 36,
        align: 'center',
        render: s => (
          <input
            type="checkbox"
            aria-label="선택"
            checked={selected.has(s.id)}
            onChange={() => toggleSelectOne(s.id)}
          />
        ),
      },
      {
        key: 'name',
        header: t('sites.table.name'),
        sortable: true,
        render: s => (
          <div className="font-medium text-foreground">
            <a
              href={`/dashboard/admin/sites/${s.id}`}
              className="underline-offset-2 hover:underline"
            >
              {s.name}
            </a>
            <div className="text-xs text-muted-foreground">{s.address}</div>
          </div>
        ),
      },
      {
        key: 'status',
        header: t('sites.table.status'),
        sortable: true,
        render: s => (
          <Badge variant={s.status === 'active' ? 'default' : 'outline'}>
            {STATUS_LABELS[(s.status || 'all') as StatusFilterOption] || s.status || '미정'}
          </Badge>
        ),
      },
      {
        key: 'start_date',
        header: t('sites.table.period'),
        sortable: true,
        render: s => (
          <div>
            {formatDate(s.start_date)} ~ {formatDate(s.end_date || null)}
          </div>
        ),
      },
      {
        key: 'manager_name',
        header: t('sites.table.manager'),
        sortable: true,
        render: s => s.manager_name || '미지정',
      },
      {
        key: 'manager_phone',
        header: t('sites.table.phone'),
        sortable: false,
        render: s => (s as any).manager_phone || (s as any).construction_manager_phone || '-',
      },
      {
        key: 'daily_reports_count',
        header: t('sites.table.dailyReports'),
        sortable: false,
        render: s => <StatsCell siteId={s.id} type="reports" />,
      },
      {
        key: 'total_labor_hours',
        header: t('sites.table.totalLabor'),
        sortable: false,
        render: s => <StatsCell siteId={s.id} type="labor" />,
      },
      {
        key: 'actions',
        header: '작업',
        sortable: false,
        align: 'right',
        render: s => (
          <div className="flex items-center justify-end gap-1">
            <Button asChild variant="ghost" size="sm">
              <a href={`/dashboard/admin/sites/${s.id}`}>상세</a>
            </Button>
            <DropdownMenu
              align="end"
              trigger={
                <Button variant="outline" size="sm">
                  더보기
                </Button>
              }
            >
              <DropdownMenuItem asChild>
                <a href={`/dashboard/admin/sites/${s.id}?tab=edit`}>정보 수정</a>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/admin/sites/${s.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: 'active' }),
                    })
                    const j = await res.json().catch(() => ({}))
                    if (!res.ok || !j?.success) throw new Error(j?.error || '상태 변경 실패')
                    toast({
                      title: '상태 변경',
                      description: '진행 중으로 변경되었습니다.',
                      variant: 'success',
                    })
                    await fetchSites(page)
                  } catch (e: any) {
                    toast({
                      title: '오류',
                      description: e?.message || '상태 변경 실패',
                      variant: 'destructive',
                    })
                  }
                }}
              >
                상태: 진행 중
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/admin/sites/${s.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: 'inactive' }),
                    })
                    const j = await res.json().catch(() => ({}))
                    if (!res.ok || !j?.success) throw new Error(j?.error || '상태 변경 실패')
                    toast({
                      title: '상태 변경',
                      description: '중단으로 변경되었습니다.',
                      variant: 'success',
                    })
                    await fetchSites(page)
                  } catch (e: any) {
                    toast({
                      title: '오류',
                      description: e?.message || '상태 변경 실패',
                      variant: 'destructive',
                    })
                  }
                }}
              >
                상태: 중단
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/admin/sites/${s.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: 'completed' }),
                    })
                    const j = await res.json().catch(() => ({}))
                    if (!res.ok || !j?.success) throw new Error(j?.error || '상태 변경 실패')
                    toast({
                      title: '상태 변경',
                      description: '완료로 변경되었습니다.',
                      variant: 'success',
                    })
                    await fetchSites(page)
                  } catch (e: any) {
                    toast({
                      title: '오류',
                      description: e?.message || '상태 변경 실패',
                      variant: 'destructive',
                    })
                  }
                }}
              >
                상태: 완료
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={async () => {
                  const ok = await confirm({
                    title: '현장 삭제',
                    description: `'${s.name}' 현장을 삭제할까요? 되돌릴 수 없습니다.`,
                    confirmText: '삭제',
                    cancelText: '취소',
                    variant: 'destructive',
                  })
                  if (!ok) return
                  try {
                    const res = await fetch(`/api/admin/sites/${s.id}`, { method: 'DELETE' })
                    const j = await res.json().catch(() => ({}))
                    if (!res.ok || !j?.success) throw new Error(j?.error || '삭제 실패')
                    toast({
                      title: '삭제 완료',
                      description: '현장이 삭제되었습니다.',
                      variant: 'success',
                    })
                    await fetchSites(page)
                  } catch (e: any) {
                    toast({
                      title: '오류',
                      description: e?.message || '삭제 실패',
                      variant: 'destructive',
                    })
                  }
                }}
              >
                삭제
              </DropdownMenuItem>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [allSelected, selected, toggleSelectAll, toggleSelectOne]
  )

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{t('sites.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('sites.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/dashboard/admin/sites/new"
              className={buttonVariants({ variant: 'primary', size: 'standard' })}
              role="button"
            >
              {t('sites.create')}
            </a>
            <Button
              variant="outline"
              size="standard"
              onClick={() => fetchSites(page)}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              {t('common.refresh')}
            </Button>
          </div>
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">{t('sites.stats.total')}</p>
              <p className="text-2xl font-semibold text-foreground">{total.toLocaleString()}</p>
            </div>
            <Building2 className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">{t('sites.stats.activeOnPage')}</p>
              <p className="text-lg font-medium text-foreground">{activeCount}</p>
            </div>
            <Badge variant="default" className="h-fit">
              진행 중
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">{t('users.filters.statusSelected')}</p>
              <p className="text-lg font-medium text-foreground">{STATUS_LABELS[statusFilter]}</p>
            </div>
            <MapPin className="h-7 w-7 text-muted-foreground" />
          </CardContent>
        </Card>
      </section>

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <div className="relative flex-1 md:w-72">
              <Input
                placeholder={t('sites.searchPlaceholder')}
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
              value={statusFilter}
              onValueChange={value => fetchSites(1, { status: value as StatusFilterOption })}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('sites.statusFilter')} />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 text-sm text-muted-foreground select-none">
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={e => {
                  const v = e.target.checked
                  setIncludeDeleted(v)
                  if (!v) setOnlyDeleted(false)
                  // reset to page 1 with current filters
                  fetchSites(1)
                }}
              />
              삭제 포함
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground select-none">
              <input
                type="checkbox"
                checked={onlyDeleted}
                onChange={e => {
                  const v = e.target.checked
                  setOnlyDeleted(v)
                  setIncludeDeleted(v || includeDeleted)
                  fetchSites(1)
                }}
                disabled={!includeDeleted && !onlyDeleted}
                title={!includeDeleted && !onlyDeleted ? '먼저 삭제 포함을 켜세요' : undefined}
              />
              삭제됨만 보기
            </label>
          </div>
          <Button variant="ghost" size="sm" onClick={handleResetFilters} disabled={loading}>
            {t('common.reset')}
          </Button>
        </div>

        {selectedCount > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 p-3 text-sm">
            <div>
              선택됨: <span className="font-medium text-foreground">{selectedCount}</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => bulkUpdateStatus('active')}>
                진행 중으로
              </Button>
              <Button size="sm" variant="outline" onClick={() => bulkUpdateStatus('inactive')}>
                중단으로
              </Button>
              <Button size="sm" variant="outline" onClick={() => bulkUpdateStatus('completed')}>
                완료로
              </Button>
              <Button size="sm" variant="danger" onClick={bulkDelete}>
                삭제
              </Button>
              {onlyDeleted && (
                <>
                  <Button size="sm" variant="secondary" onClick={bulkRestore}>
                    복구
                  </Button>
                  <Button size="sm" variant="danger" onClick={bulkPurge}>
                    영구 삭제
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        <div className="mt-6">
          {loading && <LoadingSpinner />}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>{t('sites.errors.fetchList')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && sites.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Search className="h-8 w-8" />
              <p>{t('sites.empty')}</p>
            </div>
          ) : (
            <DataTable
              data={sites}
              columns={columns}
              rowKey="id"
              initialSort={{ columnKey: sortKey, direction: sortDir }}
              onSortChange={(key, dir) => {
                setSortKey(key)
                setSortDir(dir)
                setPage(1)
                fetchSites(1, { sort: key, direction: dir })
              }}
            />
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <div>
            총 <span className="font-medium text-foreground">{total.toLocaleString()}</span> 개 현장
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchSites(Math.max(page - 1, 1))}
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
              onClick={() => fetchSites(Math.min(page + 1, pages))}
              disabled={loading || page >= pages}
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
      </section>

      {null}
    </div>
  )
}
