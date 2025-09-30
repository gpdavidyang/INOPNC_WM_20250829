'use client'

import { useEffect, useMemo, useState } from 'react'
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
                  {initialDocs.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-sm text-muted-foreground py-8"
                      >
                        표시할 문서가 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    initialDocs.map((d: any) => (
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
          </section>

          {/* 최근 작업일지 */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">최근 작업일지</h3>
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
                  {initialReports.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-sm text-muted-foreground py-8"
                      >
                        표시할 작업일지가 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    initialReports.map((r: any) => (
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
          </section>

          {/* 배정 사용자 */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">배정 사용자</h3>
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
                  {initialAssignments.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-sm text-muted-foreground py-10"
                      >
                        배정된 사용자가 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    initialAssignments.map((a: any) => (
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
          </section>

          {/* 최근 자재 요청 */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">최근 자재 요청</h3>
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
                  {initialRequests.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-sm text-muted-foreground py-10"
                      >
                        요청 내역이 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    initialRequests.map((rq: any) => (
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
