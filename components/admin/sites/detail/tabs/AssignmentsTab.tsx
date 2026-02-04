'use client'

import { Button } from '@/components/ui/button'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { TableSkeleton } from '@/components/ui/loading-skeleton'
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'
import { AssignmentsTable } from '../AssignmentsTable'

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
  admin: '본사관리자',
  system_admin: '시스템 관리자',
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
  const data = filteredAndSortedAssignments(assignments, laborByUser, query, sort, role)

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-black text-foreground">배정 인원 관리</h3>
        <div className="flex flex-nowrap items-end gap-2 max-w-full overflow-x-auto pb-1">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-black text-muted-foreground tracking-tight ml-1">
              검색
            </span>
            <div className="relative w-40 sm:w-44 md:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={query}
                onChange={e => onQueryChange(e.target.value)}
                placeholder="이름/소속 검색..."
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-gray-50 border-none text-xs"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-black text-muted-foreground tracking-tight ml-1">
              역할
            </span>
            <CustomSelect value={role} onValueChange={v => onRoleChange(v)}>
              <CustomSelectTrigger className="h-9 rounded-lg bg-gray-50 border-none px-3 text-xs shrink-0 w-28">
                <CustomSelectValue placeholder="역할" />
              </CustomSelectTrigger>
              <CustomSelectContent>
                <CustomSelectItem value="all">전체 역할</CustomSelectItem>
                <CustomSelectItem value="worker">작업자</CustomSelectItem>
                <CustomSelectItem value="site_manager">현장관리자</CustomSelectItem>
                <CustomSelectItem value="supervisor">감리/감독</CustomSelectItem>
              </CustomSelectContent>
            </CustomSelect>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-black text-muted-foreground tracking-tight ml-1">
              정렬
            </span>
            <CustomSelect value={sort} onValueChange={v => onSortChange(v)}>
              <CustomSelectTrigger className="h-9 rounded-lg bg-gray-50 border-none px-3 text-xs shrink-0 w-28">
                <CustomSelectValue placeholder="정렬" />
              </CustomSelectTrigger>
              <CustomSelectContent>
                <CustomSelectItem value="date_desc">최신순</CustomSelectItem>
                <CustomSelectItem value="date_asc">오래된순</CustomSelectItem>
                <CustomSelectItem value="name_asc">이름순</CustomSelectItem>
                <CustomSelectItem value="labor_desc">공수순</CustomSelectItem>
              </CustomSelectContent>
            </CustomSelect>
          </div>
          <Button
            asChild
            size="sm"
            className="rounded-lg whitespace-nowrap shrink-0 h-9 bg-blue-600 hover:bg-blue-700"
          >
            <a href={`/dashboard/admin/sites/${siteId}/assign`}>
              <span className="inline-flex items-center gap-2 whitespace-nowrap">
                <Plus className="w-4 h-4" />
                인원 배정
              </span>
            </a>
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {loading && assignments.length === 0 ? (
          <TableSkeleton rows={10} />
        ) : (
          <>
            <AssignmentsTable
              siteId={siteId}
              data={data}
              laborByUser={laborByUser}
              globalLaborByUser={globalLaborByUser}
            />

            <div className="p-4 border-t flex items-center justify-between bg-gray-50/30">
              <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                전체 <span className="text-foreground italic">{total ?? 0}</span>
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
                <span className="text-xs font-black min-w-[4rem] text-center">
                  페이지 {page + 1}
                </span>
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
