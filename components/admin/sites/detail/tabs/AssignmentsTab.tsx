'use client'

import DataTable from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TableSkeleton } from '@/components/ui/loading-skeleton'
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'

interface AssignmentsTabProps {
  siteId: string
  assignments: any[]
  loading: boolean
  query: string
  onQueryChange: (q: string) => void
  role: string
  onRoleChange: (r: any) => void
  sort: string
  onSortChange: (s: any) => void
  page: number
  onPageChange: (p: any) => void
  pageSize: number
  onPageSizeChange: (s: number) => void
  total: number | null
  hasNext: boolean
  laborByUser: Record<string, number>
  globalLaborByUser: Record<string, number>
  filteredAndSortedAssignments: any
}

const ROLE_KO: Record<string, string> = {
  worker: '작업자',
  site_manager: '현장관리자',
  supervisor: '감리/감독',
}

export function AssignmentsTab({
  siteId,
  assignments,
  loading,
  query,
  onQueryChange,
  role,
  onRoleChange,
  sort,
  onSortChange,
  page,
  onPageChange,
  pageSize,
  onPageSizeChange,
  total,
  hasNext,
  laborByUser,
  globalLaborByUser,
  filteredAndSortedAssignments,
}: AssignmentsTabProps) {
  const columns: any[] = [
    {
      key: 'name',
      header: '이름',
      render: (a: any) => (
        <a
          href={`/dashboard/admin/users/${a.user_id}`}
          className="text-blue-600 font-bold hover:underline"
        >
          {a?.profile?.full_name || a.user_id}
        </a>
      ),
    },
    {
      key: 'company',
      header: '소속',
      render: (a: any) => a?.profile?.organization?.name || '-',
    },
    {
      key: 'contact',
      header: '연락처',
      render: (a: any) => (
        <div className="flex flex-col text-xs">
          <span>{a?.profile?.phone || '-'}</span>
          <span className="text-muted-foreground opacity-70">{a?.profile?.email || '-'}</span>
        </div>
      ),
    },
    {
      key: 'role',
      header: '역할',
      render: (a: any) => <Badge variant="secondary">{ROLE_KO[a.role] || a.role}</Badge>,
    },
    {
      key: 'site_labor',
      header: '현장 공수',
      align: 'right',
      render: (a: any) => (
        <span className="font-black italic text-foreground">
          {(laborByUser[a.user_id] || 0).toFixed(1)}
        </span>
      ),
    },
    {
      key: 'global_labor',
      header: '전체 공수',
      align: 'right',
      render: (a: any) => (
        <span className="font-bold text-muted-foreground">
          {(globalLaborByUser[a.user_id] || 0).toFixed(1)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '관리',
      align: 'center',
      render: (a: any) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          onClick={async () => {
            if (!confirm('현장에서 이 인원을 제외하시겠습니까?')) return
            try {
              const res = await fetch(`/api/admin/sites/${siteId}/workers/unassign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ worker_id: a.user_id }),
              })
              if (res.ok) window.location.reload()
            } catch (e) {
              alert('오류가 발생했습니다.')
            }
          }}
        >
          제외
        </Button>
      ),
    },
  ]

  const data = filteredAndSortedAssignments(assignments, laborByUser, query, sort, role)

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-black text-foreground">배정 인원 관리</h3>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={e => onQueryChange(e.target.value)}
              placeholder="이름/소속 검색..."
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-gray-50 border-none text-xs"
            />
          </div>
          <select
            value={role}
            onChange={e => onRoleChange(e.target.value)}
            className="h-9 rounded-lg bg-gray-50 border-none px-3 text-xs"
          >
            <option value="all">전체 역할</option>
            <option value="worker">작업자</option>
            <option value="site_manager">현장관리자</option>
            <option value="supervisor">감리/감독</option>
          </select>
          <select
            value={sort}
            onChange={e => onSortChange(e.target.value)}
            className="h-9 rounded-lg bg-gray-50 border-none px-3 text-xs"
          >
            <option value="date_desc">최신순</option>
            <option value="date_asc">오래된순</option>
            <option value="name_asc">이름순</option>
            <option value="labor_desc">공수순</option>
          </select>
          <Button asChild size="sm" className="rounded-lg gap-2">
            <a href={`/dashboard/admin/sites/${siteId}/assign`}>
              <Plus className="w-4 h-4" />
              인원 배정
            </a>
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {loading && assignments.length === 0 ? (
          <TableSkeleton rows={10} />
        ) : (
          <>
            <DataTable
              data={data}
              columns={columns}
              rowKey="user_id"
              emptyMessage="배정된 인원이 없습니다."
            />

            <div className="p-4 border-t flex items-center justify-between bg-gray-50/30">
              <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                Total <span className="text-foreground italic">{total ?? 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => onPageChange((p: number) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs font-black min-w-[4rem] text-center">Page {page + 1}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => onPageChange((p: number) => p + 1)}
                  disabled={!hasNext}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
