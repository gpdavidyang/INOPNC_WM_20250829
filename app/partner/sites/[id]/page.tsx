import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/ultra-simple'
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
  params: { id: string }
}

export default async function PartnerSiteDetailPage({ params }: SitePageProps) {
  await requireAuth()

  const supabase = createClient()
  const siteId = params.id

  const { data: me } = await supabase
    .from('profiles')
    .select('role, partner_company_id, organization_id')
    .single()

  const role = me?.role || ''
  if (!['admin', 'system_admin', 'site_manager'].includes(role)) {
    const partnerCompanyId: string | null =
      (me as any)?.partner_company_id || me?.organization_id || null
    if (!partnerCompanyId) {
      return (
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-sm text-red-600">접근 권한이 없습니다.</p>
        </div>
      )
    }
    const { data: mapping } = await supabase
      .from('partner_site_mappings')
      .select('id')
      .eq('site_id', siteId)
      .eq('partner_company_id', partnerCompanyId)
      .limit(1)
      .maybeSingle()

    if (!mapping) {
      return (
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-sm text-red-600">해당 현장에 대한 접근 권한이 없습니다.</p>
        </div>
      )
    }
  }

  const { data: site } = await supabase.from('sites').select('*').eq('id', siteId).maybeSingle()

  const { data: docs } = await supabase
    .from('unified_document_system')
    .select('id, title, category_type, status, created_at')
    .eq('site_id', siteId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(10)

  const restrictedPartner = !['admin', 'system_admin', 'site_manager'].includes(role || '')
  let reportsQuery = supabase
    .from('daily_reports')
    .select('id, work_date, status, profiles:profiles!daily_reports_user_id_fkey(full_name)')
    .eq('site_id', siteId)
    .order('work_date', { ascending: false })
    .limit(10)
  if (restrictedPartner) {
    reportsQuery = reportsQuery.eq('status', 'approved')
  }
  const { data: reports } = await reportsQuery

  const { data: assignments } = await supabase
    .from('site_assignments')
    .select(
      'id, user_id, role, assigned_date, is_active, profile:profiles(full_name, email, phone)'
    )
    .eq('site_id', siteId)
    .eq('is_active', true)

  const { data: requests } = await supabase
    .from('material_requests')
    .select(
      `
      id,
      request_number,
      status,
      request_date,
      requester:profiles!material_requests_requested_by_fkey(full_name)
    `
    )
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">현장 상세</h1>
        <p className="text-sm text-muted-foreground">ID: {siteId}</p>
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
            <div>{(site as any)?.manager_name || '-'}</div>
          </div>
          <div>
            <div className="text-xs">안전관리자</div>
            <div>{(site as any)?.safety_manager_name || '-'}</div>
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
                  <TableHead>종류</TableHead>
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
                  (docs as any[]).map(d => (
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
                  (reports as any[]).map(r => (
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
                {!Array.isArray(assignments) || assignments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-sm text-muted-foreground py-10"
                    >
                      배정된 사용자가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  (assignments as any[]).map(a => (
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
                {!Array.isArray(requests) || requests.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-sm text-muted-foreground py-10"
                    >
                      요청 내역이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  (requests as any[]).map(rq => (
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
