import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { getDailyReports } from '@/app/actions/admin/daily-reports'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const metadata: Metadata = {
  title: '일일보고 관리',
}

export default async function AdminDailyReportsPage() {
  await requireAdminProfile()

  // 기본 목록 20건 로드 (최근일자 우선)
  const result = await getDailyReports({
    page: 1,
    itemsPerPage: 20,
    sortField: 'work_date',
    sortDirection: 'desc',
  })
  const reports =
    result.success && Array.isArray(result.data?.reports) ? (result.data as any).reports : []

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">일일보고 관리</h1>
        <p className="text-sm text-muted-foreground">최근 등록된 작업일지 목록입니다.</p>
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>작업일자</TableHead>
              <TableHead>현장</TableHead>
              <TableHead>작성자</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>인원</TableHead>
              <TableHead>문서</TableHead>
              <TableHead>총공수</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-10">
                  표시할 작업일지가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              reports.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <a
                      href={`/dashboard/admin/daily-reports/${r.id}`}
                      className="underline text-blue-600"
                    >
                      {new Date(r.work_date || r.report_date).toLocaleDateString('ko-KR')}
                    </a>
                  </TableCell>
                  <TableCell>{r.sites?.name || r.site?.name || '-'}</TableCell>
                  <TableCell>
                    {r.profiles?.full_name || r.submitted_by_profile?.full_name || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.status === 'submitted' ? 'default' : 'outline'}>
                      {r.status === 'submitted'
                        ? '제출됨'
                        : r.status === 'draft'
                          ? '임시저장'
                          : r.status || '미정'}
                    </Badge>
                  </TableCell>
                  <TableCell>{r.worker_details_count ?? r.total_workers ?? 0}</TableCell>
                  <TableCell>{r.daily_documents_count ?? 0}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span>{r.total_manhours ?? 0}</span>
                      <a
                        href={`/dashboard/admin/daily-reports/${r.id}/edit`}
                        className="underline text-blue-600 text-xs"
                      >
                        수정
                      </a>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
