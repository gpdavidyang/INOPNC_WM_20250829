'use client'

import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import {
  integratedResponseToUnifiedReport,
  type AdminIntegratedResponse,
} from '@/lib/daily-reports/unified-admin'
import { openFileRecordInNewTab } from '@/lib/files/preview'
import type {
  AdditionalPhotoData,
  UnifiedAttachment,
  UnifiedDailyReport,
  UnifiedWorkerEntry,
} from '@/types/daily-reports'
import { useRouter } from 'next/navigation'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type DragEvent as ReactDragEvent,
} from 'react'
import { ImageLightbox } from './detail/ImageLightbox'
import { LinkedDrawingSection } from './detail/LinkedDrawingSection'
import { MaterialUsageSection } from './detail/MaterialUsageSection'
import { PhotoRegistrySection } from './detail/PhotoRegistrySection'
import { ReportHeader } from './detail/ReportHeader'
import { ReportInfoGrid } from './detail/ReportInfoGrid'
import { ReportRejectionForm } from './detail/ReportRejectionForm'
import { ReportStats } from './detail/ReportStats'
import { WorkforceSection } from './detail/WorkforceSection'

interface DailyReportDetailClientProps {
  reportId: string
  siteName?: string
  workDate?: string
  status?: string
  author?: string
  initialReport?: UnifiedDailyReport
  allowEditing?: boolean
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

type PhotoBuckets = {
  before: AdditionalPhotoData[]
  after: AdditionalPhotoData[]
}

const buildPhotoBuckets = (photos?: AdditionalPhotoData[]): PhotoBuckets => {
  const list = Array.isArray(photos) ? [...photos] : []
  const normalize = (items: AdditionalPhotoData[]) =>
    items
      .sort((a, b) => (a.upload_order ?? 0) - (b.upload_order ?? 0))
      .map((photo, index) => ({ ...photo, upload_order: index + 1 }))

  const before = normalize(list.filter(photo => photo.photo_type === 'before'))
  const after = normalize(list.filter(photo => photo.photo_type === 'after'))

  return { before, after }
}

const cloneBuckets = (input: PhotoBuckets): PhotoBuckets => ({
  before: input.before.map(photo => ({ ...photo })),
  after: input.after.map(photo => ({ ...photo })),
})

const mergeBuckets = (buckets: PhotoBuckets): AdditionalPhotoData[] => [
  ...buckets.before,
  ...buckets.after,
]

const mapWorkersToStats = (
  workers: Array<UnifiedWorkerEntry | { work_hours?: number; hours?: number }>
): WorkerStatistics => {
  const stats = workers.reduce(
    (acc, worker) => {
      acc.total_workers += 1
      const hours = Number(
        (worker as UnifiedWorkerEntry).hours ?? (worker as any).work_hours ?? (worker as any).hours
      )
      if (Number.isFinite(hours)) {
        acc.total_hours += hours
      }
      return acc
    },
    {
      ...initialWorkerStats,
    }
  )

  // Input data (UnifiedWorkerEntry) already has hours normalized to man-days (공수)
  return {
    ...stats,
    total_hours: stats.total_hours > 0 ? Number(stats.total_hours.toFixed(1)) : 0,
  }
}

export default function DailyReportDetailClient({
  reportId,
  siteName,
  workDate,
  status,
  author,
  initialReport,
  allowEditing = false,
}: DailyReportDetailClientProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [report, setReport] = useState<UnifiedDailyReport | null>(initialReport ?? null)
  const [integrated, setIntegrated] = useState<AdminIntegratedResponse | null>(null)
  const [loading, setLoading] = useState(!initialReport)
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photosViewMode, setPhotosViewMode] = useState<'preview' | 'list'>('preview')
  const [photoBuckets, setPhotoBuckets] = useState<PhotoBuckets>(() =>
    buildPhotoBuckets(initialReport?.additionalPhotos)
  )
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set())
  const [photoActionLoading, setPhotoActionLoading] = useState(false)
  const [orderSaving, setOrderSaving] = useState(false)
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const dragRef = useRef<{ type: 'before' | 'after'; index: number } | null>(null)

  const handleFileDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch (e) {
      toast({
        title: '다운로드 실패',
        description: '파일을 다운로드하는 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    }
  }

  const handleStatusChange = async (action: 'approve' | 'revert' | 'reject', reason?: string) => {
    setApprovalLoading(true)
    try {
      const res = await fetch(`/api/admin/daily-reports/${reportId}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || '상태 변경에 실패했습니다.')
      }

      toast({
        title: '상태 변경 완료',
        description: data.message || '작업일지 상태를 변경했습니다.',
      })

      setRejecting(false)
      setRejectionReason('')

      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      toast({
        title: '오류 발생',
        description: (error as Error)?.message || '상태 변경 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setApprovalLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (initialReport) {
      setReport(initialReport)
      setPhotoBuckets(buildPhotoBuckets(initialReport.additionalPhotos))
      setLoading(false)
    }
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

    if (report?.workers && report.workers.length > 0) {
      return mapWorkersToStats(report.workers)
    }

    if (report?.workers && report.workers.length > 0) {
      return mapWorkersToStats(report.workers)
    }

    const metaTotals =
      (report?.meta as { totalWorkers?: number; totalHours?: number } | undefined) || {}
    if (typeof metaTotals.totalWorkers === 'number' || typeof metaTotals.totalHours === 'number') {
      return {
        ...initialWorkerStats,
        total_workers: metaTotals.totalWorkers ?? 0,
        total_hours: metaTotals.totalHours ?? 0,
      }
    }

    if (typeof (report as any)?.total_workers === 'number') {
      return {
        ...initialWorkerStats,
        total_workers: (report as any).total_workers ?? 0,
      }
    }

    return initialWorkerStats
  }, [integrated, report])

  useEffect(() => {
    setPhotoBuckets(buildPhotoBuckets(report?.additionalPhotos))
    setSelectedPhotoIds(new Set())
  }, [report?.additionalPhotos])

  const updateReportPhotos = (next: PhotoBuckets) => {
    setPhotoBuckets(next)
    setReport(prev =>
      prev
        ? {
            ...prev,
            additionalPhotos: mergeBuckets(next),
          }
        : prev
    )
  }

  const totalPhotoCount = photoBuckets.before.length + photoBuckets.after.length
  const selectedCount = selectedPhotoIds.size
  const reorderDisabled = photoActionLoading || orderSaving

  const togglePhotoSelection = (photoId?: string | null) => {
    if (!photoId) return
    setSelectedPhotoIds(prev => {
      const next = new Set(prev)
      if (next.has(photoId)) {
        next.delete(photoId)
      } else {
        next.add(photoId)
      }
      return next
    })
  }

  const toggleGroupSelection = (type: 'before' | 'after') => {
    const ids = photoBuckets[type].map(photo => photo.id).filter((id): id is string => Boolean(id))
    if (ids.length === 0) return
    const allSelected = ids.every(id => selectedPhotoIds.has(id))
    setSelectedPhotoIds(prev => {
      const next = new Set(prev)
      if (allSelected) {
        ids.forEach(id => next.delete(id))
      } else {
        ids.forEach(id => next.add(id))
      }
      return next
    })
  }

  const toggleAllSelection = () => {
    if (totalPhotoCount === 0) return
    const ids = [...photoBuckets.before, ...photoBuckets.after]
      .map(photo => photo.id)
      .filter((id): id is string => Boolean(id))
    if (ids.length === 0) return
    const allSelected = ids.every(id => selectedPhotoIds.has(id))
    setSelectedPhotoIds(allSelected ? new Set() : new Set(ids))
  }

  const persistOrder = async (type: 'before' | 'after', list: AdditionalPhotoData[]) => {
    const updates = list
      .map((photo, index) => ({
        id: photo.id,
        upload_order: index + 1,
      }))
      .filter((item): item is { id: string; upload_order: number } => Boolean(item.id))

    if (updates.length === 0) return

    const response = await fetch(
      `/api/admin/daily-reports/${encodeURIComponent(reportId)}/additional-photos/reorder`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      }
    )
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || payload?.success === false) {
      throw new Error(payload?.error || '순서를 저장하지 못했습니다.')
    }
  }

  const handleReorder = (type: 'before' | 'after', fromIndex: number, toIndex: number) => {
    if (reorderDisabled) return
    if (fromIndex === toIndex) return
    const list = photoBuckets[type]
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= list.length ||
      toIndex >= list.length ||
      list.length < 2
    ) {
      return
    }
    const previousState = cloneBuckets(photoBuckets)
    const nextState = cloneBuckets(photoBuckets)
    const workingList = nextState[type]
    const [moved] = workingList.splice(fromIndex, 1)
    workingList.splice(toIndex, 0, moved)
    nextState[type] = workingList.map((photo, index) => ({ ...photo, upload_order: index + 1 }))
    updateReportPhotos(nextState)
    setOrderSaving(true)
    persistOrder(type, nextState[type])
      .then(() => {
        toast({ title: '순서를 변경했습니다.' })
      })
      .catch(error => {
        console.error('[daily-report-detail] reorder failed', error)
        updateReportPhotos(previousState)
        toast({
          title: '순서 변경 실패',
          description:
            error instanceof Error ? error.message : '순서를 저장하는 중 오류가 발생했습니다.',
          variant: 'destructive',
        })
      })
      .finally(() => setOrderSaving(false))
  }

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedPhotoIds).filter(Boolean)
    if (ids.length === 0 || photoActionLoading) return
    setPhotoActionLoading(true)
    const failed: string[] = []
    for (const id of ids) {
      try {
        const response = await fetch(`/api/mobile/media/photos/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          credentials: 'include',
        })
        const result = await response.json().catch(() => ({}))
        if (!response.ok || result?.error) {
          throw new Error(result?.error || '삭제 실패')
        }
      } catch (err) {
        console.error('[daily-report-detail] delete photo error', err)
        failed.push(id)
      }
    }
    const deletedIds = ids.filter(id => !failed.includes(id))
    if (deletedIds.length > 0) {
      const nextState: PhotoBuckets = {
        before: photoBuckets.before
          .filter(photo => !deletedIds.includes(photo.id ?? ''))
          .map((photo, index) => ({ ...photo, upload_order: index + 1 })),
        after: photoBuckets.after
          .filter(photo => !deletedIds.includes(photo.id ?? ''))
          .map((photo, index) => ({ ...photo, upload_order: index + 1 })),
      }
      updateReportPhotos(nextState)
      setSelectedPhotoIds(prev => {
        const next = new Set(prev)
        deletedIds.forEach(id => next.delete(id))
        return next
      })
      try {
        await Promise.all([
          persistOrder('before', nextState.before),
          persistOrder('after', nextState.after),
        ])
      } catch (err) {
        console.warn('[daily-report-detail] reorder after delete failed', err)
      }
      toast({
        title: '사진 삭제 완료',
        description: `${deletedIds.length}건의 사진을 삭제했습니다.`,
      })
    }
    if (failed.length > 0) {
      toast({
        title: '일부 사진 삭제 실패',
        description: `${failed.length}건의 사진을 삭제하지 못했습니다.`,
        variant: 'destructive',
      })
    }
    setPhotoActionLoading(false)
  }

  const handleBulkDownload = async () => {
    const ids = Array.from(selectedPhotoIds).filter(Boolean)
    if (ids.length === 0) return

    const toastId = toast({
      title: '다운로드 준비 중',
      description: `${ids.length}개의 파일을 다운로드합니다.`,
    })

    const allPhotos = [...photoBuckets.before, ...photoBuckets.after]
    const selectedPhotos = allPhotos.filter(p => p.id && selectedPhotoIds.has(p.id))

    for (const photo of selectedPhotos) {
      if (photo.url) {
        await handleFileDownload(photo.url, photo.filename || 'photo.jpg')
        // Give the browser a moment between downloads
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }
  }

  const handleDragStart =
    (type: 'before' | 'after', index: number) => (event: ReactDragEvent<HTMLElement>) => {
      if (reorderDisabled) return
      dragRef.current = { type, index }
      event.dataTransfer?.setData('text/plain', `${type}-${index}`)
    }

  const handleDragOver =
    (type: 'before' | 'after', index: number) => (event: ReactDragEvent<HTMLElement>) => {
      if (reorderDisabled) return
      if (!dragRef.current || dragRef.current.type !== type) return
      event.preventDefault()
    }

  const handleDrop =
    (type: 'before' | 'after', index: number) => (event: ReactDragEvent<HTMLElement>) => {
      if (!dragRef.current || dragRef.current.type !== type) return
      event.preventDefault()
      const { index: fromIndex } = dragRef.current
      dragRef.current = null
      handleReorder(type, fromIndex, index)
    }

  const handleDragEnd = () => {
    dragRef.current = null
  }

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
    const markupId =
      (typeof meta?.markup_document_id === 'string' && meta.markup_document_id) ||
      (typeof meta?.source_id === 'string' && meta.source_id) ||
      (typeof meta?.document_id === 'string' && meta.document_id) ||
      (attachment.type === 'drawing' ? attachment.id : null) ||
      null
    return markupId ? `/dashboard/admin/tools/markup?docId=${markupId}` : null
  }

  const relatedReports = integrated?.related_reports ?? []

  const buildFileRecordFromSource = (
    source: UnifiedAttachment | AdditionalPhotoData
  ): {
    file_url?: string
    storage_bucket?: string
    storage_path?: string
    file_name?: string
    title?: string
  } => {
    const metadata =
      source && 'metadata' in source && source.metadata && typeof source.metadata === 'object'
        ? (source.metadata as Record<string, any>)
        : {}
    const storageBucket =
      metadata.storage_bucket || metadata.bucket || (source as any).storage_bucket || undefined
    const storagePath =
      (source as any).storage_path ||
      (source as any).path ||
      metadata.storage_path ||
      metadata.path ||
      undefined
    return {
      file_url: source.url || metadata.url,
      storage_bucket: storageBucket,
      storage_path: storagePath,
      file_name: (source as UnifiedAttachment).name || (source as AdditionalPhotoData).filename,
      title: (source as UnifiedAttachment).name || (source as AdditionalPhotoData).filename,
    }
  }

  const hasFileReference = (source: UnifiedAttachment | AdditionalPhotoData): boolean => {
    const metadata =
      source && 'metadata' in source && source.metadata && typeof source.metadata === 'object'
        ? (source.metadata as Record<string, any>)
        : {}
    return Boolean(
      source.url ||
        (source as any).storage_path ||
        (source as any).path ||
        metadata.storage_path ||
        metadata.url
    )
  }

  const handleOpenFile = async (source: UnifiedAttachment | AdditionalPhotoData) => {
    const record = buildFileRecordFromSource(source)
    if (!record.file_url && !record.storage_path) {
      alert('파일 정보를 찾을 수 없습니다.')
      return
    }
    try {
      await openFileRecordInNewTab(record)
    } catch (error) {
      console.error('Failed to open file', error)
      alert('파일을 열 수 없습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  if (!mounted || (!report && loading)) {
    return <div className="text-sm text-muted-foreground p-8">작업일지를 불러오는 중입니다...</div>
  }

  if (!report) {
    return (
      <div className="text-sm text-destructive">{error || '작업일지를 불러올 수 없습니다.'}</div>
    )
  }

  const primaryMemberType = report.memberTypes?.[0] || '-'
  const primaryProcessType = report.workProcesses?.[0] || '-'
  const primaryWorkType = report.workTypes?.[0] || '-'
  const locationValues = [
    report.location?.block,
    report.location?.dong,
    report.location?.unit,
  ].filter(Boolean)
  const locationDisplay = locationValues.length > 0 ? locationValues.join(' / ') : '미기입'
  const totalMaterials = Array.isArray(report.materials) ? report.materials.length : 0
  const attachmentsCount = attachmentList.length
  const directInputCount = Array.isArray(report.workers)
    ? report.workers.filter(worker => worker.isDirectInput).length
    : 0
  const linkedInputCount =
    (Array.isArray(report.workers) ? report.workers.length : 0) - directInputCount

  const normalizedStatus = String(report.status || status || '').toLowerCase()
  const editableStatuses: Array<string> = ['draft', 'submitted', 'rejected']
  const canEditReport = allowEditing && editableStatuses.includes(normalizedStatus)
  const showEditGuidance = canEditReport && normalizedStatus !== 'draft'
  const editHref = canEditReport ? `/dashboard/admin/daily-reports/${reportId}/edit` : null

  const infoChips = [
    { label: '작성자', value: report.authorName || author || '-' },
    { label: '부재명', value: primaryMemberType },
    { label: '작업공정', value: primaryProcessType },
    { label: '작업유형', value: primaryWorkType },
    { label: '블록/동/층', value: locationDisplay },
  ]

  const statCards = [
    {
      label: '총 공수',
      value: `${formatNumber(workerStats.total_hours, 1)} 공수`,
      helper: `야근 ${formatNumber(workerStats.total_overtime ?? 0, 1)} 공수`,
    },
    {
      label: '자재 사용',
      value: `${totalMaterials}건`,
      helper: totalMaterials > 0 ? '현장 자재 내역 포함' : '등록된 자재 없음',
    },
    {
      label: '도면/사진',
      value: `${linkedDrawings.length}개/${totalPhotoCount}장`,
      helper: '업로드 된 도면/사진',
    },
  ]

  const workerHighlightItems = [
    { label: '직접 입력', value: `${directInputCount}명` },
    { label: '연동 입력', value: `${Math.max(linkedInputCount, 0)}명` },
    { label: '결근 인원', value: `${workerStats.absent_workers ?? 0}명` },
    { label: '야근 공수', value: `${formatNumber(workerStats.total_overtime ?? 0, 1)} 공수` },
  ]

  return (
    <div className="space-y-6">
      <Card className="border shadow-sm">
        <ReportHeader
          siteName={report.siteName || siteName || '-'}
          workDate={report.workDate || workDate || ''}
          status={report.status || status || 'draft'}
          rejectionReason={report.rejectionReason}
          approvalLoading={approvalLoading}
          rejecting={rejecting}
          setRejecting={setRejecting}
          onStatusChange={handleStatusChange}
          canEditReport={canEditReport}
          editHref={editHref}
          showEditGuidance={showEditGuidance}
        />
        <ReportInfoGrid items={infoChips} />
      </Card>

      {/* Rejection UI - Inline following header */}
      {rejecting && (
        <ReportRejectionForm
          rejectionReason={rejectionReason}
          setRejectionReason={setRejectionReason}
          onCancel={() => {
            setRejecting(false)
            setRejectionReason('')
          }}
          onSubmit={reason => handleStatusChange('reject', reason)}
          loading={approvalLoading}
        />
      )}

      {/* Top Summary Cards */}
      <ReportStats stats={statCards} />

      {/* Main Sections: 1 Row, 3 Columns */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Column 1: 작업 인력 정보 */}
        <WorkforceSection workers={report.workers ?? []} formatNumber={formatNumber} />

        {/* Column 2: 자재 사용 내역 */}
        <MaterialUsageSection materials={report.materials ?? []} formatNumber={formatNumber} />

        {/* Column 3: 연결 된 도면 */}
        <LinkedDrawingSection
          linkedDrawings={linkedDrawings}
          onPreview={setPreviewImage}
          onDownload={handleFileDownload}
          getMarkupLink={getMarkupLinkFromAttachment}
        />
      </div>

      {/* Row 2: 추가 사진 (Full Width) */}
      <div className="w-full">
        <PhotoRegistrySection
          photoBuckets={photoBuckets}
          photosViewMode={photosViewMode}
          setPhotosViewMode={setPhotosViewMode}
          totalPhotoCount={totalPhotoCount}
          selectedCount={selectedCount}
          selectedPhotoIds={selectedPhotoIds}
          togglePhotoSelection={togglePhotoSelection}
          toggleGroupSelection={toggleGroupSelection}
          toggleAllSelection={toggleAllSelection}
          onClearSelection={() => setSelectedPhotoIds(new Set())}
          handleBulkDelete={handleBulkDelete}
          handleBulkDownload={handleBulkDownload}
          photoActionLoading={photoActionLoading}
          reorderDisabled={reorderDisabled}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          onOpenFile={handleOpenFile}
          onPreview={setPreviewImage}
          formatDate={formatDate}
          hasFileReference={hasFileReference}
        />
      </div>

      {error && <div className="text-sm text-destructive">{error}</div>}
      <ImageLightbox previewImage={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  )
}
const STATUS_LABEL: Record<string, string> = {
  draft: '임시',
  submitted: '제출',
  approved: '승인',
  rejected: '반려',
  completed: '완료',
  revision: '수정 필요',
  archived: '보관됨',
}

const renderStatus = (value?: string | null) => {
  if (!value) return '-'
  return STATUS_LABEL[value] || value
}
