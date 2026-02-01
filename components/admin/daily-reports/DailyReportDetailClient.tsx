'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Check,
  Download,
  GripVertical,
  LayoutGrid,
  List,
  Loader2,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type DragEvent as ReactDragEvent,
} from 'react'

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

  // Normalize hours to man-days (공수): 8 hours = 1.0 man-day
  return {
    ...stats,
    total_hours: stats.total_hours > 0 ? Number((stats.total_hours / 8).toFixed(1)) : 0,
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

  const renderArray = (values?: string[]) => (values && values.length > 0 ? values.join(', ') : '-')

  const renderTaskGroups = () => {
    // 0. Primary DB Columns Fallback (PRIORITY)
    // If the standard DB columns are populated, show them as the main work summary
    const hasDbData = Boolean(
      report?.meta?.componentName ||
        report?.meta?.workProcess ||
        report?.meta?.workSection ||
        report?.memberTypes?.length ||
        report?.workProcesses?.length
    )

    // 1. Try rendering structured taskGroups if available (New Schema)
    if (report?.taskGroups && report.taskGroups.length > 0) {
      return (
        <div className="space-y-4">
          {report.taskGroups.map((group, index) => (
            <div key={index} className="rounded border p-3 text-sm bg-muted/20">
              <div className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
                  작업 {index + 1}
                </span>
              </div>
              <div className="grid gap-2 text-muted-foreground">
                <div className="grid grid-cols-[80px_1fr] gap-2">
                  <span className="text-xs font-medium self-center">부재명</span>
                  <div className="text-foreground">{renderArray(group.memberTypes)}</div>
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-2">
                  <span className="text-xs font-medium self-center">작업공정</span>
                  <div className="text-foreground">{renderArray(group.workProcesses)}</div>
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-2">
                  <span className="text-xs font-medium self-center">작업유형</span>
                  <div className="text-foreground">{renderArray(group.workTypes)}</div>
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-2">
                  <span className="text-xs font-medium self-center">작업위치</span>
                  <div className="text-foreground">
                    {[
                      group.location?.block ? `${group.location.block}블록` : '',
                      group.location?.dong ? `${group.location.dong}동` : '',
                      group.location?.unit ? `${group.location.unit}층` : '',
                    ]
                      .filter(Boolean)
                      .join(' ') || '-'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    // 2. Direct simple display if no structured tasks but has DB columns
    if (hasDbData) {
      return (
        <div className="space-y-2">
          <div className="rounded border p-3 text-sm">
            <div className="grid gap-2 text-muted-foreground">
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <span className="text-xs font-medium self-center">부재명</span>
                <div className="text-foreground">
                  {report?.meta?.componentName || (report?.memberTypes || []).join(', ') || '-'}
                </div>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <span className="text-xs font-medium self-center">작업공정</span>
                <div className="text-foreground">
                  {report?.meta?.workProcess || (report?.workProcesses || []).join(', ') || '-'}
                </div>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <span className="text-xs font-medium self-center">작업유형</span>
                <div className="text-foreground">
                  {report?.meta?.workSection || (report?.workTypes || []).join(', ') || '-'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // 3. Absolute lack of data
    return <div className="text-sm text-muted-foreground">등록된 작업 내역이 없습니다.</div>
  }

  const renderWorkers = () => {
    if (!report?.workers || report.workers.length === 0) {
      return <div className="text-sm text-muted-foreground">작업자 배정 정보가 없습니다.</div>
    }

    return (
      <div className="overflow-x-auto px-5 pb-4">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b">
              <th className="py-3 font-semibold">작업자</th>
              <th className="py-3 font-semibold text-right">공수</th>
            </tr>
          </thead>
          <tbody>
            {report.workers.map(worker => (
              <tr
                key={worker.id}
                className="border-b last:border-0 hover:bg-slate-50/50 transition-colors"
              >
                <td className="py-3 text-foreground font-medium">
                  {worker.workerName || worker.workerId || '이름없음'}
                </td>
                <td className="py-3 text-right tabular-nums font-semibold text-blue-600">
                  {formatNumber(worker.hours / 8, 1)}
                </td>
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
      <div className="overflow-x-auto px-5 pb-4">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b">
              <th className="py-3 font-semibold">자재명</th>
              <th className="py-3 font-semibold">수량</th>
              <th className="py-3 font-semibold">단위</th>
              <th className="py-3 font-semibold">비고</th>
            </tr>
          </thead>
          <tbody>
            {report.materials.map(material => (
              <tr
                key={material.id}
                className="border-b last:border-0 hover:bg-slate-50/50 transition-colors"
              >
                <td className="py-3 text-foreground font-medium">
                  {material.materialName || material.materialCode || '자재'}
                </td>
                <td className="py-3 tabular-nums">{formatNumber(material.quantity, 2)}</td>
                <td className="py-3">{material.unit || '-'}</td>
                <td className="py-3 text-slate-500">{material.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderAdditionalPhotos = () => {
    if (totalPhotoCount === 0) return null

    const renderPreviewGroup = (title: string, type: 'before' | 'after') => {
      const items = photoBuckets[type]
      const ids = items.map(photo => photo.id).filter((id): id is string => Boolean(id))
      const groupSelected = ids.length > 0 && ids.every(id => selectedPhotoIds.has(id))

      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-foreground">{title}</div>
            {items.length > 0 && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={groupSelected}
                  onChange={() => toggleGroupSelection(type)}
                />
                선택
              </label>
            )}
          </div>
          {items.length === 0 ? (
            <div className="flex h-24 items-center justify-center rounded border border-dashed text-sm text-muted-foreground">
              사진 없음
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {items.map((photo, index) => {
                const key = photo.id || `${type}-${photo.filename}-${index}`
                const isSelected = photo.id ? selectedPhotoIds.has(photo.id) : false
                const draggableEnabled = !reorderDisabled && items.length > 1 && Boolean(photo.id)

                return (
                  <div
                    key={key}
                    className="relative overflow-hidden rounded-lg border bg-card shadow-sm"
                    draggable={draggableEnabled || undefined}
                    onDragStart={handleDragStart(type, index)}
                    onDragOver={handleDragOver(type, index)}
                    onDrop={handleDrop(type, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-full bg-background/80 px-2 py-1 text-xs text-muted-foreground shadow">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={isSelected}
                        disabled={!photo.id}
                        onChange={event => {
                          event.stopPropagation()
                          togglePhotoSelection(photo.id)
                        }}
                        onClick={event => event.stopPropagation()}
                      />
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <div
                      className="relative h-48 w-full bg-muted cursor-zoom-in hover:opacity-90 transition-opacity"
                      onClick={() => photo.url && setPreviewImage(photo.url)}
                    >
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
                      <div className="text-xs">
                        업로더: {photo.uploaded_by_name || '알 수 없음'}
                      </div>
                      {photo.description && (
                        <div className="text-sm leading-relaxed text-foreground">
                          {photo.description}
                        </div>
                      )}
                      <div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenFile(photo)}
                          disabled={!hasFileReference(photo)}
                        >
                          원본 보기
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    const renderListGroup = (title: string, type: 'before' | 'after') => {
      const items = photoBuckets[type]
      const ids = items.map(photo => photo.id).filter((id): id is string => Boolean(id))
      const groupSelected = ids.length > 0 && ids.every(id => selectedPhotoIds.has(id))

      return (
        <div className="rounded-lg border bg-muted/20">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <div className="text-sm font-semibold text-foreground">{title}</div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Badge variant="secondary">{items.length}장</Badge>
              {items.length > 0 && (
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={groupSelected}
                    onChange={() => toggleGroupSelection(type)}
                  />
                  선택
                </label>
              )}
            </div>
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
                    <th className="px-3 py-2 font-medium">선택</th>
                    <th className="px-3 py-2 font-medium">순서</th>
                    <th className="px-3 py-2 font-medium">미리보기</th>
                    <th className="px-3 py-2 font-medium">파일명</th>
                    <th className="px-3 py-2 font-medium">업로드일</th>
                    <th className="px-3 py-2 font-medium">업로더</th>
                    <th className="px-3 py-2 font-medium">메모</th>
                    <th className="px-3 py-2 font-medium">원본</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((photo, index) => {
                    const key = photo.id || `${type}-${photo.filename}-${index}`
                    const isSelected = photo.id ? selectedPhotoIds.has(photo.id) : false
                    const draggableEnabled =
                      !reorderDisabled && items.length > 1 && Boolean(photo.id)

                    return (
                      <tr
                        key={key}
                        className="bg-background/70"
                        draggable={draggableEnabled || undefined}
                        onDragStart={handleDragStart(type, index)}
                        onDragOver={handleDragOver(type, index)}
                        onDrop={handleDrop(type, index)}
                        onDragEnd={handleDragEnd}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={isSelected}
                            disabled={!photo.id}
                            onChange={event => {
                              event.stopPropagation()
                              togglePhotoSelection(photo.id)
                            }}
                            onClick={event => event.stopPropagation()}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </td>
                        <td className="px-3 py-2">
                          <div
                            className="relative h-14 w-20 overflow-hidden rounded border bg-muted cursor-zoom-in hover:opacity-90 transition-opacity"
                            onClick={() => photo.url && setPreviewImage(photo.url)}
                          >
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
                            onClick={() => handleOpenFile(photo)}
                            disabled={!hasFileReference(photo)}
                          >
                            보기
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )
    }

    return (
      <Card className="border shadow-sm">
        <CardHeader className="px-4 py-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">업로드 된 사진</CardTitle>
              <CardDescription>작업 전/후 사진</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">전체 {totalPhotoCount}장</Badge>
              <Badge variant="outline">보수 전 {photoBuckets.before.length}장</Badge>
              <Badge variant="outline">보수 후 {photoBuckets.after.length}장</Badge>
              {selectedCount > 0 && <Badge variant="secondary">선택 {selectedCount}장</Badge>}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={toggleAllSelection}
                disabled={totalPhotoCount === 0}
              >
                전체 선택
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedPhotoIds(new Set())}
                disabled={selectedCount === 0}
              >
                선택 해제
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={selectedCount === 0 || photoActionLoading}
              >
                {photoActionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                선택 삭제
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-slate-300 text-[#1A254F]"
                onClick={handleBulkDownload}
                disabled={selectedCount === 0}
              >
                <Download className="h-4 w-4" />
                선택 다운로드
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
              {renderPreviewGroup('보수 전', 'before')}
              {renderPreviewGroup('보수 후', 'after')}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {renderListGroup('보수 전', 'before')}
              {renderListGroup('보수 후', 'after')}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

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

  if (!mounted || (!report && loading)) {
    return <div className="text-sm text-muted-foreground p-8">작업일지를 불러오는 중입니다...</div>
  }

  if (!report) {
    return (
      <div className="text-sm text-destructive">{error || '작업일지를 불러올 수 없습니다.'}</div>
    )
  }

  const additionalPhotosSection = renderAdditionalPhotos()
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

  function renderAttachmentsCard(extraClass?: string) {
    return (
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
                      className="max-w-[340px] truncate font-medium text-foreground"
                      title={item.name}
                    >
                      {item.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.uploadedAt ? formatDate(item.uploadedAt) : '업로드 정보 없음'}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenFile(item)}
                    disabled={!hasFileReference(item)}
                  >
                    보기
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border shadow-sm">
        <CardHeader className="space-y-2 px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <span>{report.siteName || siteName || '-'}</span>
                <Badge
                  variant="outline"
                  className="px-2 py-0.5 text-[11px] font-bold whitespace-nowrap"
                >
                  {renderStatus(report.status || status)}
                </Badge>
              </CardTitle>
              <CardDescription>{formatDate(report.workDate || workDate)}</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {report?.status === 'rejected' && report?.rejectionReason && (
                <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-1 text-xs text-rose-700">
                  반려 사유: {report.rejectionReason}
                </div>
              )}

              {report?.status === 'submitted' && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    disabled={approvalLoading || rejecting}
                    onClick={() => handleStatusChange('approve')}
                  >
                    {approvalLoading && !rejecting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    승인
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={approvalLoading}
                    onClick={() => {
                      setRejecting(!rejecting)
                      if (!rejecting) setRejectionReason('')
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    반려
                  </Button>
                </div>
              )}

              {(report?.status === 'approved' || report?.status === 'rejected') && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={approvalLoading}
                  onClick={() => handleStatusChange('revert')}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  상태 초기화
                </Button>
              )}

              {canEditReport && editHref ? (
                <Button asChild size="sm" className="bg-[#1A254F] text-white hover:bg-[#111836]">
                  <a href={editHref}>작업일지 수정</a>
                </Button>
              ) : null}
            </div>
          </div>
          {showEditGuidance && (
            <p className="text-xs text-muted-foreground">
              제출·반려 상태에서도 수정 후 다시 제출할 수 있습니다.
            </p>
          )}
        </CardHeader>
        <CardContent className="px-4 pb-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5">
            {infoChips.map(item => (
              <div
                key={item.label}
                className="flex flex-col gap-1 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2"
              >
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <span className="text-sm font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rejection UI - Inline following header */}
      {rejecting && (
        <Card className="border-rose-200 bg-rose-50 shadow-sm animate-in slide-in-from-top-2 duration-300">
          <CardHeader className="px-4 py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-rose-900">반려 사유 입력</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-rose-900 hover:bg-rose-100"
                onClick={() => {
                  setRejecting(false)
                  setRejectionReason('')
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <textarea
              className="mb-3 w-full rounded-md border-rose-200 bg-white p-3 text-sm focus:border-rose-500 focus:ring-rose-500"
              placeholder="반려 사유를 구체적으로 입력해 주세요 (예: 보수 전/후 사진 누락)"
              rows={3}
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRejecting(false)
                  setRejectionReason('')
                }}
                disabled={approvalLoading}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={!rejectionReason.trim() || approvalLoading}
                onClick={() => handleStatusChange('reject', rejectionReason)}
              >
                {approvalLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    처리 중...
                  </>
                ) : (
                  '반려 확정'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map(card => (
          <Card key={card.label} className="overflow-hidden border-none shadow-md">
            <div className="bg-gradient-to-br from-white to-slate-50 p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {card.label}
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#1A254F]">{card.value}</span>
              </div>
              <div className="mt-1 text-xs text-slate-400">{card.helper}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Sections: 1 Row, 3 Columns */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Column 1: 작업 인력 정보 */}
        <Card className="flex flex-col border shadow-sm">
          <CardHeader className="border-b bg-slate-50/50 px-5 py-4">
            <CardTitle className="text-base font-bold text-[#1A254F]">작업 인력 정보</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">{renderWorkers()}</CardContent>
        </Card>

        {/* Column 2: 자재 사용 내역 */}
        <Card className="flex flex-col border shadow-sm">
          <CardHeader className="border-b bg-slate-50/50 px-5 py-4">
            <CardTitle className="text-base font-bold text-[#1A254F]">자재 사용 내역</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">{renderMaterials()}</CardContent>
        </Card>

        {/* Column 3: 연결 된 도면 */}
        <Card className="flex flex-col border shadow-sm">
          <CardHeader className="border-b bg-slate-50/50 px-5 py-4">
            <CardTitle className="text-base font-bold text-[#1A254F]">연결 된 도면</CardTitle>
            <CardDescription className="text-[11px]">공유함/마킹 연동 도면</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            {linkedDrawings.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {linkedDrawings.map(att => {
                  const preview = att.url
                  const meta = (
                    att.metadata && typeof att.metadata === 'object' ? att.metadata : {}
                  ) as any
                  const markupHref = getMarkupLinkFromAttachment(att)
                  const snapshotPdfUrl = meta?.snapshot_pdf_url || meta?.pdf_url

                  return (
                    <div key={att.id} className="group p-4 transition-colors hover:bg-slate-50">
                      <div className="flex gap-4">
                        <div
                          className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md border bg-slate-100 shadow-sm cursor-zoom-in group-hover:border-blue-200"
                          onClick={() => preview && setPreviewImage(preview)}
                        >
                          {preview ? (
                            <Image
                              src={preview}
                              alt={att.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
                              No Preview
                            </div>
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col justify-center">
                          <div className="flex items-center justify-between gap-3">
                            <div
                              className="truncate text-sm font-bold text-slate-900"
                              title={att.name}
                            >
                              {att.name}
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              {markupHref && (
                                <Button
                                  asChild
                                  size="sm"
                                  className="h-9 bg-[#1A254F] px-4 text-xs font-bold text-white hover:bg-[#111836]"
                                >
                                  <a href={markupHref}>마킹열기</a>
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-9 gap-1.5 border-slate-300 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
                                onClick={() => handleFileDownload(att.url, att.name || 'document')}
                              >
                                <Download className="h-4 w-4" />
                                다운로드
                              </Button>
                              {snapshotPdfUrl && (
                                <Button
                                  asChild
                                  size="sm"
                                  variant="outline"
                                  className="h-9 px-3 text-xs font-semibold"
                                >
                                  <a href={snapshotPdfUrl} target="_blank" rel="noreferrer">
                                    PDF
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-xs text-slate-400">
                연결된 도면 없음
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: 추가 사진 (Full Width) */}
      <div className="w-full">{additionalPhotosSection}</div>

      {error && <div className="text-sm text-destructive">{error}</div>}
      {/* Image Lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative h-full w-full max-w-5xl">
            <Button
              variant="ghost"
              size="sm"
              className="absolute -top-10 right-0 text-white hover:bg-white/20"
              onClick={() => setPreviewImage(null)}
            >
              <X className="mr-2 h-4 w-4" />
              닫기
            </Button>
            <div className="relative h-full w-full">
              <Image src={previewImage} alt="Preview" fill className="object-contain" unoptimized />
            </div>
          </div>
        </div>
      )}
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
