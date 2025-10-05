import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { getUser } from '@/app/actions/admin/users'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import UserTablesClient from '@/components/admin/users/UserTablesClient'

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
          <CardTitle>현장 배정 · 필수서류 제출</CardTitle>
          <CardDescription>사용자 배정 현황과 제출 상태</CardDescription>
        </CardHeader>
        <CardContent>
          <UserTablesClient
            assignments={Array.isArray(user?.site_assignments) ? user.site_assignments : []}
            documents={Array.isArray(user?.required_documents) ? user.required_documents : []}
          />
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
