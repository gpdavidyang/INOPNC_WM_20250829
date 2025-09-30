'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type IntegratedResponse = {
  daily_report: any
  site: any
  worker_assignments: any[]
  worker_statistics: {
    total_workers: number
    total_hours: number
    total_overtime: number
    absent_workers: number
    by_trade: Record<string, number>
    by_skill: Record<string, number>
  }
  documents: Record<string, any[]>
  document_counts: Record<string, number>
  material_usage?: {
    npc1000_incoming?: number
    npc1000_used?: number
    npc1000_remaining?: number
    usage_rate?: string
  }
  related_reports: any[]
  report_author?: any
}

export default function DailyReportDetailClient({
  reportId,
  siteName,
  workDate,
  status,
  author,
}: {
  reportId: string
  siteName?: string
  workDate?: string
  status?: string
  author?: string
}) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<IntegratedResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/admin/daily-reports/${reportId}/integrated`, {
          cache: 'no-store',
          credentials: 'include',
        })
        if (!res.ok) throw new Error('Failed to load daily report')
        const j = await res.json()
        if (!ignore) setData(j as IntegratedResponse)
      } catch (e: any) {
        if (!ignore) setError(e?.message || '로드 실패')
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => {
      ignore = true
    }
  }, [reportId])

  const docs = data?.documents || {}
  const drawings = useMemo(() => docs['drawing'] || [], [docs])
  const photos = useMemo(() => docs['photo'] || [], [docs])
  const completionDocs = useMemo(() => docs['completion'] || [], [docs])
  const others = useMemo(() => docs['other'] || [], [docs])

  const openFile = async (url: string) => {
    let finalUrl = url
    try {
      const s = await fetch(`/api/files/signed-url?url=${encodeURIComponent(url)}`)
      const sj = await s.json()
      finalUrl = sj?.url || url
    } catch {
      void 0
    }
    try {
      const chk = await fetch(`/api/files/check?url=${encodeURIComponent(finalUrl)}`)
      const cj = await chk.json().catch(() => ({}))
      if (!cj?.exists) {
        alert('파일을 찾을 수 없습니다. 관리자에게 재업로드를 요청해 주세요.')
        return
      }
    } catch {
      void 0
    }
    window.open(finalUrl, '_blank')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{siteName || data?.site?.name || '-'}</CardTitle>
          <CardDescription>
            {workDate || data?.daily_report?.work_date
              ? new Date(workDate || data?.daily_report?.work_date).toLocaleDateString('ko-KR')
              : '-'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-3 text-sm text-muted-foreground">
          <div>
            <div className="text-xs">상태</div>
            <div className="text-foreground font-medium">
              {status || data?.daily_report?.status || '-'}
            </div>
          </div>
          <div>
            <div className="text-xs">작성자</div>
            <div className="text-foreground font-medium">
              {author || data?.report_author?.full_name || '-'}
            </div>
          </div>
          <div>
            <div className="text-xs">총 인원</div>
            <div className="text-foreground font-medium">
              {data?.worker_statistics?.total_workers ?? '-'}
            </div>
          </div>
          <div>
            <div className="text-xs">총 공수</div>
            <div className="text-foreground font-medium">
              {data?.worker_statistics?.total_hours ?? '-'}
            </div>
          </div>
          {data?.material_usage && (
            <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <div className="text-xs">NPC-1000 입고</div>
                <div className="text-foreground">{data.material_usage.npc1000_incoming ?? 0}</div>
              </div>
              <div>
                <div className="text-xs">사용</div>
                <div className="text-foreground">{data.material_usage.npc1000_used ?? 0}</div>
              </div>
              <div>
                <div className="text-xs">잔량</div>
                <div className="text-foreground">{data.material_usage.npc1000_remaining ?? 0}</div>
              </div>
              <div>
                <div className="text-xs">사용률</div>
                <div className="text-foreground">{data.material_usage.usage_rate || '0%'}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 작업자 배정 */}
      <Card>
        <CardHeader>
          <CardTitle>작업자 내역</CardTitle>
          <CardDescription>배정/공수/근태</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">불러오는 중...</div>
          ) : (data?.worker_assignments?.length || 0) === 0 ? (
            <div className="text-sm text-muted-foreground">작업자 내역이 없습니다.</div>
          ) : (
            <div className="rounded-lg border bg-card p-2 shadow-sm overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>직종/숙련</TableHead>
                    <TableHead className="text-right">공수</TableHead>
                    <TableHead className="text-right">연장</TableHead>
                    <TableHead>출결</TableHead>
                    <TableHead>비고</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.worker_assignments?.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium text-foreground">
                        {a.profiles?.full_name || a.worker_name || '이름없음'}
                      </TableCell>
                      <TableCell>
                        {(a.trade_type || '기타') + ' / ' + (a.skill_level || '견습')}
                      </TableCell>
                      <TableCell className="text-right">{a.labor_hours ?? 0}</TableCell>
                      <TableCell className="text-right">{a.overtime_hours ?? 0}</TableCell>
                      <TableCell>
                        {a.is_present ? (
                          <Badge variant="default">출근</Badge>
                        ) : (
                          <Badge variant="outline">결근</Badge>
                        )}
                      </TableCell>
                      <TableCell className="truncate max-w-[360px]" title={a.notes || ''}>
                        {a.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 첨부: 사진/도면/완료확인서/기타 */}
      <Card>
        <CardHeader>
          <CardTitle>첨부</CardTitle>
          <CardDescription>사진/도면/완료확인서/기타</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <AttachmentSection title="사진" items={photos} onOpen={openFile} />
            <AttachmentSection title="도면" items={drawings} onOpen={openFile} />
            <AttachmentSection title="완료확인서" items={completionDocs} onOpen={openFile} />
            <AttachmentSection title="기타" items={others} onOpen={openFile} />
          </div>
        </CardContent>
      </Card>

      {/* 비고 */}
      <Card>
        <CardHeader>
          <CardTitle>비고</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {data?.daily_report?.notes || data?.daily_report?.issues || '입력된 비고가 없습니다.'}
        </CardContent>
      </Card>

      {/* 관련 일지 */}
      <Card>
        <CardHeader>
          <CardTitle>관련 작업일지</CardTitle>
          <CardDescription>같은 현장의 최근 일지</CardDescription>
        </CardHeader>
        <CardContent>
          {(data?.related_reports?.length || 0) === 0 ? (
            <div className="text-sm text-muted-foreground">관련 일지가 없습니다.</div>
          ) : (
            <div className="rounded-lg border bg-card p-2 shadow-sm overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>일자</TableHead>
                    <TableHead>구성/공정</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>바로가기</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.related_reports?.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>{new Date(r.work_date).toLocaleDateString('ko-KR')}</TableCell>
                      <TableCell>
                        {(r.member_name || '-') + ' / ' + (r.process_type || '-')}
                      </TableCell>
                      <TableCell>{r.status || '-'}</TableCell>
                      <TableCell>
                        <a className="underline" href={`/dashboard/admin/daily-reports/${r.id}`}>
                          열기
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {error && <div className="text-sm text-destructive">{error}</div>}
    </div>
  )
}

function AttachmentSection({
  title,
  items,
  onOpen,
}: {
  title: string
  items: any[]
  onOpen: (url: string) => void
}) {
  return (
    <div>
      <div className="mb-2 font-medium text-foreground">{title}</div>
      {items.length === 0 ? (
        <div className="text-sm text-muted-foreground">첨부 없음</div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {items.map((d: any) => (
            <div key={d.id} className="flex items-center justify-between rounded border p-2">
              <div className="truncate">
                <div
                  className="font-medium text-foreground truncate max-w-[340px]"
                  title={d.title || d.file_name || ''}
                >
                  {d.title || d.file_name || '파일'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(d.created_at || d.uploaded_at || Date.now()).toLocaleDateString(
                    'ko-KR'
                  )}
                </div>
              </div>
              <div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => d.file_url && onOpen(d.file_url)}
                >
                  보기
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
