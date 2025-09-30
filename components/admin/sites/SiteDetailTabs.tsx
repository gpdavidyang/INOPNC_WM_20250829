'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient as createSupabaseClient } from '@/lib/supabase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'

// 한글 표시용 매핑 테이블
const CATEGORY_LABELS: Record<string, string> = {
  shared: '공유',
  markup: '도면마킹',
  required: '필수서류',
  required_user_docs: '필수서류(개인)',
  invoice: '기성청구',
  photo_grid: '사진대지',
  personal: '개인문서',
  certificate: '증명서류',
  blueprint: '도면류',
  report: '보고서',
  other: '기타',
}

const STATUS_LABELS: Record<string, string> = {
  active: '활성',
  archived: '보관',
  deleted: '삭제됨',
  uploaded: '업로드됨',
  approved: '승인',
  pending: '대기',
  rejected: '반려',
}

type Props = {
  siteId: string
  site: any
  initialDocs: any[]
  initialReports: any[]
  initialAssignments: any[]
  initialRequests: any[]
}

export default function SiteDetailTabs({
  siteId,
  site,
  initialDocs,
  initialReports,
  initialAssignments,
  initialRequests,
}: Props) {
  const [drawings, setDrawings] = useState<any[]>([])
  const [drawingsLoading, setDrawingsLoading] = useState(false)
  const [photos, setPhotos] = useState<any[]>([])
  const [photosLoading, setPhotosLoading] = useState(false)
  const [stats, setStats] = useState<{ reports: number; labor: number } | null>(null)
  const [statsLoading, setStatsLoading] = useState<boolean>(true)
  const [recentDocs, setRecentDocs] = useState<any[]>(initialDocs || [])
  const [recentReports, setRecentReports] = useState<any[]>(initialReports || [])
  const [recentAssignments, setRecentAssignments] = useState<any[]>(initialAssignments || [])
  const [recentRequests, setRecentRequests] = useState<any[]>(initialRequests || [])
  const [laborByUser, setLaborByUser] = useState<Record<string, number>>({})

  // Load drawings for site (uses server API with fallback to documents)
  useEffect(() => {
    let ignore = false
    ;(async () => {
      setDrawingsLoading(true)
      try {
        const res = await fetch(
          `/api/docs/drawings?siteId=${encodeURIComponent(siteId)}&limit=50`,
          {
            cache: 'no-store',
            credentials: 'include',
          }
        )
        const j = await res.json().catch(() => ({}))
        if (!ignore && res.ok && j?.success) setDrawings(Array.isArray(j.data) ? j.data : [])
      } finally {
        setDrawingsLoading(false)
      }
    })()
    return () => {
      ignore = true
    }
  }, [siteId])

  // Load photos for site (document_type='photo')
  useEffect(() => {
    let ignore = false
    ;(async () => {
      setPhotosLoading(true)
      try {
        const res = await fetch(`/api/docs/photos?siteId=${encodeURIComponent(siteId)}&limit=50`, {
          cache: 'no-store',
          credentials: 'include',
        })
        const j = await res.json().catch(() => ({}))
        if (!ignore && res.ok && j?.success) setPhotos(Array.isArray(j.data) ? j.data : [])
      } finally {
        setPhotosLoading(false)
      }
    })()
    return () => {
      ignore = true
    }
  }, [siteId])

  // Load site statistics (작업일지 수, 총공수)
  useEffect(() => {
    let active = true
    setStatsLoading(true)
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/sites/${siteId}/stats`, {
          cache: 'no-store',
          credentials: 'include',
        })
        const json = await res.json().catch(() => ({}))
        if (!active) return
        if (res.ok && json?.success) {
          setStats({
            reports: json.data?.daily_reports_count || 0,
            labor: json.data?.total_labor_hours || 0,
          })
        } else {
          setStats({ reports: 0, labor: 0 })
        }
      } catch (_) {
        if (active) setStats({ reports: 0, labor: 0 })
      } finally {
        if (active) setStatsLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [siteId])

  // Client-side refresh for recent sections (ensures data even if SSR missed due to env/RLS)
  useEffect(() => {
    const supabase = createSupabaseClient()

    // Recent docs: use server API that aggregates unified + legacy + site_documents
    ;(async () => {
      try {
        const res = await fetch(`/api/partner/sites/${siteId}/documents?type=all`, {
          cache: 'no-store',
          credentials: 'include',
        })
        const json = await res.json().catch(() => ({}))
        if (res.ok && Array.isArray(json?.data?.documents)) {
          // Normalize: take latest 10
          const sorted = [...json.data.documents].sort((a: any, b: any) => {
            const ad = new Date(a.uploadDate || a.created_at || a.createdAt || 0).getTime()
            const bd = new Date(b.uploadDate || b.created_at || b.createdAt || 0).getTime()
            return bd - ad
          })
          setRecentDocs(sorted.slice(0, 10))
        }
      } catch {
        void 0
      }
    })()

    // Recent daily reports (admin API)
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/sites/${siteId}/daily-reports?status=all&limit=10`, {
          cache: 'no-store',
          credentials: 'include',
        })
        const json = await res.json().catch(() => ({}))
        if (res.ok && json?.success && Array.isArray(json.data)) setRecentReports(json.data)
      } catch {
        void 0
      }
    })()

    // Recent assignments + per-user labor
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/sites/${siteId}/assignments`, {
          cache: 'no-store',
          credentials: 'include',
        })
        const json = await res.json().catch(() => ({}))
        if (res.ok && json?.success && Array.isArray(json.data)) {
          const data = json.data
          setRecentAssignments(data)
          const ids = data.map((a: any) => a.user_id).filter(Boolean)
          if (ids.length > 0) {
            try {
              const rs = await fetch(
                `/api/admin/sites/${siteId}/labor-summary?users=${encodeURIComponent(ids.join(','))}`,
                {
                  cache: 'no-store',
                  credentials: 'include',
                }
              )
              const jj = await rs.json().catch(() => ({}))
              if (rs.ok && jj?.success && jj.data) setLaborByUser(jj.data)
            } catch {
              void 0
            }
          }
        }
        // If request fails or returns unexpected shape, keep SSR-provided assignments
      } catch {
        // Swallow errors and preserve initial SSR data
      }
    })()

    // Recent material requests
    ;(async () => {
      try {
        const { data } = await supabase
          .from('material_requests')
          .select(
            'id, request_number, status, requested_by, request_date, created_at, requester:profiles!material_requests_requested_by_fkey(full_name)'
          )
          .eq('site_id', siteId)
          .order('created_at', { ascending: false })
          .limit(10)
        if (Array.isArray(data)) setRecentRequests(data)
      } catch {
        void 0
      }
    })()
  }, [siteId])

  return (
    <div>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="documents">문서</TabsTrigger>
          <TabsTrigger value="drawings">도면</TabsTrigger>
          <TabsTrigger value="photos">사진</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground">
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
            <div>
              <div className="text-xs">작업일지 수</div>
              <div className="text-foreground font-medium">
                {statsLoading ? '…' : (stats?.reports ?? 0)}
              </div>
            </div>
            <div>
              <div className="text-xs">총공수</div>
              <div className="text-foreground font-medium">
                {statsLoading ? '…' : `${formatLabor(stats?.labor ?? 0)} 공수`}
              </div>
            </div>
          </div>

          {/* 최근 문서 */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-muted-foreground">최근 문서</h3>
              <Button asChild variant="ghost" size="sm">
                <a href={`/dashboard/admin/sites/${siteId}/documents`}>더 보기</a>
              </Button>
            </div>
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
                  {recentDocs.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-sm text-muted-foreground py-8"
                      >
                        표시할 문서가 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentDocs.map((d: any) => (
                      <TableRow key={d.id}>
                        <TableCell>
                          {(() => {
                            const raw = d.created_at || d.uploadDate || d.createdAt
                            try {
                              return raw ? new Date(raw).toLocaleDateString('ko-KR') : '-'
                            } catch {
                              return '-'
                            }
                          })()}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          <a
                            href={buildDocPreviewHref(d)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline text-blue-600"
                          >
                            {d.title || '-'}
                          </a>
                        </TableCell>
                        <TableCell>
                          {d?.category_type || d?.categoryType
                            ? CATEGORY_LABELS[String(d.category_type || d.categoryType)] ||
                              String(d.category_type || d.categoryType)
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {d?.status ? STATUS_LABELS[String(d.status)] || String(d.status) : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </section>

          {/* 최근 작업일지 */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-muted-foreground">최근 작업일지</h3>
              <Button asChild variant="ghost" size="sm">
                <a href={`/dashboard/admin/daily-reports?site_id=${siteId}`}>더 보기</a>
              </Button>
            </div>
            <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>작업일자</TableHead>
                    <TableHead>작성자</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>인원</TableHead>
                    <TableHead>문서</TableHead>
                    <TableHead>공수</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentReports.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-sm text-muted-foreground py-8"
                      >
                        표시할 작업일지가 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentReports.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium text-foreground">
                          {r.id ? (
                            <a
                              href={`/dashboard/admin/daily-reports/${r.id}`}
                              className="underline text-blue-600"
                              title="작업일지 상세 보기"
                            >
                              {r.work_date
                                ? new Date(r.work_date).toLocaleDateString('ko-KR')
                                : '-'}
                            </a>
                          ) : r.work_date ? (
                            new Date(r.work_date).toLocaleDateString('ko-KR')
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>{r.profiles?.full_name || '-'}</TableCell>
                        <TableCell>
                          {((s: string) => {
                            const m: Record<string, string> = {
                              draft: '임시저장',
                              submitted: '제출됨',
                              approved: '승인',
                              rejected: '반려',
                              completed: '완료',
                            }
                            return m[s] || s || '-'
                          })(String(r.status || ''))}
                        </TableCell>
                        <TableCell>
                          {Number.isFinite(Number(r.worker_count))
                            ? Number(r.worker_count)
                            : Number.isFinite(Number(r.total_workers))
                              ? Number(r.total_workers)
                              : 0}
                        </TableCell>
                        <TableCell>
                          {Number.isFinite(Number(r.document_count)) ? Number(r.document_count) : 0}
                        </TableCell>
                        <TableCell>
                          {Number.isFinite(Number(r.total_manhours))
                            ? Number(r.total_manhours).toFixed(1)
                            : '0.0'}{' '}
                          공수
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </section>

          {/* 배정 작업자 */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-muted-foreground">배정 작업자</h3>
              <Button asChild variant="ghost" size="sm">
                <a href={`/dashboard/admin/assignment?site_id=${siteId}`}>더 보기</a>
              </Button>
            </div>
            <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>소속</TableHead>
                    <TableHead>역할</TableHead>
                    <TableHead>공수</TableHead>
                    <TableHead>배정일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAssignments.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-sm text-muted-foreground py-10"
                      >
                        배정된 사용자가 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentAssignments.map((a: any) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium text-foreground">
                          <a
                            href={`/dashboard/admin/users/${a.user_id}`}
                            className="underline text-blue-600 hover:underline"
                            title="사용자 상세 보기"
                          >
                            {a.profile?.full_name || a.user_id}
                          </a>
                        </TableCell>
                        <TableCell>{a.profile?.organization?.name || '-'}</TableCell>
                        <TableCell>{a.role || '-'}</TableCell>
                        <TableCell>
                          {Math.max(0, laborByUser[a.user_id] ?? 0).toFixed(1)} 공수
                        </TableCell>
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
          </section>

          {/* 최근 자재 요청 */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-muted-foreground">최근 자재 요청</h3>
              <Button asChild variant="ghost" size="sm">
                <a href={`/dashboard/admin/materials?tab=requests&site_id=${siteId}`}>더 보기</a>
              </Button>
            </div>
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
                  {recentRequests.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-sm text-muted-foreground py-10"
                      >
                        요청 내역이 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentRequests.map((rq: any) => (
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
          </section>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">현장 문서 최신 50개</div>
            <Button asChild variant="secondary" size="sm">
              <a href={`/dashboard/admin/sites/${siteId}/documents`}>전체 보기</a>
            </Button>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>등록일</TableHead>
                  <TableHead>문서명</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialDocs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-sm text-muted-foreground py-10"
                    >
                      표시할 문서가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  initialDocs.map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        {(() => {
                          const raw = d.created_at || d.uploadDate || d.createdAt
                          try {
                            return raw ? new Date(raw).toLocaleDateString('ko-KR') : '-'
                          } catch {
                            return '-'
                          }
                        })()}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        <a
                          href={buildDocPreviewHref(d)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-blue-600"
                        >
                          {d.title || '-'}
                        </a>
                      </TableCell>
                      <TableCell>
                        {d?.category_type || d?.categoryType
                          ? CATEGORY_LABELS[String(d.category_type || d.categoryType)] ||
                            String(d.category_type || d.categoryType)
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {d?.status ? STATUS_LABELS[String(d.status)] || String(d.status) : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Drawings Tab */}
        <TabsContent value="drawings" className="mt-4">
          {drawingsLoading ? (
            <div className="text-sm text-muted-foreground">불러오는 중...</div>
          ) : drawings.length === 0 ? (
            <div className="text-sm text-muted-foreground">도면이 없습니다.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {drawings.map((d: any) => (
                <div key={d.id} className="rounded border p-3">
                  <div className="font-medium text-foreground truncate">{d.title || '도면'}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {(d.category === 'plan' && '공도면') ||
                      (d.category === 'progress' && '진행도면') ||
                      '기타'}
                    {d.created_at ? ` · ${new Date(d.created_at).toLocaleDateString('ko-KR')}` : ''}
                  </div>
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        let finalUrl = d.url
                        try {
                          const s = await fetch(
                            `/api/files/signed-url?url=${encodeURIComponent(d.url)}`
                          )
                          const sj = await s.json()
                          finalUrl = sj?.url || d.url
                        } catch {
                          void 0
                        }
                        try {
                          const chk = await fetch(
                            `/api/files/check?url=${encodeURIComponent(finalUrl)}`
                          )
                          const cj = await chk.json().catch(() => ({}))
                          if (!cj?.exists) {
                            alert('파일을 찾을 수 없습니다. 관리자에게 재업로드를 요청해 주세요.')
                            return
                          }
                        } catch {
                          void 0
                        }
                        window.open(finalUrl, '_blank')
                      }}
                    >
                      보기
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos" className="mt-4">
          {photosLoading ? (
            <div className="text-sm text-muted-foreground">불러오는 중...</div>
          ) : photos.length === 0 ? (
            <div className="text-sm text-muted-foreground">사진이 없습니다.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {photos.map((p: any) => (
                <a
                  key={p.id}
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded overflow-hidden border"
                  title={p.title || 'photo'}
                >
                  <img src={p.url} alt={p.title || 'photo'} className="w-full h-28 object-cover" />
                </a>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function formatLabor(n: number): string {
  const v = Math.floor(Number(n) * 10) / 10
  return v.toFixed(1)
}

// 미리보기 링크 생성 헬퍼(전용 뷰어 → 파일 미리보기 → 상세 페이지 순)
function buildDocPreviewHref(d: any): string {
  const category = String(d?.category_type || d?.categoryType || '')
  const sub = String(d?.sub_category || d?.subType || d?.metadata?.sub_type || '')
  const docType = String(d?.document_type || d?.documentType || d?.metadata?.document_type || '')
  const url: string | undefined = d?.file_url || d?.fileUrl
  const mime: string | undefined = d?.mime_type || d?.mimeType
  const isPreviewable =
    !!url && (String(mime || '').startsWith('image/') || String(url).toLowerCase().endsWith('.pdf'))

  // 1) 전용 뷰어 우선
  if (category === 'markup') return `/dashboard/admin/documents/markup/${d.id}`
  if (category === 'photo_grid') return `/dashboard/admin/documents/photo-grid/${d.id}`

  // PTW 추정: 문서유형/하위유형/메타데이터로 식별
  if (docType === 'ptw' || sub === 'safety_certificate' || category === 'ptw') {
    return `/dashboard/admin/documents/ptw/${d.id}`
  }

  // 공도면(blueprint) 또는 기타: 파일 미리보기 가능하면 직접 오픈
  if (isPreviewable) return url as string

  // 폴백: 통합 문서 상세
  return `/dashboard/admin/documents/${d.id}`
}
