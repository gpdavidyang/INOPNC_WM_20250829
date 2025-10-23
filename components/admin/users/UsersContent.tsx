'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Users, RefreshCw, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import StatsCard from '@/components/ui/stats-card'
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
import type { UserWithSites } from '@/app/actions/admin/users'
import type { UserRole, UserStatus } from '@/types'
import { t } from '@/lib/ui/strings'
import EmptyState from '@/components/ui/empty-state'

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

const ROLE_OPTIONS: { value: RoleFilterOption; label: string }[] = [
  { value: 'all', label: '전체 역할' },
  { value: 'admin', label: '관리자' },
  { value: 'system_admin', label: '시스템 관리자' },
  { value: 'site_manager', label: '현장 관리자' },
  { value: 'customer_manager', label: '고객 관리자' },
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
  admin: '관리자',
  system_admin: '시스템 관리자',
  site_manager: '현장 관리자',
  customer_manager: '고객 관리자',
  worker: '작업자',
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: '관리자',
  system_admin: '시스템 관리자',
  site_manager: '현장 관리자',
  customer_manager: '고객 관리자',
  worker: '작업자',
}

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
  const router = useRouter()

  const isSystemAdmin = useMemo(() => currentAdminRole === 'system_admin', [currentAdminRole])

  const fetchUsers = useCallback(
    async (
      nextPage: number,
      overrides?: {
        search?: string
        role?: RoleFilterOption
        status?: StatusFilterOption
      }
    ) => {
      setLoading(true)
      setError(null)

      const effectiveSearch = overrides?.search ?? searchTerm
      const effectiveRole = overrides?.role ?? roleFilter
      const effectiveStatus = overrides?.status ?? statusFilter

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
      } catch (err) {
        console.error('Failed to fetch users', err)
        setError(err instanceof Error ? err.message : '사용자 목록을 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    },
    [pageSize, roleFilter, searchTerm, statusFilter]
  )

  const handleSearch = useCallback(() => {
    fetchUsers(1, { search: searchInput })
  }, [fetchUsers, searchInput])

  const handleResetFilters = useCallback(() => {
    setSearchInput('')
    fetchUsers(1, { search: '', role: 'all', status: 'all' })
  }, [fetchUsers])

  const handleOpenDetail = useCallback(
    (userId: string) => {
      router.push(`/dashboard/admin/users/${userId}`)
    },
    [router]
  )

  return (
    <div className="space-y-6">
      {/* Top actions only — remove duplicate page title/subtitle */}
      <div className="flex items-center justify-end">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchUsers(page)} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </Button>
          {isSystemAdmin && (
            <Button variant="default" size="sm" disabled>
              <Users className="mr-2 h-4 w-4" />
              {t('users.invitePlanned')}
            </Button>
          )}
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <StatsCard label={t('users.stats.total')} value={total} unit="person" />
        <StatsCard label={t('users.filters.roleSelected')} value={ROLE_FILTER_LABELS[roleFilter]} />
        <StatsCard label={t('users.filters.statusSelected')} value={STATUS_LABELS[statusFilter]} />
      </section>

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-72">
                <Input
                  placeholder={t('users.searchPlaceholder')}
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
            </div>
            <div className="flex gap-2">
              <Select
                value={roleFilter}
                onValueChange={value => fetchUsers(1, { role: value as RoleFilterOption })}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={t('users.roleFilter')} />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={value => fetchUsers(1, { status: value as StatusFilterOption })}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={t('users.statusFilter')} />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleResetFilters} disabled={loading}>
            {t('common.reset')}
          </Button>
        </div>

        <div className="mt-6">
          {loading && <LoadingSpinner />}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>{t('users.errors.fetchList')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && users.length === 0 ? (
            <EmptyState description={t('users.empty')} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('users.table.user')}</TableHead>
                    <TableHead>{t('users.table.role')}</TableHead>
                    <TableHead>{t('users.table.organization')}</TableHead>
                    <TableHead>{t('users.table.status')}</TableHead>
                    <TableHead>{t('users.table.lastActivity')}</TableHead>
                    <TableHead className="text-right">상세</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer"
                      onClick={() => handleOpenDetail(user.id)}
                    >
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {user.full_name || t('users.noName')}
                        </div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={ROLE_BADGE_VARIANT[user.role as UserRole] ?? 'outline'}>
                          {ROLE_LABELS[user.role as UserRole] || user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.organization?.name || t('commonExtra.unassigned')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'active' ? 'default' : 'outline'}>
                          {STATUS_LABELS[user.status as StatusFilterOption] ||
                            user.status ||
                            t('commonExtra.unknown')}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.work_log_stats?.last_report_date)}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={event => {
                              event.stopPropagation()
                              handleOpenDetail(user.id)
                            }}
                          >
                            상세
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={event => {
                              event.stopPropagation()
                              router.push(`/dashboard/admin/users/${user.id}`)
                            }}
                          >
                            수정
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={async event => {
                              event.stopPropagation()
                              if (
                                !confirm(
                                  `${user.full_name || user.email} 사용자를 삭제하시겠습니까?`
                                )
                              )
                                return
                              try {
                                const res = await fetch(`/api/admin/users/${user.id}`, {
                                  method: 'DELETE',
                                })
                                const j = await res.json().catch(() => ({}))
                                if (!res.ok || !j?.success) throw new Error(j?.error || '삭제 실패')
                                setUsers(prev => prev.filter(u => u.id !== user.id))
                                setTotal(prev => Math.max(prev - 1, 0))
                              } catch (e: any) {
                                alert(e?.message || '삭제 중 오류가 발생했습니다.')
                              }
                            }}
                          >
                            삭제
                          </Button>
                        </div>
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
            총 <span className="font-medium text-foreground">{total.toLocaleString()}</span> 명
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchUsers(Math.max(page - 1, 1))}
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
              onClick={() => fetchUsers(Math.min(page + 1, pages))}
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
