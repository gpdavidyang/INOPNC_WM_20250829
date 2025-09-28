import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { getUser } from '@/app/actions/admin/users'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const metadata: Metadata = {
  title: '사용자 상세',
}

interface UserDetailPageProps {
  params: {
    id: string
  }
}

export default async function AdminUserDetailPage({ params }: UserDetailPageProps) {
  await requireAdminProfile()

  const result = await getUser(params.id)
  const user = result.success && result.data ? (result.data as any) : null

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">사용자 상세</h1>
        <p className="text-sm text-muted-foreground">ID: {params.id}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{user?.full_name || '-'}</CardTitle>
          <CardDescription>{user?.email || '-'}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <div>
            역할: <span className="text-foreground font-medium">{user?.role || '-'}</span>
          </div>
          <div>상태: {user?.status || '-'}</div>
          <div>조직: {user?.organization?.name || '-'}</div>
          <div>
            최근 로그인:{' '}
            {user?.last_login_at ? new Date(user.last_login_at).toLocaleString('ko-KR') : '-'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>사이트 배정</CardTitle>
          <CardDescription>사용자에게 배정된 현장</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>현장</TableHead>
                <TableHead>역할</TableHead>
                <TableHead>배정일</TableHead>
                <TableHead>상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!Array.isArray(user?.site_assignments) || user.site_assignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                    배정된 현장이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                user.site_assignments.map((a: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium text-foreground">
                      {a.site_name || a.site_id}
                    </TableCell>
                    <TableCell>{a.role || '-'}</TableCell>
                    <TableCell>
                      {a.assigned_at ? new Date(a.assigned_at).toLocaleDateString('ko-KR') : '-'}
                    </TableCell>
                    <TableCell>{a.is_active ? '활성' : '비활성'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>필수서류 제출 현황</CardTitle>
          <CardDescription>유형별 제출 상태</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>유형</TableHead>
                <TableHead>파일명</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>제출일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!Array.isArray(user?.required_documents) || user.required_documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                    제출된 서류가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                user.required_documents.map((d: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium text-foreground">{d.document_type}</TableCell>
                    <TableCell className="truncate max-w-[320px]" title={d.document_name || ''}>
                      {d.document_name || '-'}
                    </TableCell>
                    <TableCell>{d.status}</TableCell>
                    <TableCell>
                      {d.submitted_at ? new Date(d.submitted_at).toLocaleDateString('ko-KR') : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
