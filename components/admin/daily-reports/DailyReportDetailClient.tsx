'use client'

import { useDailyReportDetail } from '@/components/daily-reports/hooks/useDailyReportDetail'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/use-toast'
import { dailyReportApi } from '@/lib/api/daily-reports'
import {
  formatDate,
  formatNumber,
  initialWorkerStats,
  mapWorkersToStats,
  WorkerStatistics,
} from '@/lib/daily-reports/formatters'
import { openFileRecordInNewTab } from '@/lib/files/preview'
import type {
  AdditionalPhotoData,
  UnifiedAttachment,
  UnifiedDailyReport,
} from '@/types/daily-reports'
import { AlertCircle } from 'lucide-react'
import { useMemo, useRef, useState, type DragEvent as ReactDragEvent } from 'react'
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

  const {
    report,
    loading,
    error,
    photoBuckets,
    selectedPhotoIds,
    photoActionLoading,
    approvalLoading,
    rejecting,
    rejectionReason,
    setRejecting,
    setRejectionReason,
    handleStatusChange,
    togglePhotoSelection,
    handleDeleteSelectedPhotos,
    setPhotoBuckets,
    setSelectedPhotoIds,
    fetchReport,
  } = useDailyReportDetail({ reportId, initialReport })

  const [photosViewMode, setPhotosViewMode] = useState<'preview' | 'list'>('preview')
  const [orderSaving, setOrderSaving] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const dragRef = useRef<{ type: 'before' | 'after'; index: number } | null>(null)

  const workerStats = useMemo<WorkerStatistics>(() => {
    // Priority: Calculate from current workers list to ensure consistency with the UI table
    if (report?.workers && report.workers.length > 0) {
      return mapWorkersToStats(report.workers)
    }

    // Fallback: Use pre-aggregated statistics if available
    if (report?.workerStatistics) {
      return {
        total_workers: report.workerStatistics.total_workers || 0,
        total_hours: report.workerStatistics.total_hours || 0,
        total_overtime: report.workerStatistics.total_overtime || 0,
        absent_workers: report.workerStatistics.absent_workers || 0,
        by_trade: report.workerStatistics.by_trade || {},
        by_skill: report.workerStatistics.by_skill || {},
      }
    }
    return initialWorkerStats
  }, [report])

  const totalPhotoCount = photoBuckets.before.length + photoBuckets.after.length
  const selectedCount = selectedPhotoIds.size
  const reorderDisabled = photoActionLoading || orderSaving

  // Photo reordering logic
  const handleReorder = async (type: 'before' | 'after', fromIndex: number, toIndex: number) => {
    if (reorderDisabled || fromIndex === toIndex) return
    const list = [...photoBuckets[type]]
    const [moved] = list.splice(fromIndex, 1)
    list.splice(toIndex, 0, moved)

    const nextList = list.map((photo, index) => ({ ...photo, upload_order: index + 1 }))
    const nextBuckets = { ...photoBuckets, [type]: nextList }

    setPhotoBuckets(nextBuckets)
    setOrderSaving(true)

    try {
      const updates = nextList.filter(p => p.id).map((p, i) => ({ id: p.id!, upload_order: i + 1 }))
      await dailyReportApi.updatePhotosOrder(reportId, updates)
      toast({ title: '순서를 변경했습니다.' })
    } catch (err: any) {
      setPhotoBuckets(photoBuckets)
      toast({ title: '순서 변경 실패', description: err.message, variant: 'destructive' })
    } finally {
      setOrderSaving(false)
    }
  }

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
      toast({ title: '다운로드 실패', variant: 'destructive' })
    }
  }

  const handleBulkDownload = async () => {
    const allPhotos = [...photoBuckets.before, ...photoBuckets.after]
    const selectedPhotos = allPhotos.filter(p => p.id && selectedPhotoIds.has(p.id))
    for (const photo of selectedPhotos) {
      if (photo.url) {
        await handleFileDownload(photo.url, photo.filename || 'photo.jpg')
        await new Promise(r => setTimeout(r, 200))
      }
    }
  }

  const handleOpenFile = async (source: UnifiedAttachment | AdditionalPhotoData) => {
    const metadata = (source as any).metadata || {}
    const record = {
      file_url: (source as any).url || metadata.url,
      storage_bucket: metadata.storage_bucket || (source as any).storage_bucket,
      storage_path: (source as any).storage_path || (source as any).path || metadata.path,
      file_name: (source as any).name || (source as AdditionalPhotoData).filename,
      title: (source as any).name || (source as AdditionalPhotoData).filename,
    }
    if (!record.file_url && !record.storage_path) return alert('파일 정보를 찾을 수 없습니다.')
    try {
      await openFileRecordInNewTab(record)
    } catch {
      alert('파일을 열 수 없습니다.')
    }
  }

  const handleDragStart = (type: 'before' | 'after', index: number) => (e: ReactDragEvent) => {
    if (reorderDisabled) return
    dragRef.current = { type, index }
    e.dataTransfer?.setData('text/plain', `${type}-${index}`)
  }

  const handleDragOver = (type: 'before' | 'after', index: number) => (e: ReactDragEvent) => {
    if (!reorderDisabled && dragRef.current?.type === type) e.preventDefault()
  }

  const handleDrop = (type: 'before' | 'after', index: number) => (e: ReactDragEvent) => {
    if (dragRef.current?.type !== type) return
    e.preventDefault()
    const fromIndex = dragRef.current.index
    dragRef.current = null
    handleReorder(type, fromIndex, index)
  }

  if (loading && !report) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <LoadingSpinner />
        <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/30 animate-pulse">
          작업일지 정보를 불러오는 중...
        </p>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-6 p-12 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
        <AlertCircle className="w-12 h-12 text-rose-500/50" />
        <div className="text-center space-y-1">
          <h2 className="text-lg font-black text-foreground tracking-tight">
            작업일지를 찾을 수 없습니다
          </h2>
          <p className="text-sm font-medium text-muted-foreground/60">
            {error || '해당 작업일지 정보를 불러올 수 없거나 존재하지 않습니다.'}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          className="h-9 rounded-md px-8 font-normal border-gray-200 shadow-sm"
        >
          뒤로 가기
        </Button>
      </div>
    )
  }

  const primaryMemberType = report.memberTypes?.[0] || '-'
  const primaryProcessType = report.workProcesses?.[0] || '-'
  const primaryWorkType = report.workTypes?.[0] || '-'
  const locationDisplay =
    [report.location?.block, report.location?.dong, report.location?.unit]
      .filter(Boolean)
      .join(' / ') || '미기입'

  const linkedDrawings = (report.attachments.drawings || []).filter(
    att => att.metadata?.markup_document_id || att.metadata?.source_id
  )

  const normalizedStatus = String(report.status || status || '').toLowerCase()
  const canEditReport =
    allowEditing && ['draft', 'submitted', 'rejected'].includes(normalizedStatus)
  const editHref = canEditReport ? `/dashboard/admin/daily-reports/${reportId}/edit` : null

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 px-4 sm:px-6">
      {/* 1. Integrated Header Section */}
      <section className="rounded-3xl border bg-white shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
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
          markupHref={`/dashboard/admin/documents/markup?site_id=${report.siteId}&report_id=${report.id}&tab=list`}
          showEditGuidance={canEditReport && normalizedStatus !== 'draft'}
        />

        {rejecting && (
          <div className="p-8 bg-rose-50/50 border-t border-rose-100 animate-in slide-in-from-top-4">
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
          </div>
        )}

        <ReportInfoGrid
          items={[
            { label: '작성자', value: report.authorName || author || '-' },
            { label: '부재명', value: primaryMemberType },
            { label: '작업공정', value: primaryProcessType },
            { label: '작업유형', value: primaryWorkType },
            { label: '블록/동/층', value: locationDisplay },
          ]}
        />
      </section>

      {/* 2. Key Stats Summary */}
      <div className="animate-in fade-in duration-700 delay-100">
        <ReportStats
          stats={[
            {
              label: '현장 총 공수 (승인)',
              value: formatNumber(workerStats.total_hours),
              helper: `투입: ${workerStats.total_workers}명`,
              color: 'primary',
            },
            {
              label: '자재 투입 항목',
              value: `${report.materials.length} 항목`,
              helper: report.materials.length > 0 ? '재고 차감됨' : '기록 없음',
              color: 'neutral',
            },
            {
              label: '증빙 자산 업로드',
              value: `${linkedDrawings.length + totalPhotoCount} 파일`,
              helper: `${linkedDrawings.length} 도면 / ${totalPhotoCount} 사진`,
              color: 'active',
            },
          ]}
        />
      </div>

      {/* 3. Detail Status Sections */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3 animate-in fade-in duration-700 delay-200">
        <WorkforceSection workers={report.workers} formatNumber={formatNumber} />
        <MaterialUsageSection materials={report.materials} formatNumber={formatNumber} />
        <LinkedDrawingSection
          linkedDrawings={linkedDrawings}
          onPreview={setPreviewImage}
          onDownload={handleFileDownload}
          getMarkupLink={att =>
            att.metadata?.markup_document_id
              ? `/dashboard/admin/tools/markup?docId=${att.metadata.markup_document_id}`
              : null
          }
        />
      </div>

      {/* 4. Photo Registry Section */}
      <section className="rounded-2xl border bg-white shadow-sm p-6 sm:p-8 animate-in fade-in duration-700 delay-300">
        <PhotoRegistrySection
          photoBuckets={photoBuckets}
          photosViewMode={photosViewMode}
          setPhotosViewMode={setPhotosViewMode}
          totalPhotoCount={totalPhotoCount}
          selectedCount={selectedCount}
          selectedPhotoIds={selectedPhotoIds}
          togglePhotoSelection={togglePhotoSelection}
          toggleGroupSelection={type => {
            const ids = photoBuckets[type].map(p => p.id).filter((id): id is string => !!id)
            const allSelected = ids.every(id => selectedPhotoIds.has(id))
            setSelectedPhotoIds(prev => {
              const next = new Set(prev)
              ids.forEach(id => (allSelected ? next.delete(id) : next.add(id)))
              return next
            })
          }}
          toggleAllSelection={() => {
            const ids = [...photoBuckets.before, ...photoBuckets.after]
              .map(p => p.id)
              .filter((id): id is string => !!id)
            const allSelected = ids.every(id => selectedPhotoIds.has(id))
            setSelectedPhotoIds(allSelected ? new Set() : new Set(ids))
          }}
          onClearSelection={() => setSelectedPhotoIds(new Set())}
          handleBulkDelete={handleDeleteSelectedPhotos}
          handleBulkDownload={handleBulkDownload}
          photoActionLoading={photoActionLoading}
          reorderDisabled={reorderDisabled}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={() => {
            dragRef.current = null
          }}
          onOpenFile={handleOpenFile}
          onPreview={setPreviewImage}
          formatDate={formatDate}
          hasFileReference={(s: any) => !!(s.url || s.storage_path || s.path || s.metadata?.url)}
        />
      </section>

      <ImageLightbox previewImage={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  )
}
