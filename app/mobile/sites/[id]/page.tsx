import type { Metadata } from 'next'
import { headers } from 'next/headers'
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
  searchParams?: Record<string, string | string[] | undefined>
}

export default async function PartnerSiteDetailPage({ params, searchParams }: SitePageProps) {
  // Ensure authenticated and on mobile track
  await requireAuth('/mobile')

  const supabase = createClient()
  const siteId = params.id

  // Verify access: site must be mapped to partner (for partner roles). Admin/site_manager can view freely.
  const { data: me } = await supabase
    .from('profiles')
    .select('role, partner_company_id, organization_id')
    .single()

  const role = me?.role || ''
  // 파트너/고객담당자만 현장 매핑 검증; 작업자/현장관리자/관리자는 전 현장 조회 허용
  if (['partner', 'customer_manager'].includes(role)) {
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

  const { data: reports } = await supabase
    .from('daily_reports')
    .select('id, work_date, status, profiles:profiles!daily_reports_user_id_fkey(full_name)')
    .eq('site_id', siteId)
    .order('work_date', { ascending: false })
    .limit(10)

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

  // Materials summary (mobile common API)
  const dateFromParam = ((searchParams?.date_from as string) || '').trim()
  const dateToParam = ((searchParams?.date_to as string) || '').trim()
  let summary: any = null
  try {
    const h = headers()
    const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
    const proto = h.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
    const baseUrl = `${proto}://${host}`
    const qs = new URLSearchParams()
    qs.set('limit', '10')
    if (dateFromParam) qs.set('date_from', dateFromParam)
    if (dateToParam) qs.set('date_to', dateToParam)
    const res = await fetch(
      `${baseUrl}/api/mobile/materials/site/${encodeURIComponent(siteId)}/summary?${qs.toString()}`,
      { cache: 'no-store' }
    )
    const json = await res.json().catch(() => ({}))
    if (res.ok && json?.success) summary = json.data
  } catch {
    summary = null
  }

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
          <CardTitle>자재 요약</CardTitle>
          <CardDescription>
            {summary?.period?.from && summary?.period?.to
              ? `${summary.period.from} ~ ${summary.period.to}`
              : '최근 7일 기준'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
            {/* Period filter */}
            <form method="GET" className="mb-4 grid grid-cols-2 gap-3 items-end">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">시작일</label>
                <input
                  type="date"
                  name="date_from"
                  defaultValue={dateFromParam}
                  className="h-9 w-full rounded border px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">종료일</label>
                <input
                  type="date"
                  name="date_to"
                  defaultValue={dateToParam}
                  className="h-9 w-full rounded border px-3 py-1.5 text-sm"
                />
              </div>
              <div className="col-span-2 flex gap-2">
                <button
                  type="submit"
                  className="inline-flex items-center rounded border px-3 py-2 text-sm"
                >
                  적용
                </button>
                <a
                  href={`/mobile/sites/${encodeURIComponent(siteId)}`}
                  className="inline-flex items-center rounded border px-3 py-2 text-sm"
                >
                  초기화
                </a>
              </div>
            </form>
            {(!Array.isArray(summary?.materials) || summary.materials.length === 0) && (
              <div className="text-sm text-muted-foreground">자재 데이터가 없습니다.</div>
            )}

            {Array.isArray(summary?.materials) &&
              summary.materials.map((material: any) => {
                const unitLabel = material.unit || process.env.NEXT_PUBLIC_MATERIAL_UNIT || ''
                const status = material.inventory?.status || 'normal'
                const statusLabel =
                  status === 'critical' ? '재고 없음' : status === 'low' ? '재고 부족' : '정상'
                const statusClass =
                  status === 'critical'
                    ? 'text-red-600'
                    : status === 'low'
                      ? 'text-amber-600'
                      : 'text-emerald-600'

                return (
                  <div key={material.material_id} className="mb-6 rounded border px-3 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {material.material_name || material.material_code || '자재'}
                        </div>
                        {material.material_code && (
                          <div className="text-xs text-muted-foreground">
                            코드: {material.material_code}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-sm text-muted-foreground space-y-1">
                        <div>
                          입고{' '}
                          <span className="text-foreground font-medium">
                            {Number(material.inbound?.total ?? 0).toLocaleString('ko-KR')}{' '}
                            {unitLabel}
                          </span>
                        </div>
                        <div>
                          사용{' '}
                          <span className="text-foreground font-medium">
                            {Number(material.usage?.total ?? 0).toLocaleString('ko-KR')} {unitLabel}
                          </span>
                        </div>
                        <div>
                          재고{' '}
                          <span className={`font-semibold ${statusClass}`}>
                            {Number(material.inventory?.current_stock ?? 0).toLocaleString('ko-KR')}{' '}
                            {unitLabel} ({statusLabel})
                          </span>
                        </div>
                        {material.inventory?.minimum_stock !== null &&
                          material.inventory?.minimum_stock !== undefined && (
                            <div className="text-xs">
                              최소 재고{' '}
                              {Number(material.inventory.minimum_stock).toLocaleString('ko-KR')}{' '}
                              {unitLabel}
                            </div>
                          )}
                      </div>
                    </div>

                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="text-xs font-semibold mb-2">입고 내역</div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>일자</TableHead>
                              <TableHead className="text-right">수량</TableHead>
                              <TableHead>출처</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {!Array.isArray(material.inbound?.items) ||
                            material.inbound.items.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={3}
                                  className="text-center text-xs text-muted-foreground py-4"
                                >
                                  입고 기록이 없습니다.
                                </TableCell>
                              </TableRow>
                            ) : (
                              material.inbound.items.map((item: any, idx: number) => (
                                <TableRow key={idx}>
                                  <TableCell>
                                    {item.date
                                      ? new Date(item.date).toLocaleDateString('ko-KR')
                                      : '-'}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {Number(item.quantity ?? 0).toLocaleString('ko-KR')} {unitLabel}
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground">
                                    {item.source === 'shipment' ? '출고배송' : '거래'}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      <div>
                        <div className="text-xs font-semibold mb-2">사용 내역</div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>일자</TableHead>
                              <TableHead className="text-right">수량</TableHead>
                              <TableHead>참조</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {!Array.isArray(material.usage?.items) ||
                            material.usage.items.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={3}
                                  className="text-center text-xs text-muted-foreground py-4"
                                >
                                  사용 기록이 없습니다.
                                </TableCell>
                              </TableRow>
                            ) : (
                              material.usage.items.map((item: any, idx: number) => (
                                <TableRow key={idx}>
                                  <TableCell>
                                    {item.date
                                      ? new Date(item.date).toLocaleDateString('ko-KR')
                                      : '-'}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {Number(item.quantity ?? 0).toLocaleString('ko-KR')} {unitLabel}
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground">
                                    {item.reference_type === 'daily_report'
                                      ? `일일보고서 ${item.reference_id?.slice(-6) || ''}`
                                      : item.reference_type || '-'}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                )
              })}
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
