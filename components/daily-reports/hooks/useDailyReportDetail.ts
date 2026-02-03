'use client'

import { useToast } from '@/components/ui/use-toast'
import { dailyReportApi } from '@/lib/api/daily-reports'
import { integratedResponseToUnifiedReport } from '@/lib/daily-reports/unified-admin'
import type { AdditionalPhotoData, UnifiedDailyReport } from '@/types/daily-reports'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState, useTransition } from 'react'

interface UseDailyReportDetailProps {
  reportId: string
  initialReport?: UnifiedDailyReport
}

type PhotoBuckets = {
  before: AdditionalPhotoData[]
  after: AdditionalPhotoData[]
}

export const useDailyReportDetail = ({ reportId, initialReport }: UseDailyReportDetailProps) => {
  const { toast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [report, setReport] = useState<UnifiedDailyReport | null>(initialReport ?? null)
  const [loading, setLoading] = useState(!initialReport)
  const [error, setError] = useState<string | null>(null)

  // Photo management state
  const [photoBuckets, setPhotoBuckets] = useState<PhotoBuckets>(() =>
    buildPhotoBuckets(initialReport?.additionalPhotos)
  )
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set())
  const [photoActionLoading, setPhotoActionLoading] = useState(false)

  // Approval state
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    if (initialReport) {
      setReport(initialReport)
      setPhotoBuckets(buildPhotoBuckets(initialReport.additionalPhotos))
      setLoading(false)
    }
  }, [initialReport])

  const fetchReport = useCallback(async () => {
    if (initialReport) return

    setLoading(true)
    setError(null)
    try {
      const json = await dailyReportApi.getAdminIntegrated(reportId)
      const unified = integratedResponseToUnifiedReport(json)
      setReport(unified)
      setPhotoBuckets(buildPhotoBuckets(unified.additionalPhotos))
    } catch (err: any) {
      setError(err.message || '작업일지 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [reportId, initialReport])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const handleStatusChange = async (action: 'approve' | 'revert' | 'reject', reason?: string) => {
    setApprovalLoading(true)
    try {
      const data = await dailyReportApi.updateStatus(reportId, action, reason)

      toast({
        title: '상태 변경 완료',
        description: data.message || '작업일지 상태를 변경했습니다.',
      })
      setRejecting(false)
      setRejectionReason('')

      startTransition(() => {
        router.refresh()
        fetchReport()
      })
    } catch (err: any) {
      toast({
        title: '오류 발생',
        description: err.message || '상태 변경 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setApprovalLoading(false)
    }
  }

  // Photo helpers
  function buildPhotoBuckets(photos?: AdditionalPhotoData[]): PhotoBuckets {
    const list = Array.isArray(photos) ? [...photos] : []
    const normalize = (items: AdditionalPhotoData[]) =>
      items
        .sort((a, b) => (a.upload_order ?? 0) - (b.upload_order ?? 0))
        .map((photo, index) => ({ ...photo, upload_order: index + 1 }))

    return {
      before: normalize(list.filter(p => p.photo_type === 'before')),
      after: normalize(list.filter(p => p.photo_type === 'after')),
    }
  }

  const togglePhotoSelection = (id?: string | null) => {
    if (!id) return
    setSelectedPhotoIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDeleteSelectedPhotos = async () => {
    const ids = Array.from(selectedPhotoIds).filter(Boolean)
    if (ids.length === 0 || photoActionLoading) return

    setPhotoActionLoading(true)
    const failed: string[] = []

    for (const id of ids) {
      try {
        await dailyReportApi.deletePhoto(id)
      } catch (err) {
        console.error('Delete photo error:', err)
        failed.push(id)
      }
    }

    const deletedCount = ids.length - failed.length
    if (deletedCount > 0) {
      toast({
        title: '사진 삭제 완료',
        description: `${deletedCount}건의 사진을 삭제했습니다.`,
      })
      setSelectedPhotoIds(new Set())
      await fetchReport()
      router.refresh()
    }

    if (failed.length > 0) {
      toast({
        title: '일부 삭제 실패',
        description: `${failed.length}건의 사진을 삭제하지 못했습니다.`,
        variant: 'destructive',
      })
    }

    setPhotoActionLoading(false)
  }

  return {
    report,
    loading,
    error,
    isPending,
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
    setSelectedPhotoIds,
    setPhotoBuckets,
    setPhotoActionLoading,
    fetchReport,
  }
}
