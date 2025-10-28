'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

const AttachmentSection = ({
  title,
  items,
  onOpen,
}: {
  title: string
  items: UnifiedAttachment[]
  onOpen: (url: string) => void
}) => (
  <div>
    <div className="mb-2 font-medium text-foreground">{title}</div>
    {items.length === 0 ? (
      <div className="text-sm text-muted-foreground">첨부 없음</div>
    ) : (
      <div className="grid grid-cols-1 gap-2">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between rounded border p-2">
            <div className="truncate">
              <div className="font-medium text-foreground truncate max-w-[340px]" title={item.name}>
                {item.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.uploadedAt ? formatDate(item.uploadedAt) : '업로드 정보 없음'}
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => onOpen(item.url)}>
              보기
            </Button>
          </div>
        ))}
      </div>
    )}
  </div>
)

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
                <span className="text-xs">공정</span>
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
    if (!report?.additionalPhotos || report.additionalPhotos.length === 0) {
      return null
    }

    const before = report.additionalPhotos.filter(photo => photo.photo_type === 'before')
    const after = report.additionalPhotos.filter(photo => photo.photo_type === 'after')

    const renderGroup = (title: string, photos: typeof report.additionalPhotos) => (
      <div>
        <div className="mb-2 text-sm font-medium text-foreground">{title}</div>
        {photos.length === 0 ? (
          <div className="text-sm text-muted-foreground">사진 없음</div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {photos.map(photo => (
              <div key={photo.id} className="rounded border p-3">
                <div className="text-sm font-medium text-foreground">
                  {photo.filename || '사진'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {photo.uploaded_at ? formatDate(photo.uploaded_at) : ''}
                </div>
                {photo.description && (
                  <div className="mt-2 text-sm text-muted-foreground">{photo.description}</div>
                )}
                {photo.url && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => handleOpenFile(photo.url ?? '')}
                  >
                    보기
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )

    return (
      <Card>
        <CardHeader>
          <CardTitle>추가 사진</CardTitle>
          <CardDescription>작업 전/후 사진</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderGroup('작업 전', before)}
          {renderGroup('작업 후', after)}
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{report.siteName || siteName || '-'}</CardTitle>
          <CardDescription>{formatDate(report.workDate || workDate)}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-4">
          <div>
            <div className="text-xs">상태</div>
            <div className="text-foreground font-medium">{report.status || status || '-'}</div>
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
            <div className="md:col-span-4 grid gap-3 rounded border p-3 md:grid-cols-4">
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

      <Card>
        <CardHeader>
          <CardTitle>작업 내용</CardTitle>
          <CardDescription>부재 / 공정 / 구간 / 상세</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <div className="text-xs">부재 유형</div>
              <div className="text-foreground font-medium">{renderArray(report.memberTypes)}</div>
            </div>
            <div>
              <div className="text-xs">공정</div>
              <div className="text-foreground font-medium">{renderArray(report.workProcesses)}</div>
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

      <Card>
        <CardHeader>
          <CardTitle>작업 위치</CardTitle>
          <CardDescription>블럭 / 동 / 호</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
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

      <Card>
        <CardHeader>
          <CardTitle>안전 및 비고</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm text-muted-foreground md:grid-cols-2">
          <div>
            <div className="text-xs">본사 요청사항</div>
            <div className="text-foreground font-medium">{report.hqRequest || '-'}</div>
          </div>
          <div>
            <div className="text-xs">특이사항</div>
            <div className="text-foreground font-medium">{report.issues || '-'}</div>
          </div>
          <div>
            <div className="text-xs">안전 메모</div>
            <div className="text-foreground font-medium">{report.safetyNotes || '-'}</div>
          </div>
          <div>
            <div className="text-xs">비고</div>
            <div className="text-foreground font-medium">{report.notes || '-'}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>작업자 내역</CardTitle>
          <CardDescription>배정 / 공수 / 입력 방식</CardDescription>
        </CardHeader>
        <CardContent>{renderWorkers()}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>자재 사용</CardTitle>
        </CardHeader>
        <CardContent>{renderMaterials()}</CardContent>
      </Card>

      {renderAdditionalPhotos()}

      <Card>
        <CardHeader>
          <CardTitle>첨부 문서</CardTitle>
          <CardDescription>사진 / 도면 / 완료확인서 / 기타</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <AttachmentSection title="사진" items={attachments.photos} onOpen={handleOpenFile} />
          <AttachmentSection title="도면" items={attachments.drawings} onOpen={handleOpenFile} />
          <AttachmentSection
            title="완료확인서"
            items={attachments.confirmations}
            onOpen={handleOpenFile}
          />
          <AttachmentSection title="기타" items={attachments.others} onOpen={handleOpenFile} />
        </CardContent>
      </Card>

      {relatedReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>관련 작업일지</CardTitle>
            <CardDescription>같은 현장의 최근 작업일지</CardDescription>
          </CardHeader>
          <CardContent>
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
