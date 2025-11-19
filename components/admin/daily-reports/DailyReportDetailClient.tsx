'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LayoutGrid, List } from 'lucide-react'
import type {
  UnifiedAttachment,
  UnifiedDailyReport,
  UnifiedWorkerEntry,
} from '@/types/daily-reports'
import {
  integratedResponseToUnifiedReport,
  type AdminIntegratedResponse,
} from '@/lib/daily-reports/unified-admin'

interface DailyReportDetailClientProps {
  reportId: string
  siteName?: string
  workDate?: string
  status?: string
  author?: string
  initialReport?: UnifiedDailyReport
}

interface WorkerStatistics {
  total_workers: number
  total_hours: number
  total_overtime: number
  absent_workers: number
  by_trade: Record<string, number>
  by_skill: Record<string, number>
}

const initialWorkerStats: WorkerStatistics = {
  total_workers: 0,
  total_hours: 0,
  total_overtime: 0,
  absent_workers: 0,
  by_trade: {},
  by_skill: {},
}

const formatDate = (value?: string) => {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString('ko-KR')
  } catch {
    return value
  }
}

const formatNumber = (value: unknown, fractionDigits = 1) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return '0'
  return num.toFixed(fractionDigits)
}

const WORK_CONTENT_DESCRIPTION = '부재명 / 작업공정 / 구간 / 상세'

const mapWorkersToStats = (workers: UnifiedWorkerEntry[]): WorkerStatistics => {
  return workers.reduce(
    (stats, worker) => {
      stats.total_workers += 1
      stats.total_hours += Number(worker.hours || 0)
      return stats
    },
    {
      ...initialWorkerStats,
    }
  )
}

export default function DailyReportDetailClient({
  reportId,
  siteName,
  workDate,
  status,
  author,
  initialReport,
}: DailyReportDetailClientProps) {
  const [report, setReport] = useState<UnifiedDailyReport | null>(initialReport ?? null)
  const [integrated, setIntegrated] = useState<AdminIntegratedResponse | null>(null)
  const [loading, setLoading] = useState(!initialReport)
  const [error, setError] = useState<string | null>(null)
  const [photosViewMode, setPhotosViewMode] = useState<'preview' | 'list'>('preview')

  useEffect(() => {
    setReport(initialReport ?? null)
    setLoading(!initialReport)
  }, [initialReport])

  useEffect(() => {
    if (initialReport) {
      // SSR에서 이미 최신 데이터를 전달받은 경우 추가 fetching 불필요
      return
    }

    let ignore = false

    async function fetchReport() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/admin/daily-reports/${reportId}/integrated`, {
          cache: 'no-store',
          credentials: 'include',
        })

        if (response.status === 404) {
          // Older 보고서는 통합 API가 준비되어 있지 않을 수 있음. 기존 데이터를 그대로 유지.
          setIntegrated(null)
          return
        }

        if (!response.ok) {
          throw new Error('Failed to load daily report')
        }

        const json = (await response.json()) as AdminIntegratedResponse
        if (ignore) return

        setIntegrated(json)
        setReport(integratedResponseToUnifiedReport(json))
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : '작업일지 정보를 불러오지 못했습니다.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    fetchReport().catch(() => void 0)

    return () => {
      ignore = true
    }
  }, [initialReport, reportId])

  const workerStats = useMemo<WorkerStatistics>(() => {
    if (integrated?.worker_statistics) {
      return {
        total_workers: integrated.worker_statistics.total_workers || 0,
        total_hours: integrated.worker_statistics.total_hours || 0,
        total_overtime: integrated.worker_statistics.total_overtime || 0,
        absent_workers: integrated.worker_statistics.absent_workers || 0,
        by_trade: integrated.worker_statistics.by_trade || {},
        by_skill: integrated.worker_statistics.by_skill || {},
      }
    }
    if (report?.workers) {
      return mapWorkersToStats(report.workers)
    }
    return initialWorkerStats
  }, [integrated, report])

  const attachments = useMemo(
    () => ({
      photos: report?.attachments.photos ?? [],
      drawings: report?.attachments.drawings ?? [],
      confirmations: report?.attachments.confirmations ?? [],
      others: report?.attachments.others ?? [],
    }),
    [report?.attachments]
  )

  const linkedDrawings = useMemo(() => {
    return (attachments.drawings || []).filter(att => {
      const meta = att?.metadata && typeof att.metadata === 'object' ? att.metadata : null
      if (!meta) return false
      return Boolean(
        meta?.source ||
          meta?.markup_document_id ||
          meta?.source_id ||
          meta?.linked_worklog_id ||
          meta?.original_url
      )
    })
  }, [attachments.drawings])

  const getMarkupLinkFromAttachment = (attachment: UnifiedAttachment) => {
    const meta =
      attachment?.metadata && typeof attachment.metadata === 'object' ? attachment.metadata : null
    if (!meta) return null
    const markupId =
      (typeof meta.markup_document_id === 'string' && meta.markup_document_id) ||
      (typeof meta.source_id === 'string' && meta.source_id) ||
      (typeof meta.document_id === 'string' && meta.document_id) ||
      null
    return markupId ? `/dashboard/admin/tools/markup?docId=${markupId}` : null
  }

  const relatedReports = integrated?.related_reports ?? []

  const handleOpenFile = async (url: string) => {
    if (!url) return

    let finalUrl = url
    try {
      const signed = await fetch(`/api/files/signed-url?url=${encodeURIComponent(url)}`, {
        credentials: 'include',
      })
      const signedJson = await signed.json().catch(() => ({}))
      finalUrl = signedJson?.url || url
    } catch {
      // Ignore and fall back to original URL
    }

    try {
      const check = await fetch(`/api/files/check?url=${encodeURIComponent(finalUrl)}`, {
        credentials: 'include',
      })
      const checkJson = await check.json().catch(() => ({}))
      if (!checkJson?.exists) {
        alert('파일을 찾을 수 없습니다. 관리자에게 재업로드를 요청해 주세요.')
        return
      }
    } catch {
      // If the check fails, still attempt to open the file
    }

    window.open(finalUrl, '_blank', 'noopener,noreferrer')
  }

  const renderArray = (values?: string[]) => (values && values.length > 0 ? values.join(', ') : '-')

  const documentsLinkUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (report?.siteId) params.set('siteId', report.siteId)
    params.set('worklogId', reportId)
    return `/documents/hub?${params.toString()}`
  }, [report?.siteId, reportId])

  const memberNames = useMemo(() => {
    const entries = (report?.workEntries || [])
      .map(entry => entry.memberName || entry.memberNameOther)
      .filter((value): value is string => !!value && value.trim().length > 0)
    if (entries.length > 0) {
      return Array.from(new Set(entries.map(item => item.trim())))
    }
    return (report?.memberTypes || []).filter(value => !!value && value.trim().length > 0)
  }, [report?.workEntries, report?.memberTypes])

  const processNames = useMemo(() => {
    const entries = (report?.workEntries || [])
      .map(entry => entry.processType || entry.processTypeOther)
      .filter((value): value is string => !!value && value.trim().length > 0)
    if (entries.length > 0) {
      return Array.from(new Set(entries.map(item => item.trim())))
    }
    return (report?.workProcesses || []).filter(value => !!value && value.trim().length > 0)
  }, [report?.workEntries, report?.workProcesses])

  const renderWorkEntries = () => {
    if (!report?.workEntries || report.workEntries.length === 0) {
      return <div className="text-sm text-muted-foreground">등록된 작업 내역이 없습니다.</div>
    }

    return (
      <div className="space-y-2">
        {report.workEntries.map(entry => (
          <div key={entry.id} className="rounded border p-3 text-sm">
            <div className="font-medium text-foreground">
              {entry.memberName || entry.memberNameOther || '작업'}
            </div>
            <div className="grid gap-1 mt-1 md:grid-cols-3 text-muted-foreground">
              <div>
                <span className="text-xs">작업공정</span>
                <div>{entry.processType || entry.processTypeOther || '-'}</div>
              </div>
              <div>
                <span className="text-xs">작업 구간</span>
                <div>{entry.workSection || '-'}</div>
              </div>
              <div>
                <span className="text-xs">비고</span>
                <div>{entry.notes || '-'}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderWorkers = () => {
    if (!report?.workers || report.workers.length === 0) {
      return <div className="text-sm text-muted-foreground">작업자 배정 정보가 없습니다.</div>
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="py-2 pr-4">이름</th>
              <th className="py-2 pr-4">공수</th>
              <th className="py-2 pr-4">직접 입력</th>
              <th className="py-2 pr-4">비고</th>
            </tr>
          </thead>
          <tbody>
            {report.workers.map(worker => (
              <tr key={worker.id} className="border-t">
                <td className="py-2 pr-4 text-foreground">
                  {worker.workerName || worker.workerId || '이름없음'}
                </td>
                <td className="py-2 pr-4">{formatNumber(worker.hours, 1)}</td>
                <td className="py-2 pr-4">
                  {worker.isDirectInput ? (
                    <Badge variant="outline">직접</Badge>
                  ) : (
                    <Badge variant="secondary">연동</Badge>
                  )}
                </td>
                <td className="py-2 pr-4">{worker.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderMaterials = () => {
    if (!report?.materials || report.materials.length === 0) {
      return <div className="text-sm text-muted-foreground">자재 사용 정보가 없습니다.</div>
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="py-2 pr-4">자재명</th>
              <th className="py-2 pr-4">수량</th>
              <th className="py-2 pr-4">단위</th>
              <th className="py-2 pr-4">비고</th>
            </tr>
          </thead>
          <tbody>
            {report.materials.map(material => (
              <tr key={material.id} className="border-t">
                <td className="py-2 pr-4 text-foreground">
                  {material.materialName || material.materialCode || '자재'}
                </td>
                <td className="py-2 pr-4">{formatNumber(material.quantity, 2)}</td>
                <td className="py-2 pr-4">{material.unit || '-'}</td>
                <td className="py-2 pr-4">{material.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderAdditionalPhotos = () => {
    const photos = report?.additionalPhotos || []
    if (photos.length === 0) return null

    const sorted = [...photos].sort((a, b) => {
      if (a.photo_type === b.photo_type) {
        return (a.upload_order ?? 0) - (b.upload_order ?? 0)
      }
      return a.photo_type === 'before' ? -1 : 1
    })
    const before = sorted.filter(photo => photo.photo_type === 'before')
    const after = sorted.filter(photo => photo.photo_type === 'after')
    const totalCount = photos.length

    const renderPreviewGroup = (title: string, items: typeof photos) => (
      <div className="space-y-2">
        <div className="text-sm font-medium text-foreground">{title}</div>
        {items.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded border border-dashed text-sm text-muted-foreground">
            사진 없음
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {items.map(photo => (
              <div
                key={`${title}-${photo.id ?? photo.filename}`}
                className="overflow-hidden rounded-lg border bg-card shadow-sm"
              >
                <div className="relative h-48 w-full bg-muted">
                  {photo.url ? (
                    <Image
                      src={photo.url}
                      alt={photo.filename || 'photo'}
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      미리보기 없음
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 p-3 text-sm text-muted-foreground">
                  <div
                    className="text-sm font-semibold text-foreground"
                    title={photo.filename || ''}
                  >
                    {photo.filename || '사진'}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium text-foreground">{title}</span>
                    <span>{photo.uploaded_at ? formatDate(photo.uploaded_at) : '-'}</span>
                  </div>
                  <div className="text-xs">업로더: {photo.uploaded_by_name || '알 수 없음'}</div>
                  {photo.description && (
                    <div className="text-sm leading-relaxed text-foreground">
                      {photo.description}
                    </div>
                  )}
                  <div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => photo.url && handleOpenFile(photo.url)}
                      disabled={!photo.url}
                    >
                      원본 보기
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )

    const renderListGroup = (title: string, items: typeof photos) => (
      <div className="rounded-lg border bg-muted/20">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="text-sm font-semibold text-foreground">{title}</div>
          <Badge variant="secondary">{items.length}장</Badge>
        </div>
        {items.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">
            사진 없음
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-muted-foreground">
              <thead>
                <tr className="bg-muted/40 text-left uppercase tracking-wide">
                  <th className="px-3 py-2 font-medium">미리보기</th>
                  <th className="px-3 py-2 font-medium">파일명</th>
                  <th className="px-3 py-2 font-medium">업로드일</th>
                  <th className="px-3 py-2 font-medium">업로더</th>
                  <th className="px-3 py-2 font-medium">메모</th>
                  <th className="px-3 py-2 font-medium">원본</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map(photo => (
                  <tr key={photo.id || photo.filename} className="bg-background/70">
                    <td className="px-3 py-2">
                      <div className="relative h-14 w-20 overflow-hidden rounded border bg-muted">
                        {photo.url ? (
                          <Image
                            src={photo.url}
                            alt={photo.filename || 'photo'}
                            fill
                            sizes="80px"
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                            없음
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-foreground">
                      <span className="line-clamp-2" title={photo.filename || ''}>
                        {photo.filename || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {photo.uploaded_at ? formatDate(photo.uploaded_at) : '-'}
                    </td>
                    <td className="px-3 py-2">{photo.uploaded_by_name || '알 수 없음'}</td>
                    <td className="px-3 py-2">
                      {photo.description ? (
                        <span className="line-clamp-2">{photo.description}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => photo.url && handleOpenFile(photo.url)}
                        disabled={!photo.url}
                      >
                        보기
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )

    return (
      <Card className="border shadow-sm">
        <CardHeader className="px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">추가 사진</CardTitle>
              <CardDescription>작업 전/후 사진</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">전체 {totalCount}장</Badge>
              <Badge variant="outline">보수 전 {before.length}장</Badge>
              <Badge variant="outline">보수 후 {after.length}장</Badge>
              <Button
                size="sm"
                variant={photosViewMode === 'preview' ? 'primary' : 'outline'}
                onClick={() => setPhotosViewMode('preview')}
                aria-pressed={photosViewMode === 'preview'}
              >
                <LayoutGrid className="mr-1 h-4 w-4" />
                미리보기
              </Button>
              <Button
                size="sm"
                variant={photosViewMode === 'list' ? 'primary' : 'outline'}
                onClick={() => setPhotosViewMode('list')}
                aria-pressed={photosViewMode === 'list'}
              >
                <List className="mr-1 h-4 w-4" />
                리스트
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-4">
          {photosViewMode === 'preview' ? (
            <div className="grid gap-4 md:grid-cols-2">
              {renderPreviewGroup('보수 전', before)}
              {renderPreviewGroup('보수 후', after)}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {renderListGroup('보수 전', before)}
              {renderListGroup('보수 후', after)}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (!report && loading) {
    return <div className="text-sm text-muted-foreground">작업일지를 불러오는 중입니다...</div>
  }

  if (!report) {
    return (
      <div className="text-sm text-destructive">{error || '작업일지를 불러올 수 없습니다.'}</div>
    )
  }

  const additionalPhotosSection = renderAdditionalPhotos()
  const attachmentList = useMemo(() => {
    const withType = (
      items: UnifiedAttachment[],
      type?: 'photo' | 'drawing' | 'confirmation' | 'other'
    ) =>
      items.map(item => ({
        ...item,
        __type: type,
      }))
    return [
      ...withType(attachments.photos, 'photo'),
      ...withType(attachments.drawings, 'drawing'),
      ...withType(attachments.confirmations, 'confirmation'),
      ...withType(attachments.others, 'other'),
    ]
  }, [attachments])

  const renderAttachmentsCard = (extraClass?: string) => (
    <Card className={`border shadow-sm ${extraClass ?? ''}`}>
      <CardHeader className="px-4 py-3">
        <CardTitle className="text-base">첨부 문서</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {attachmentList.length === 0 ? (
          <div className="text-sm text-muted-foreground">첨부 문서가 없습니다.</div>
        ) : (
          <div className="space-y-2">
            {attachmentList.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded border p-2 text-sm"
              >
                <div className="truncate">
                  <div
                    className="font-medium text-foreground truncate max-w-[340px]"
                    title={item.name}
                  >
                    {item.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.uploadedAt ? formatDate(item.uploadedAt) : '업로드 정보 없음'}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleOpenFile(item.url)}>
                  보기
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-4">
      <Card className="border shadow-sm">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-lg font-semibold">
            {report.siteName || siteName || '-'}
          </CardTitle>
          <CardDescription>{formatDate(report.workDate || workDate)}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 px-4 pb-4 text-sm text-muted-foreground md:grid-cols-4">
          <div>
            <div className="text-xs">상태</div>
            <div className="text-foreground font-medium">
              {renderStatus(report.status || status)}
            </div>
          </div>
          <div>
            <div className="text-xs">작성자</div>
            <div className="text-foreground font-medium">{report.authorName || author || '-'}</div>
          </div>
          <div>
            <div className="text-xs">총 인원</div>
            <div className="text-foreground font-medium">{workerStats.total_workers ?? '-'}</div>
          </div>
          <div>
            <div className="text-xs">총 공수</div>
            <div className="text-foreground font-medium">
              {formatNumber(workerStats.total_hours, 1)}
            </div>
          </div>
          {report.npcUsage && (
            <div className="md:col-span-4 grid gap-2 rounded border p-3 md:grid-cols-4">
              <div>
                <div className="text-xs">NPC-1000 입고</div>
                <div className="text-foreground">{report.npcUsage.incoming ?? '-'}</div>
              </div>
              <div>
                <div className="text-xs">사용</div>
                <div className="text-foreground">{report.npcUsage.used ?? '-'}</div>
              </div>
              <div>
                <div className="text-xs">잔량</div>
                <div className="text-foreground">{report.npcUsage.remaining ?? '-'}</div>
              </div>
              <div>
                <div className="text-xs">사용률</div>
                <div className="text-foreground">
                  {(() => {
                    const incoming = Number(report.npcUsage?.incoming ?? 0)
                    const used = Number(report.npcUsage?.used ?? 0)
                    if (!incoming || incoming <= 0) return '0%'
                    const rate = (used / incoming) * 100
                    return `${rate.toFixed(1)}%`
                  })()}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <a href={documentsLinkUrl} target="_blank" rel="noreferrer">
            현장공유함 열기
          </a>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {linkedDrawings.length > 0 && (
          <Card className="border shadow-sm lg:col-span-2">
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-base">연결된 진행도면</CardTitle>
              <CardDescription>현장공유함/마킹 도구와 연동된 도면</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-4">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">미리보기</th>
                      <th className="px-3 py-2">도면명</th>
                      <th className="px-3 py-2">출처</th>
                      <th className="px-3 py-2 text-right">동작</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {linkedDrawings.map(att => {
                      const preview = att.url
                      const meta =
                        att.metadata && typeof att.metadata === 'object' ? att.metadata : {}
                      const sourceLabel =
                        (att?.uploader?.full_name as string) ||
                        (att?.uploaded_by_name as string) ||
                        (meta?.uploader_name as string) ||
                        (meta?.uploader?.full_name as string) ||
                        (meta?.uploaded_by_profile?.full_name as string) ||
                        '작성자 미상'
                      const markupHref = getMarkupLinkFromAttachment(att)
                      const snapshotPdfUrl =
                        typeof meta?.snapshot_pdf_url === 'string' &&
                        meta.snapshot_pdf_url.length > 0
                          ? meta.snapshot_pdf_url
                          : undefined
                      return (
                        <tr key={att.id || att.name}>
                          <td className="px-3 py-2">
                            <div className="relative h-14 w-20 overflow-hidden rounded border bg-muted">
                              {preview ? (
                                <Image
                                  src={preview}
                                  alt={att.name}
                                  fill
                                  sizes="80px"
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                                  없음
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 font-medium text-foreground">
                            {att.name || '-'}
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{sourceLabel}</td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              {snapshotPdfUrl ? (
                                <Button asChild size="sm" variant="secondary">
                                  <a href={snapshotPdfUrl} target="_blank" rel="noreferrer">
                                    PDF
                                  </a>
                                </Button>
                              ) : null}
                              {markupHref ? (
                                <Button asChild size="sm" variant="secondary">
                                  <a href={markupHref}>도면마킹 열기</a>
                                </Button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
        <Card className="border shadow-sm h-full">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-base">작업 내용</CardTitle>
            <CardDescription>{WORK_CONTENT_DESCRIPTION}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4 text-sm text-muted-foreground">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div className="text-xs">부재명</div>
                <div className="text-foreground font-medium">{renderArray(memberNames)}</div>
              </div>
              <div>
                <div className="text-xs">작업공정</div>
                <div className="text-foreground font-medium">{renderArray(processNames)}</div>
              </div>
              <div>
                <div className="text-xs">작업 유형</div>
                <div className="text-foreground font-medium">{renderArray(report.workTypes)}</div>
              </div>
              <div>
                <div className="text-xs">작업 내용 요약</div>
                <div className="text-foreground font-medium">
                  {renderArray((report.meta?.workContents as string[]) || [])}
                </div>
              </div>
            </div>
            {renderWorkEntries()}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="border shadow-sm">
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-base">작업 위치</CardTitle>
              <CardDescription>블럭 / 동 / 호</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 px-4 pb-4 text-sm text-muted-foreground md:grid-cols-3">
              <div>
                <div className="text-xs">블럭</div>
                <div className="text-foreground font-medium">{report.location?.block || '-'}</div>
              </div>
              <div>
                <div className="text-xs">동</div>
                <div className="text-foreground font-medium">{report.location?.dong || '-'}</div>
              </div>
              <div>
                <div className="text-xs">호수 / 층</div>
                <div className="text-foreground font-medium">{report.location?.unit || '-'}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-base">본사 요청 및 비고</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 px-4 pb-4 text-sm text-muted-foreground md:grid-cols-2">
              <div>
                <div className="text-xs">본사 요청사항</div>
                <div className="text-foreground font-medium">{report.hqRequest || '-'}</div>
              </div>
              <div>
                <div className="text-xs">비고</div>
                <div className="text-foreground font-medium">{report.notes || '-'}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border shadow-sm">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-base">작업자 내역</CardTitle>
            <CardDescription>배정 / 공수 / 입력 방식</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">{renderWorkers()}</CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-base">자재 사용</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">{renderMaterials()}</CardContent>
        </Card>
      </div>

      {additionalPhotosSection ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {renderAttachmentsCard('lg:col-span-2')}
          <div className="lg:col-span-2">{additionalPhotosSection}</div>
        </div>
      ) : (
        renderAttachmentsCard()
      )}

      {relatedReports.length > 0 && (
        <Card className="border shadow-sm">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-base">관련 작업일지</CardTitle>
            <CardDescription>같은 현장의 최근 작업일지</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2 pr-4">일자</th>
                    <th className="py-2 pr-4">구성/공정</th>
                    <th className="py-2 pr-4">상태</th>
                    <th className="py-2 pr-4">바로가기</th>
                  </tr>
                </thead>
                <tbody>
                  {relatedReports.map(reportItem => (
                    <tr key={reportItem.id} className="border-t">
                      <td className="py-2 pr-4">
                        {formatDate(reportItem.work_date || reportItem.workDate)}
                      </td>
                      <td className="py-2 pr-4 text-foreground">
                        {(reportItem.member_name || reportItem.memberName || '-') +
                          ' / ' +
                          (reportItem.process_type || reportItem.processType || '-')}
                      </td>
                      <td className="py-2 pr-4">{reportItem.status || '-'}</td>
                      <td className="py-2 pr-4">
                        <a
                          className="underline"
                          href={`/dashboard/admin/daily-reports/${reportItem.id}`}
                        >
                          열기
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {error && <div className="text-sm text-destructive">{error}</div>}
    </div>
  )
}
const STATUS_LABEL: Record<string, string> = {
  draft: '작성 중',
  submitted: '제출됨',
  approved: '승인됨',
  completed: '완료',
  revision: '수정 필요',
  archived: '보관됨',
}

const renderStatus = (value?: string | null) => {
  if (!value) return '-'
  return STATUS_LABEL[value] || value
}
