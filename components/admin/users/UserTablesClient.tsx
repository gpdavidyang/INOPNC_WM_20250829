'use client'

import DataTable, { type Column } from '@/components/admin/DataTable'
import { getRoleLabel } from '@/lib/auth/role-labels'

type Assignment = {
  site_id?: string
  site_name?: string
  role?: string
  assigned_at?: string
  is_active?: boolean
}

type RequiredDoc = {
  id?: string
  document_type?: string
  document_name?: string
  status?: string
  submitted_at?: string
}

export function UserTablesClient({
  assignments,
  documents,
}: {
  assignments: Assignment[]
  documents: RequiredDoc[]
}) {
  const label = (role?: string) => (role ? getRoleLabel(role) : '-')
  return (
    <div className="space-y-6">
      <section>
        {assignments?.length ? (
          <DataTable<Assignment>
            data={assignments}
            rowKey={a => `${a.site_id || ''}-${a.assigned_at || ''}`}
            stickyHeader
            columns={
              [
                {
                  key: 'site',
                  header: '현장',
                  sortable: true,
                  render: (a: Assignment) => (
                    <span className="font-medium text-foreground">{a.site_name || a.site_id}</span>
                  ),
                },
                {
                  key: 'role',
                  header: '역할',
                  sortable: true,
                  render: (a: Assignment) => <span suppressHydrationWarning>{label(a.role)}</span>,
                },
                {
                  key: 'assigned_at',
                  header: '배정일',
                  sortable: true,
                  render: (a: Assignment) =>
                    a.assigned_at ? new Date(a.assigned_at).toLocaleDateString('ko-KR') : '-',
                },
                {
                  key: 'active',
                  header: '상태',
                  sortable: true,
                  render: (a: Assignment) => (a.is_active ? '활성' : '비활성'),
                },
              ] as Column<Assignment>[]
            }
          />
        ) : (
          <div className="text-sm text-muted-foreground py-8 text-center">
            배정된 현장이 없습니다.
          </div>
        )}
      </section>

      <section>
        {documents?.length ? (
          <DataTable<RequiredDoc>
            data={documents}
            rowKey={d => d.id || `${d.document_type}-${d.document_name}`}
            stickyHeader
            columns={
              [
                {
                  key: 'type',
                  header: '유형',
                  sortable: true,
                  render: (d: RequiredDoc) => (
                    <span className="font-medium text-foreground">{d.document_type}</span>
                  ),
                },
                {
                  key: 'name',
                  header: '파일명',
                  sortable: true,
                  render: (d: RequiredDoc) => (
                    <span
                      className="truncate inline-block max-w-[320px]"
                      title={d.document_name || ''}
                    >
                      {d.document_name || '-'}
                    </span>
                  ),
                },
                {
                  key: 'status',
                  header: '상태',
                  sortable: true,
                  render: (d: RequiredDoc) => d.status || '-',
                },
                {
                  key: 'submitted_at',
                  header: '제출일',
                  sortable: true,
                  render: (d: RequiredDoc) =>
                    d.submitted_at ? new Date(d.submitted_at).toLocaleDateString('ko-KR') : '-',
                },
              ] as Column<RequiredDoc>[]
            }
          />
        ) : (
          <div className="text-sm text-muted-foreground py-8 text-center">
            제출된 서류가 없습니다.
          </div>
        )}
      </section>
    </div>
  )
}

export default UserTablesClient
