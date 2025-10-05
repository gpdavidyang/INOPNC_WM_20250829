import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { getUser } from '@/app/actions/admin/users'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import DataTable, { type Column } from '@/components/admin/DataTable'

export const metadata: Metadata = {
  title: '사용자 상세',
}

interface UserDetailPageProps {
  params: {
    id: string
  }
}

const STATUS_KO: Record<string, string> = {
  active: '활성',
  inactive: '비활성',
  pending: '대기',
  approved: '승인',
  rejected: '반려',
  uploaded: '업로드됨',
}

export default async function AdminUserDetailPage({ params }: UserDetailPageProps) {
  await requireAdminProfile()

  const result = await getUser(params.id)
  const user = result.success && result.data ? (result.data as any) : null

  return (
    <div className="px-0 pb-8 space-y-6">
      <PageHeader
        title="사용자 상세"
        description={`ID: ${params.id}`}
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '사용자 관리', href: '/dashboard/admin/users' },
          { label: '사용자 상세' },
        ]}
        showBackButton
        backButtonHref="/dashboard/admin/users"
      />

      <Card>
        <CardHeader>
          <CardTitle>{user?.full_name || '-'}</CardTitle>
          <CardDescription>{user?.email || '-'}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <div>
            역할: <span className="text-foreground font-medium">{user?.role || '-'}</span>
          </div>
          <div>
            상태: {user?.status ? STATUS_KO[String(user.status)] || String(user.status) : '-'}
          </div>
          <div>조직: {user?.organization?.name || '-'}</div>
          <div>
            최근 로그인:{' '}
            {user?.last_login_at ? new Date(user.last_login_at).toLocaleString('ko-KR') : '-'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>현장 배정</CardTitle>
          <CardDescription>사용자에게 배정된 현장</CardDescription>
        </CardHeader>
        <CardContent>
          {!Array.isArray(user?.site_assignments) || user.site_assignments.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              배정된 현장이 없습니다.
            </div>
          ) : (
            <DataTable
              data={user.site_assignments}
              rowKey={(a: any) => `${a.site_id}-${a.assigned_at || ''}`}
              stickyHeader
              columns={
                [
                  {
                    key: 'site',
                    header: '현장',
                    sortable: true,
                    render: (a: any) => (
                      <span className="font-medium text-foreground">
                        {a?.site_name || a?.site_id}
                      </span>
                    ),
                  },
                  {
                    key: 'role',
                    header: '역할',
                    sortable: true,
                    render: (a: any) => a?.role || '-',
                  },
                  {
                    key: 'assigned_at',
                    header: '배정일',
                    sortable: true,
                    render: (a: any) =>
                      a?.assigned_at ? new Date(a.assigned_at).toLocaleDateString('ko-KR') : '-',
                  },
                  {
                    key: 'active',
                    header: '상태',
                    sortable: true,
                    render: (a: any) => (a?.is_active ? '활성' : '비활성'),
                  },
                ] as Column<any>[]
              }
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>필수서류 제출 현황</CardTitle>
          <CardDescription>유형별 제출 상태</CardDescription>
        </CardHeader>
        <CardContent>
          {!Array.isArray(user?.required_documents) || user.required_documents.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              제출된 서류가 없습니다.
            </div>
          ) : (
            <DataTable
              data={user.required_documents}
              rowKey={(d: any) => d.id || `${d.document_type}-${d.document_name}`}
              stickyHeader
              columns={
                [
                  {
                    key: 'type',
                    header: '유형',
                    sortable: true,
                    render: (d: any) => (
                      <span className="font-medium text-foreground">{d.document_type}</span>
                    ),
                  },
                  {
                    key: 'name',
                    header: '파일명',
                    sortable: true,
                    render: (d: any) => (
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
                    render: (d: any) =>
                      d.status ? STATUS_KO[String(d.status)] || String(d.status) : '-',
                  },
                  {
                    key: 'submitted_at',
                    header: '제출일',
                    sortable: true,
                    render: (d: any) =>
                      d.submitted_at ? new Date(d.submitted_at).toLocaleDateString('ko-KR') : '-',
                  },
                ] as Column<any>[]
              }
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>작업일지 요약</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border p-4 bg-white">
            <div className="text-xs text-gray-500">총 보고서</div>
            <div className="text-2xl font-semibold">{user?.work_log_stats?.total_reports ?? 0}</div>
          </div>
          <div className="rounded-lg border p-4 bg-white">
            <div className="text-xs text-gray-500">이번 달</div>
            <div className="text-2xl font-semibold">{user?.work_log_stats?.this_month ?? 0}</div>
          </div>
          <div className="rounded-lg border p-4 bg-white">
            <div className="text-xs text-gray-500">최근 일자</div>
            <div className="text-2xl font-semibold">
              {user?.work_log_stats?.last_report_date
                ? new Date(user.work_log_stats.last_report_date).toLocaleDateString('ko-KR')
                : '-'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
