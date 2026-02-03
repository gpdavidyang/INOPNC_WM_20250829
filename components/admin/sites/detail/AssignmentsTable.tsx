'use client'

import DataTable from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const ROLE_KO: Record<string, string> = {
  worker: '작업자',
  site_manager: '현장관리자',
  supervisor: '감리/감독',
  admin: '본사관리자',
  system_admin: '시스템 관리자',
}

interface AssignmentsTableProps {
  siteId: string
  data: any[]
  laborByUser: Record<string, number>
  globalLaborByUser: Record<string, number>
  emptyMessage?: string
}

export function AssignmentsTable({
  siteId,
  data,
  laborByUser,
  globalLaborByUser,
  emptyMessage = '배정된 인원이 없습니다.',
}: AssignmentsTableProps) {
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
      render: (a: any) => {
        // Prioritize Profile Role (User Management) over Assignment Role
        const role = a.profile?.role || a.role
        return <Badge variant="secondary">{ROLE_KO[role] || role}</Badge>
      },
    },
    {
      key: 'site_labor',
      header: '현장 공수(승인)',
      align: 'left',
      render: (a: any) => (
        <span className="font-black italic text-foreground">
          {(laborByUser[a.user_id] || 0).toFixed(1)}
        </span>
      ),
    },
    {
      key: 'global_labor',
      header: '전체 공수(승인)',
      align: 'left',
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
          className="h-8 border border-rose-200 text-rose-600 hover:border-rose-300 hover:text-rose-700 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400 dark:hover:border-rose-800 dark:hover:bg-rose-950/30 dark:hover:text-rose-300"
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

  return <DataTable data={data} columns={columns} rowKey="user_id" emptyMessage={emptyMessage} />
}
