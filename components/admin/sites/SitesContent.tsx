'use client'

import { useCallback, useMemo, useState } from 'react'
import { Building2, MapPin, RefreshCw, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type { Site, SiteStatus } from '@/types'
import { SiteDetailSheet, type SiteAssignmentSummary } from './SiteDetailSheet'

interface SitesContentProps {
  initialSites: Site[]
  initialTotal: number
  initialPages: number
  pageSize: number
  initialLoadErrored?: boolean
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
}: SitesContentProps) {
  const [sites, setSites] = useState<Site[]>(initialSites)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(Math.max(initialPages, 1))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialLoadErrored ? '초기 현장 데이터를 불러오지 못했습니다.' : null)

  const [searchTerm, setSearchTerm] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('all')

  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [assignments, setAssignments] = useState<SiteAssignmentSummary[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  const activeCount = useMemo(() => sites.filter((site) => site.status === 'active').length, [sites])

  const fetchSites = useCallback(
    async (
      nextPage: number,
      overrides?: {
        search?: string
        status?: StatusFilterOption
      }
    ) => {
      setLoading(true)
      setError(null)

      const effectiveSearch = overrides?.search ?? searchTerm
      const effectiveStatus = overrides?.status ?? statusFilter

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

        const response = await fetch(`/api/admin/sites?${params.toString()}`, { cache: 'no-store' })
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
      } catch (err) {
        console.error('Failed to fetch sites', err)
        setError(err instanceof Error ? err.message : '현장 목록을 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    },
    [pageSize, searchTerm, statusFilter]
  )

  const handleSearch = useCallback(() => {
    fetchSites(1, { search: searchInput })
  }, [fetchSites, searchInput])

  const handleResetFilters = useCallback(() => {
    setSearchInput('')
    fetchSites(1, { search: '', status: 'all' })
  }, [fetchSites])

  const fetchAssignments = useCallback(async (site: Site) => {
    setDetailLoading(true)
    setSelectedSite(site)
    try {
      const response = await fetch(`/api/admin/sites/${site.id}/assignments`, { cache: 'no-store' })
      const payload = await response.json()

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || '배정 정보를 불러오지 못했습니다.')
      }

      const normalized: SiteAssignmentSummary[] = (payload.data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id || item.profile?.id,
        user_name: item.profile?.full_name || '이름 미등록',
        user_role: item.profile?.role || item.role || '작업자',
        user_email: item.profile?.email,
        user_phone: item.profile?.phone,
        assigned_at: item.assigned_date || item.assigned_at,
        is_active: item.is_active,
      }))

      setAssignments(normalized)
    } catch (err) {
      console.error('Failed to load site assignments', err)
      setAssignments([])
      setError(err instanceof Error ? err.message : '배정 정보를 불러오지 못했습니다.')
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const handleCloseDetail = useCallback(() => {
    setSelectedSite(null)
    setAssignments([])
    setDetailLoading(false)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">현장 관리</h1>
          <p className="text-sm text-muted-foreground">진행 중인 현장과 담당자 배정을 관리합니다.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchSites(page)} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">전체 현장</p>
              <p className="text-2xl font-semibold text-foreground">{total.toLocaleString()}</p>
            </div>
            <Building2 className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">활성 현장 (현재 페이지)</p>
              <p className="text-lg font-medium text-foreground">{activeCount}</p>
            </div>
            <Badge variant="default" className="h-fit">진행 중</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">선택된 상태</p>
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
                placeholder="현장명 또는 주소 검색"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleSearch()
                  }
                }}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <Button variant="secondary" onClick={handleSearch} disabled={loading}>
              검색
            </Button>
            <Select
              value={statusFilter}
              onValueChange={(value) => fetchSites(1, { status: value as StatusFilterOption })}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" size="sm" onClick={handleResetFilters} disabled={loading}>
            필터 초기화
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

          {!loading && sites.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Search className="h-8 w-8" />
              <p>조건에 맞는 현장이 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>현장명</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>기간</TableHead>
                    <TableHead>관리자</TableHead>
                    <TableHead>연락처</TableHead>
                    <TableHead className="text-right">상세</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sites.map((site) => (
                    <TableRow key={site.id} className="cursor-pointer" onClick={() => fetchAssignments(site)}>
                      <TableCell>
                        <div className="font-medium text-foreground">{site.name}</div>
                        <div className="text-xs text-muted-foreground">{site.address}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={site.status === 'active' ? 'default' : 'outline'}>
                          {STATUS_LABELS[(site.status || 'all') as StatusFilterOption] || site.status || '미정'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>{formatDate(site.start_date)} ~ {formatDate(site.end_date)}</div>
                      </TableCell>
                      <TableCell>{site.manager_name || site.construction_manager_name || '미지정'}</TableCell>
                      <TableCell>{site.construction_manager_phone || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={(event) => {
                          event.stopPropagation()
                          fetchAssignments(site)
                        }}>
                          상세 보기
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
              이전
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
              다음
            </Button>
          </div>
        </div>
      </section>

      <SiteDetailSheet
        open={Boolean(selectedSite)}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDetail()
          }
        }}
        site={selectedSite}
        assignments={assignments}
        loading={detailLoading}
      />
    </div>
  )
}
