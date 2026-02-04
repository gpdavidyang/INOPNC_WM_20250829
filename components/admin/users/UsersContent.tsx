'use client'

import type { UserWithSites } from '@/app/actions/admin/users'
import AdminActionButtons from '@/components/admin/AdminActionButtons'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import EmptyState from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getRoleLabel } from '@/lib/auth/role-labels'
import { t } from '@/lib/ui/strings'
import { cn } from '@/lib/utils'
import type { UserRole, UserStatus } from '@/types'
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'

interface UsersContentProps {
  initialUsers: UserWithSites[]
  initialTotal: number
  initialPages: number
  pageSize: number
  currentAdminRole: string
  initialLoadErrored?: boolean
}

type RoleFilterOption = 'all' | UserRole
type StatusFilterOption = 'all' | UserStatus
type SortDirection = 'asc' | 'desc'
type SortColumn = 'name' | 'role' | 'organization' | 'status' | 'last_activity'

const ROLE_OPTIONS: { value: RoleFilterOption; label: string }[] = [
  { value: 'all', label: '전체 역할' },
  { value: 'admin', label: '본사관리자' },
  { value: 'system_admin', label: '시스템관리자' },
  { value: 'site_manager', label: '현장관리자' },
  { value: 'customer_manager', label: '소속사' },
  { value: 'worker', label: '작업자' },
]

const STATUS_OPTIONS: { value: StatusFilterOption; label: string }[] = [
  { value: 'all', label: '전체 상태' },
  { value: 'active', label: '활성' },
  { value: 'inactive', label: '비활성' },
  { value: 'suspended', label: '중지' },
]

const ROLE_BADGE_VARIANT: Record<UserRole, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  system_admin: 'default',
  site_manager: 'secondary',
  customer_manager: 'secondary',
  worker: 'outline',
}

const ROLE_FILTER_LABELS: Record<RoleFilterOption, string> = {
  all: '전체',
  admin: '본사관리자',
  system_admin: '시스템관리자',
  site_manager: '현장관리자',
  customer_manager: '소속사',
  worker: '작업자',
}

// Use shared role label helper for consistency (SSR/CSR)

const STATUS_LABELS: Record<StatusFilterOption, string> = {
  all: '전체',
  active: '활성',
  inactive: '비활성',
  suspended: '중지',
}

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }
  return date.toLocaleDateString('ko-KR')
}

export function UsersContent({
  initialUsers,
  initialTotal,
  initialPages,
  pageSize,
  currentAdminRole,
  initialLoadErrored = false,
}: UsersContentProps) {
  const [users, setUsers] = useState<UserWithSites[]>(initialUsers)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(Math.max(initialPages, 1))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    initialLoadErrored ? t('users.errors.fetchUsers') : null
  )

  const [searchTerm, setSearchTerm] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilterOption>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('all')
  const [sortKey, setSortKey] = useState<SortColumn | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const router = useRouter()

  const isSystemAdmin = useMemo(() => currentAdminRole === 'system_admin', [currentAdminRole])

  const fetchUsers = useCallback(
    async (
      nextPage: number,
      overrides?: {
        search?: string
        role?: RoleFilterOption
        status?: StatusFilterOption
        sortKey?: SortColumn | null
        sortDirection?: SortDirection
      }
    ) => {
      setLoading(true)
      setError(null)

      const effectiveSearch = overrides?.search ?? searchTerm
      const effectiveRole = overrides?.role ?? roleFilter
      const effectiveStatus = overrides?.status ?? statusFilter
      const effectiveSortKey =
        overrides && Object.prototype.hasOwnProperty.call(overrides, 'sortKey')
          ? (overrides.sortKey ?? null)
          : sortKey
      const effectiveSortDirection = overrides?.sortDirection ?? sortDirection

      try {
        const params = new URLSearchParams({
          page: String(nextPage),
          limit: String(pageSize),
        })

        if (effectiveSearch.trim()) {
          params.set('search', effectiveSearch.trim())
        }
        if (effectiveRole !== 'all') {
          params.set('role', effectiveRole)
        }
        if (effectiveStatus !== 'all') {
          params.set('status', effectiveStatus)
        }
        if (effectiveSortKey) {
          params.set('sort_by', effectiveSortKey)
          params.set('sort_order', effectiveSortDirection)
        }

        const response = await fetch(`/api/admin/users?${params.toString()}`, { cache: 'no-store' })
        const payload = await response.json()

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || '사용자 목록을 불러오지 못했습니다.')
        }

        setUsers(payload.data?.users ?? [])
        setTotal(payload.data?.total ?? 0)
        setPages(Math.max(payload.data?.pages ?? 1, 1))
        setPage(nextPage)
        setSearchTerm(effectiveSearch)
        setSearchInput(effectiveSearch)
        setRoleFilter(effectiveRole)
        setStatusFilter(effectiveStatus)
        setSortKey(effectiveSortKey)
        setSortDirection(effectiveSortDirection)
      } catch (err) {
        console.error('Failed to fetch users', err)
        setError(err instanceof Error ? err.message : '사용자 목록을 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    },
    [pageSize, roleFilter, searchTerm, statusFilter, sortDirection, sortKey]
  )

  const handleSearch = useCallback(() => {
    fetchUsers(1, { search: searchInput })
  }, [fetchUsers, searchInput])

  const handleResetFilters = useCallback(() => {
    setSearchInput('')
    fetchUsers(1, { search: '', role: 'all', status: 'all' })
  }, [fetchUsers])

  const handleSort = useCallback(
    (column: SortColumn) => {
      const nextDirection = sortKey === column ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'asc'
      setSortKey(column)
      setSortDirection(nextDirection)
      fetchUsers(1, { sortKey: column, sortDirection: nextDirection })
    },
    [fetchUsers, sortDirection, sortKey]
  )

  const handleOpenDetail = useCallback(
    (userId: string) => {
      router.push(`/dashboard/admin/users/${userId}`)
    },
    [router]
  )

  const renderSortableHeader = useCallback(
    (label: string, column: SortColumn, align: 'left' | 'right' = 'left') => {
      const isActive = sortKey === column
      const nextOrder = isActive && sortDirection === 'asc' ? 'desc' : 'asc'
      const icon = !isActive ? (
        <ArrowUpDown className="h-4 w-4 text-white/50" />
      ) : sortDirection === 'asc' ? (
        <ArrowUp className="h-4 w-4 text-white" />
      ) : (
        <ArrowDown className="h-4 w-4 text-white" />
      )

      return (
        <button
          type="button"
          onClick={() => handleSort(column)}
          className={cn(
            'flex items-center gap-1.5 text-[11px] font-black uppercase tracking-tighter text-white/80 hover:text-white transition-all',
            align === 'right' && 'justify-end w-full'
          )}
        >
          <span>{label}</span>
          {icon}
        </button>
      )
    },
    [handleSort, sortDirection, sortKey]
  )

  const getAriaSort = useCallback(
    (column: SortColumn) => {
      if (sortKey !== column) return 'none'
      return sortDirection === 'asc' ? 'ascending' : 'descending'
    },
    [sortDirection, sortKey]
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* v1.66 High-Density Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-indigo-50/50 rounded-2xl p-5 border-none shadow-sm shadow-indigo-100/20">
          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tight mb-1">
            전체 사용자
          </p>
          <div className="text-2xl font-black text-indigo-900 italic tracking-tighter flex items-center gap-2">
            {total.toLocaleString()}
            <span className="text-xs font-semibold text-indigo-400 not-italic">명</span>
          </div>
        </div>
        <div className="bg-emerald-50/50 rounded-2xl p-5 border-none shadow-sm shadow-emerald-100/20">
          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-tight mb-1">
            활성 계정
          </p>
          <div className="text-2xl font-black text-emerald-700 italic tracking-tighter flex items-center gap-2">
            {users.filter(u => u.status === 'active').length}
            <span className="text-xs font-semibold text-emerald-400 not-italic">명</span>
          </div>
        </div>
        <div className="bg-amber-50/50 rounded-2xl p-5 border-none shadow-sm shadow-amber-100/20">
          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-tight mb-1">
            비활성 계정
          </p>
          <div className="text-2xl font-black text-amber-700 italic tracking-tighter">
            {users.filter(u => u.status === 'inactive').length}
          </div>
        </div>
        <div className="bg-slate-50 rounded-2xl p-5 border-none shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1">
            최근 접속자 (오늘)
          </p>
          <div className="text-2xl font-black text-slate-600 italic tracking-tighter flex items-center gap-1.5 line-clamp-1">
            N/A
          </div>
        </div>
      </section>

      <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/50 overflow-hidden">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-b from-gray-50/20 to-transparent px-8 py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-end gap-6">
            {isSystemAdmin && (
              <div className="flex items-center gap-2 bg-slate-50/80 p-1.5 rounded-2xl border border-slate-100 shadow-inner">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled
                  className="h-9 px-4 rounded-xl opacity-40 font-semibold text-xs"
                >
                  + 사용자 초대
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="bg-slate-50/30 px-8 py-5 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col md:flex-row items-center gap-3 flex-1">
                <div className="relative w-full md:w-80 group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <Input
                    placeholder="사용자명, 이메일 검색..."
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    className="h-11 pl-10 pr-4 rounded-xl bg-white border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-100/50 transition-all font-medium text-sm"
                  />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Select
                    value={roleFilter}
                    onValueChange={v => fetchUsers(1, { role: v as RoleFilterOption })}
                  >
                    <SelectTrigger className="h-11 w-full md:w-[140px] rounded-xl bg-white border-slate-200 font-semibold text-xs">
                      <SelectValue placeholder="역할 필터" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {ROLE_OPTIONS.map(o => (
                        <SelectItem
                          key={o.value}
                          value={o.value}
                          className="font-bold text-xs py-2.5"
                        >
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={statusFilter}
                    onValueChange={v => fetchUsers(1, { status: v as StatusFilterOption })}
                  >
                    <SelectTrigger className="h-11 w-full md:w-[140px] rounded-xl bg-white border-slate-200 font-semibold text-xs">
                      <SelectValue placeholder="상태 필터" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {STATUS_OPTIONS.map(o => (
                        <SelectItem
                          key={o.value}
                          value={o.value}
                          className="font-bold text-xs py-2.5"
                        >
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <Button
                    onClick={handleSearch}
                    disabled={loading}
                    className="h-11 px-6 rounded-xl bg-[#1A254F] hover:bg-[#2A355F] font-semibold text-sm shadow-md shadow-blue-900/10"
                  >
                    검색
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => fetchUsers(page)}
                    disabled={loading}
                    className="h-11 px-4 rounded-xl border-slate-200 bg-slate-50/50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 font-semibold text-sm transition-all"
                  >
                    새로고침
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleResetFilters}
                    className="h-11 px-4 rounded-xl border-slate-200 bg-slate-50/50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 font-semibold text-sm transition-all"
                  >
                    초기화
                  </Button>
                </div>
              </div>

              <div className="hidden lg:flex items-center gap-4 border-l border-slate-200 pl-6 shrink-0">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                    적용된 필터
                  </p>
                  <p className="text-xs font-semibold text-[#1A254F] line-clamp-1 max-w-[120px]">
                    {ROLE_FILTER_LABELS[roleFilter]} / {STATUS_LABELS[statusFilter]}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="min-h-[400px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <LoadingSpinner className="w-10 h-10 text-indigo-500" />
                <p className="text-xs font-bold text-slate-400 animate-pulse">
                  데이터를 불러오는 중입니다...
                </p>
              </div>
            ) : error ? (
              <div className="p-8">
                <Alert variant="destructive" className="rounded-2xl border-rose-100 bg-rose-50/50">
                  <AlertTitle className="font-black">오류 발생</AlertTitle>
                  <AlertDescription className="font-medium text-xs opacity-80">
                    {error}
                  </AlertDescription>
                </Alert>
              </div>
            ) : users.length === 0 ? (
              <div className="py-24">
                <EmptyState description="검색 조건에 맞는 사용자가 존재하지 않습니다." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-[#8da0cd]">
                    <TableRow className="hover:bg-[#8da0cd] border-none">
                      <TableHead className="px-8 h-12" aria-sort={getAriaSort('name')}>
                        {renderSortableHeader('사용자 정보', 'name')}
                      </TableHead>
                      <TableHead className="px-6 h-12" aria-sort={getAriaSort('role')}>
                        {renderSortableHeader('역할', 'role')}
                      </TableHead>
                      <TableHead className="px-6 h-12" aria-sort={getAriaSort('organization')}>
                        {renderSortableHeader('소속 기관/업체', 'organization')}
                      </TableHead>
                      <TableHead className="px-6 h-12" aria-sort={getAriaSort('status')}>
                        {renderSortableHeader('계정 상태', 'status')}
                      </TableHead>
                      <TableHead className="px-6 h-12" aria-sort={getAriaSort('last_activity')}>
                        {renderSortableHeader('최근 활동', 'last_activity')}
                      </TableHead>
                      <TableHead className="px-8 h-12 text-right text-[11px] font-black uppercase text-white/80 tracking-tighter">
                        관리 도구
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(user => (
                      <TableRow
                        key={user.id}
                        className="group border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer"
                        onClick={() => handleOpenDetail(user.id)}
                      >
                        <TableCell className="px-8 py-5">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-black text-[#1A254F] group-hover:text-indigo-600 transition-colors">
                              {user.full_name || t('users.noName')}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium tracking-tight">
                              {user.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-5">
                          <Badge
                            variant="outline"
                            className="border-indigo-100 bg-indigo-50/30 text-indigo-700 font-bold text-[10px] h-5 px-2.5 rounded-lg whitespace-nowrap shadow-none"
                          >
                            <span suppressHydrationWarning>{getRoleLabel(user.role)}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-5">
                          <span className="text-xs font-medium text-slate-600 truncate max-w-[150px] inline-block">
                            {user.organization?.name || '소속 없음'}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-5">
                          {user.status === 'active' ? (
                            <Badge
                              variant="success"
                              className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold text-[10px] h-5 rounded-lg"
                            >
                              활성
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-slate-100 text-slate-400 border-none font-bold text-[10px] h-5 rounded-lg"
                            >
                              {STATUS_LABELS[user.status as StatusFilterOption] || '비활성'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-5 font-medium text-slate-400 text-xs text-center">
                          {formatDate(user.work_log_stats?.last_report_date)}
                        </TableCell>
                        <TableCell
                          className="px-8 py-5 text-right"
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-lg border-slate-200 text-xs font-semibold px-3 hover:bg-white hover:text-indigo-600"
                              onClick={() => handleOpenDetail(user.id)}
                            >
                              상세
                            </Button>
                            <AdminActionButtons
                              size="compact"
                              stopPropagation
                              detailHref={`/dashboard/admin/users/${user.id}`}
                              editHref={`/dashboard/admin/users/${user.id}/edit`}
                              deleteHref={`/api/admin/users/${user.id}`}
                              onDeleted={() => {
                                setUsers(prev => prev.filter(u => u.id !== user.id))
                                setTotal(prev => Math.max(prev - 1, 0))
                              }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <div className="px-8 py-6 bg-slate-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              전체 <span className="text-[#1A254F] font-bold">{total.toLocaleString()}</span> 명
            </div>

            <div className="flex items-center gap-5">
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUsers(Math.max(page - 1, 1))}
                  disabled={loading || page <= 1}
                  className="h-9 w-9 rounded-xl border-slate-200 bg-white p-0 hover:bg-slate-50 disabled:opacity-30"
                >
                  <ArrowUp className="w-3.5 h-3.5 -rotate-90" />
                </Button>
                <div className="flex items-center px-4 h-9 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-700 shadow-sm">
                  {page} <span className="mx-1.5 text-slate-300 font-medium">/</span> {pages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUsers(Math.min(page + 1, pages))}
                  disabled={loading || page >= pages}
                  className="h-9 w-9 rounded-xl border-slate-200 bg-white p-0 hover:bg-slate-50 disabled:opacity-30"
                >
                  <ArrowUp className="w-3.5 h-3.5 rotate-90" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
