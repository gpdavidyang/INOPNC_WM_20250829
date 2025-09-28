import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { getDailyReportById } from '@/app/actions/admin/daily-reports'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const metadata: Metadata = { title: '일일보고 상세' }

export default async function AdminDailyReportDetailPage({ params }: { params: { id: string } }) {
  await requireAdminProfile()
  const result = await getDailyReportById(params.id)
  const report = result.success && result.data ? (result.data as any) : null

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">작업일지 상세</h1>
        <p className="text-sm text-muted-foreground">ID: {params.id}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{report?.sites?.name || '-'}</CardTitle>
          <CardDescription>
            {report?.work_date ? new Date(report.work_date).toLocaleDateString('ko-KR') : '-'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <div>
            상태: <span className="text-foreground font-medium">{report?.status || '-'}</span>
          </div>
          <div>작성자: {report?.profiles?.full_name || '-'}</div>
          <div>총 인원: {report?.worker_details_count ?? 0}</div>
          <div>총 공수: {report?.total_manhours ?? 0}</div>
          <div>메모: {report?.notes || report?.issues || '-'}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>작업자 내역</CardTitle>
          <CardDescription>일지에 포함된 작업자</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>작업자</TableHead>
                <TableHead className="text-right">공수</TableHead>
                <TableHead>비고</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!Array.isArray(report?.workers) || report.workers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-8">
                    작업자 내역이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                report.workers.map((w: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell>{w.worker_name || w.worker_id || '-'}</TableCell>
                    <TableCell className="text-right">{w.labor_hours ?? 0}</TableCell>
                    <TableCell className="truncate max-w-[400px]" title={w.notes || ''}>
                      {w.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
