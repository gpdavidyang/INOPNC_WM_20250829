'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import DataTable, { type Column } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import type { UnifiedAttachment, UnifiedDailyReport } from '@/types/daily-reports'
import { integratedResponseToUnifiedReport } from '@/lib/daily-reports/unified-admin'

type IntegratedResponse = {
  daily_report: any
  site: any
  worker_assignments: any[]
  worker_statistics?: {
    total_workers?: number
    total_hours?: number
  }
  documents: Record<string, any[]>
  document_counts: Record<string, number>
  related_reports: any[]
  report_author?: any
}

interface WorkerRow {
  id: string
  name: string
  hours: number
  notes: string
}

interface MaterialRow {
  id: string
  name: string
  code: string
  quantity: number
  unit: string
  notes: string
}

const workerColumns: Column<WorkerRow>[] = [
  {
    key: 'name',
    header: '이름',
    sortable: true,
    render: row => <span className="font-medium text-foreground">{row.name}</span>,
  },
  {
    key: 'hours',
    header: '공수',
    sortable: true,
    align: 'right',
    render: row => row.hours.toFixed(1),
  },
  {
    key: 'notes',
    header: '비고',
    sortable: false,
    render: row => (
      <span className="truncate inline-block max-w-[360px]" title={row.notes}>
        {row.notes || '-'}
      </span>
    ),
  },
]

const materialColumns: Column<MaterialRow>[] = [
  {
    key: 'name',
    header: '자재명',
    sortable: true,
    render: row => row.name,
  },
  {
    key: 'code',
    header: '코드',
    sortable: true,
    render: row => row.code,
  },
  {
    key: 'quantity',
    header: '수량',
    sortable: true,
    align: 'right',
    render: row => row.quantity.toLocaleString('ko-KR'),
  },
  {
    key: 'unit',
    header: '단위',
    sortable: false,
    render: row => row.unit,
  },
  {
    key: 'notes',
    header: '비고',
    sortable: false,
    render: row => row.notes,
  },
]

export default function DailyReportDetailClient({
  reportId,
  siteName,
  workDate,
  status,
  author,
  initialReport,
}: {
  reportId: string
  siteName?: string
  workDate?: string
  status?: string
  author?: string
  initialReport?: UnifiedDailyReport
}) {
  const [loading, setLoading] = useState(!initialReport)
  const [error, setError] = useState<string | null>(null)
  const [integratedData, setIntegratedData] = useState<IntegratedResponse | null>(null)
  const [prefetchedReport, setPrefetchedReport] = useState<UnifiedDailyReport | null>(
    initialReport ?? null
  )

  useEffect(() => {
    if (initialReport) {
      setPrefetchedReport(initialReport)
      return
    }

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
        if (!ignore) setIntegratedData(j as IntegratedResponse)
      } catch (e: any) {
        if (!ignore) setError(e?.message || '로드 실패')
      } finally {
        if (!ignore) setLoading(false)
      }
    })()

    return () => {
      ignore = true
    }
  }, [initialReport, reportId])

  const unifiedReport = useMemo<UnifiedDailyReport | null>(() => {
    if (prefetchedReport) return prefetchedReport
    if (integratedData) return integratedResponseToUnifiedReport(integratedData)
    return null
  }, [prefetchedReport, integratedData])

  const primaryWorkEntry = unifiedReport?.workEntries?.[0]

  const workerRows: WorkerRow[] = useMemo(
    () =>
      (unifiedReport?.workers || []).map(worker => ({
        id: worker.id,
        name: worker.workerName || '이름없음',
        hours: Number(worker.hours ?? 0),
        notes: worker.notes || '-',
      })),
    [unifiedReport?.workers]
  )

  const materialRows: MaterialRow[] = useMemo(
    () =>
      (unifiedReport?.materials || []).map(material => ({
        id: material.id,
        name: material.materialName || '-',
        code: material.materialCode || '-',
        quantity: Number(material.quantity ?? 0),
        unit: material.unit || '-',
        notes: material.notes || '-',
      })),
    [unifiedReport?.materials]
  )

  const additionalPhotos = unifiedReport?.additionalPhotos || []

  const totalWorkers =
    unifiedReport?.workers?.length ?? integratedData?.worker_statistics?.total_workers ?? 0
  const totalHours =
    integratedData?.worker_statistics?.total_hours ??
    workerRows.reduce((sum, row) => sum + row.hours, 0)

  const openFile = async (url: string) => {
    let finalUrl = url
    try {
      const s = await fetch(`/api/files/signed-url?url=${encodeURIComponent(url)}`)
      const sj = await s.json()
      finalUrl = sj?.url || url
    } catch {
      void 0
    }
    window.open(finalUrl, '_blank')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{siteName || unifiedReport?.siteName || '-'}</CardTitle>
          <CardDescription>
            {workDate || unifiedReport?.workDate
              ? new Date(workDate || unifiedReport?.workDate || '').toLocaleDateString('ko-KR')
              : '-'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-3 text-sm text-muted-foreground">
          <DetailStat label="상태" value={status || unifiedReport?.status || '-'} />
          <DetailStat
            label="작성자"
            value={
              author ||
              (unifiedReport?.meta?.authorName as string | undefined) ||
              integratedData?.report_author?.full_name ||
              '-'
            }
          />
          <DetailStat label="총 인원" value={totalWorkers} />
          <DetailStat label="총 공수" value={totalHours.toFixed(1)} />
          {unifiedReport?.npcUsage && (
            <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <DetailStat label="NPC-1000 입고" value={unifiedReport.npcUsage.incoming ?? 0} />
              <DetailStat label="사용" value={unifiedReport.npcUsage.used ?? 0} />
              <DetailStat label="잔량" value={unifiedReport.npcUsage.remaining ?? 0} />
              <DetailStat
                label="사용률"
                value={
                  unifiedReport.npcUsage.incoming
                    ? `${Math.round(
                        ((unifiedReport.npcUsage.used ?? 0) /
                          (unifiedReport.npcUsage.incoming || 1)) *
                          100
                      )}%`
                    : '0%'
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>작업 내역</CardTitle>
          <CardDescription>부재명 / 작업공정 / 작업구간 / 특이사항</CardDescription>
        </CardHeader>
        <CardContent>
          {unifiedReport?.workEntries?.length ? (
            <div className="space-y-4 text-sm text-muted-foreground">
              {unifiedReport.workEntries.map(entry => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap gap-4 text-foreground">
                    <span className="font-semibold">부재명</span>
                    <span>{entry.memberName || '-'}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <span className="text-xs text-muted-foreground">작업공정</span>
                    <span className="text-foreground">{entry.processType || '-'}</span>
                    <span className="text-xs text-muted-foreground">작업구간</span>
                    <span className="text-foreground">{entry.workSection || '-'}</span>
                  </div>
                  {entry.notes && (
                    <p className="mt-2 text-foreground leading-relaxed">{entry.notes}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">등록된 작업 내역이 없습니다.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>작업 위치</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-3 text-sm text-muted-foreground">
          <DetailStat label="블럭" value={unifiedReport?.location?.block || '-'} />
          <DetailStat label="동" value={unifiedReport?.location?.dong || '-'} />
          <DetailStat label="호수/층" value={unifiedReport?.location?.unit || '-'} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>본사 요청사항</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {unifiedReport?.hqRequest || '요청사항이 없습니다.'}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>특이사항 / 이슈</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {unifiedReport?.issues || '입력된 특이사항이 없습니다.'}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>작업자 내역</CardTitle>
          <CardDescription>배정 인력 및 공수</CardDescription>
        </CardHeader>
        <CardContent>
          {workerRows.length === 0 ? (
            <div className="text-sm text-muted-foreground">작업자 내역이 없습니다.</div>
          ) : (
            <DataTable data={workerRows} rowKey="id" columns={workerColumns} stickyHeader />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>자재 현황</CardTitle>
          <CardDescription>기록된 자재 사용 이력</CardDescription>
        </CardHeader>
        <CardContent>
          {materialRows.length === 0 ? (
            <div className="text-sm text-muted-foreground">자재 사용 내역이 없습니다.</div>
          ) : (
            <DataTable data={materialRows} rowKey="id" columns={materialColumns} stickyHeader />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>추가 사진</CardTitle>
        </CardHeader>
        <CardContent>
          {additionalPhotos.length === 0 ? (
            <div className="text-sm text-muted-foreground">등록된 사진이 없습니다.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {additionalPhotos.map(photo => (
                <button
                  key={photo.id}
                  type="button"
                  className="group relative overflow-hidden rounded-lg border bg-gray-50"
                  onClick={() => openFile(photo.preview || photo.url || '')}
                >
                  <img
                    src={photo.preview || photo.url || ''}
                    alt={photo.description || photo.filename}
                    className="h-32 w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/50 px-2 py-1 text-left text-xs text-white">
                    {photo.description || photo.filename}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>첨부</CardTitle>
          <CardDescription>사진 / 도면 / 완료확인서 / 기타</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <AttachmentSection
              title="사진"
              items={unifiedReport?.attachments.photos || []}
              onOpen={openFile}
            />
            <AttachmentSection
              title="도면"
              items={unifiedReport?.attachments.drawings || []}
              onOpen={openFile}
            />
            <AttachmentSection
              title="완료확인서"
              items={unifiedReport?.attachments.confirmations || []}
              onOpen={openFile}
            />
            <AttachmentSection
              title="기타"
              items={unifiedReport?.attachments.others || []}
              onOpen={openFile}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>비고</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {unifiedReport?.notes || unifiedReport?.issues || '입력된 비고가 없습니다.'}
        </CardContent>
      </Card>

      {error && <div className="text-sm text-destructive">{error}</div>}
      {loading && !unifiedReport && (
        <div className="text-sm text-muted-foreground">작업일지를 불러오는 중입니다...</div>
      )}
    </div>
  )
}

function AttachmentSection({
  title,
  items,
  onOpen,
}: {
  title: string
  items: UnifiedAttachment[]
  onOpen: (url: string) => void
}) {
  return (
    <div>
      <div className="mb-2 font-medium text-foreground">{title}</div>
      {items.length === 0 ? (
        <div className="text-sm text-muted-foreground">첨부 없음</div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {items.map(file => (
            <div key={file.id} className="flex items-center justify-between rounded border p-2">
              <div className="truncate">
                <div
                  className="font-medium text-foreground truncate max-w-[340px]"
                  title={file.name}
                >
                  {file.name || '파일'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString('ko-KR') : '-'}
                </div>
              </div>
              <div>
                <Button size="sm" variant="outline" onClick={() => onOpen(file.url)}>
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

function DetailStat({ label, value }: { label: string; value: string | number }) {
  const display = value === undefined || value === null || value === '' ? '-' : value
  return (
    <div className="text-sm text-muted-foreground">
      <div className="text-xs">{label}</div>
      <div className="text-foreground font-medium">{display}</div>
    </div>
  )
}
