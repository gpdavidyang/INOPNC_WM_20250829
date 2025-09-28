import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import { getSiteAssignments } from '@/app/actions/admin/sites'
import { getMaterialRequests } from '@/app/actions/admin/materials'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const metadata: Metadata = { title: '현장 상세' }

interface SitePageProps {
  params: {
    id: string
  }
}

export default async function AdminSiteDetailPage({ params }: SitePageProps) {
  await requireAdminProfile()
  const supabase = createClient()

  const { data: site } = await supabase.from('sites').select('*').eq('id', params.id).maybeSingle()

  const { data: docs } = await supabase
    .from('unified_document_system')
    .select('id, title, category_type, status, created_at')
    .eq('site_id', params.id)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: reports } = await supabase
    .from('daily_reports')
    .select('id, work_date, status, profiles:profiles!daily_reports_user_id_fkey(full_name)')
    .eq('site_id', params.id)
    .order('work_date', { ascending: false })
    .limit(10)

  const [assignRes, reqRes] = await Promise.all([
    getSiteAssignments(params.id),
    getMaterialRequests(1, 5, '', undefined, params.id),
  ])
  const assignments = assignRes.success && Array.isArray(assignRes.data) ? assignRes.data : []
  const requests = reqRes.success && reqRes.data ? (reqRes.data as any).requests : []

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">현장 상세</h1>
        <p className="text-sm text-muted-foreground">ID: {params.id}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{site?.name || '-'}</CardTitle>
          <CardDescription>{site?.address || '-'}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground">
          <div>
            <div className="text-xs">상태</div>
            <div className="text-foreground font-medium">{site?.status || '-'}</div>
          </div>
          <div>
            <div className="text-xs">기간</div>
            <div>
              {site?.start_date ? new Date(site.start_date).toLocaleDateString('ko-KR') : '-'} ~{' '}
              {site?.end_date ? new Date(site.end_date).toLocaleDateString('ko-KR') : '-'}
            </div>
          </div>
          <div>
            <div className="text-xs">현장관리자</div>
            <div>{site?.manager_name || '-'}</div>
          </div>
          <div>
            <div className="text-xs">안전관리자</div>
            <div>{site?.safety_manager_name || '-'}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>최근 문서</CardTitle>
          <CardDescription>최신 10개</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>등록일</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!Array.isArray(docs) || docs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-sm text-muted-foreground py-8"
                    >
                      표시할 문서가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  docs.map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell>{new Date(d.created_at).toLocaleDateString('ko-KR')}</TableCell>
                      <TableCell className="font-medium text-foreground">
                        {d.title || '-'}
                      </TableCell>
                      <TableCell>{d.category_type || '-'}</TableCell>
                      <TableCell>{d.status || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>최근 작업일지</CardTitle>
          <CardDescription>최신 10개</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>일자</TableHead>
                  <TableHead>작성자</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!Array.isArray(reports) || reports.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-sm text-muted-foreground py-8"
                    >
                      표시할 작업일지가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        {r.work_date ? new Date(r.work_date).toLocaleDateString('ko-KR') : '-'}
                      </TableCell>
                      <TableCell>{r.profiles?.full_name || '-'}</TableCell>
                      <TableCell>{r.status || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>배정 사용자</CardTitle>
          <CardDescription>활성 배정</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>역할</TableHead>
                  <TableHead>배정일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-sm text-muted-foreground py-10"
                    >
                      배정된 사용자가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  assignments.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium text-foreground">
                        {a.profile?.full_name || a.user_id}
                      </TableCell>
                      <TableCell>{a.role || '-'}</TableCell>
                      <TableCell>
                        {a.assigned_date
                          ? new Date(a.assigned_date).toLocaleDateString('ko-KR')
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>최근 자재 요청</CardTitle>
          <CardDescription>최신 5개</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>요청번호</TableHead>
                  <TableHead>요청자</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>요청일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-sm text-muted-foreground py-10"
                    >
                      요청 내역이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((rq: any) => (
                    <TableRow key={rq.id}>
                      <TableCell className="font-medium text-foreground">
                        {rq.request_number || rq.id}
                      </TableCell>
                      <TableCell>{rq.requester?.full_name || '-'}</TableCell>
                      <TableCell>{rq.status || '-'}</TableCell>
                      <TableCell>
                        {rq.request_date
                          ? new Date(rq.request_date).toLocaleDateString('ko-KR')
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
