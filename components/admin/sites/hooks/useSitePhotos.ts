'use client'

import { useConfirm } from '@/components/ui/use-confirm'
import { useToast } from '@/components/ui/use-toast'
import type { AdditionalPhotoData } from '@/types/daily-reports'
import { useCallback, useEffect, useMemo, useState } from 'react'

export interface FilterState {
  type: 'all' | 'before' | 'after'
  startDate?: string
  endDate?: string
  reportId?: string
  uploaderId?: string
  query?: string
}

export interface LocalUploadFile {
  file: File
  previewUrl: string
}

export interface PhotoSheet {
  id: string
  title: string
  rows: number
  cols: number
  orientation: 'portrait' | 'landscape'
  status?: string | null
  created_at?: string | null
}

export interface DailyReportOption {
  id: string
  work_date?: string | null
  member_name?: string | null
  process_type?: string | null
}

const PAGE_SIZE = 120

export function useSitePhotos(siteId: string) {
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const [photos, setPhotos] = useState<AdditionalPhotoData[]>([])
  const [counts, setCounts] = useState<{ before: number; after: number }>({ before: 0, after: 0 })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<FilterState>({ type: 'all' })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [previewPhoto, setPreviewPhoto] = useState<AdditionalPhotoData | null>(null)
  const [uploaderOpen, setUploaderOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [photoSheets, setPhotoSheets] = useState<PhotoSheet[]>([])
  const [photoSheetsLoading, setPhotoSheetsLoading] = useState(false)

  const [reports, setReports] = useState<DailyReportOption[]>([])
  const [reportsLoading, setReportsLoading] = useState(false)

  const [viewMode, setViewMode] = useState<'preview' | 'list'>('preview')
  const [highlightBucket, setHighlightBucket] = useState<'before' | 'after' | null>(null)

  const [uploadForm, setUploadForm] = useState({
    reportId: '',
    description: '',
    beforeFiles: [] as LocalUploadFile[],
    afterFiles: [] as LocalUploadFile[],
  })

  // Derived
  const selectedPhotos = useMemo(
    () => photos.filter(photo => photo.id && selectedIds.has(photo.id)),
    [photos, selectedIds]
  )

  const beforePhotos = useMemo(() => photos.filter(p => p.photo_type === 'before'), [photos])
  const afterPhotos = useMemo(() => photos.filter(p => p.photo_type === 'after'), [photos])

  const uploaderOptions = useMemo(() => {
    const entries = new Map<string, string>()
    for (const photo of photos) {
      if (photo.uploaded_by && photo.uploaded_by_name) {
        entries.set(photo.uploaded_by, photo.uploaded_by_name)
      }
    }
    return Array.from(entries.entries()).map(([id, name]) => ({ id, name }))
  }, [photos])

  // Helpers
  const cleanupLocalFiles = useCallback((list: LocalUploadFile[]) => {
    for (const item of list) {
      try {
        URL.revokeObjectURL(item.previewUrl)
      } catch (e) {
        console.warn(e)
      }
    }
  }, [])

  const resetUploadForm = useCallback(() => {
    setUploadForm(prev => {
      cleanupLocalFiles(prev.beforeFiles)
      cleanupLocalFiles(prev.afterFiles)
      return { reportId: '', description: '', beforeFiles: [], afterFiles: [] }
    })
  }, [cleanupLocalFiles])

  // Fetching logic
  const fetchPhotos = useCallback(
    async (page = 1) => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          page: String(page),
        })
        if (filters.type !== 'all') params.set('type', filters.type)
        if (filters.startDate) params.set('start_date', filters.startDate)
        if (filters.endDate) params.set('end_date', filters.endDate)
        if (filters.reportId) params.set('report_id', filters.reportId)
        if (filters.uploaderId && filters.uploaderId !== 'all')
          params.set('uploaded_by', filters.uploaderId)
        if (filters.query) params.set('q', filters.query)

        const res = await fetch(`/api/admin/sites/${siteId}/photos?${params.toString()}`, {
          cache: 'no-store',
        })
        const json = await res.json()

        if (!res.ok || !json?.success) throw new Error(json?.error || '사진을 불러오지 못했습니다.')

        setPhotos(Array.isArray(json.data?.items) ? json.data.items : [])
        setCounts(json.data?.counts || { before: 0, after: 0 })
        if (json.pagination) setPagination(json.pagination)
        setSelectedIds(new Set())
      } catch (err: any) {
        setError(err.message)
        setPhotos([])
      } finally {
        setLoading(false)
      }
    },
    [siteId, filters]
  )

  const fetchPhotoSheets = useCallback(async () => {
    setPhotoSheetsLoading(true)
    try {
      const res = await fetch(`/api/photo-sheets?site_id=${encodeURIComponent(siteId)}`, {
        cache: 'no-store',
      })
      const json = await res.json()
      if (res.ok && json?.success) setPhotoSheets(json.data || [])
    } finally {
      setPhotoSheetsLoading(false)
    }
  }, [siteId])

  const fetchReports = useCallback(async () => {
    setReportsLoading(true)
    try {
      const params = new URLSearchParams({ limit: '100', sort: 'date', order: 'desc' })
      const res = await fetch(`/api/admin/sites/${siteId}/daily-reports?${params.toString()}`, {
        cache: 'no-store',
      })
      const json = await res.json()
      if (res.ok && Array.isArray(json?.data)) {
        setReports(
          json.data.map((r: any) => ({
            id: r.id,
            work_date: r.work_date,
            member_name: r.member_name,
            process_type: r.process_type,
          }))
        )
      }
    } finally {
      setReportsLoading(false)
    }
  }, [siteId])

  // Lifecycle
  useEffect(() => {
    fetchPhotos(1)
  }, [fetchPhotos])
  useEffect(() => {
    fetchPhotoSheets()
    fetchReports()
  }, [fetchPhotoSheets, fetchReports])

  // Actions
  const toggleSelect = (id?: string) => {
    if (!id) return
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelectAll = (type: 'before' | 'after', checked: boolean) => {
    const list = type === 'before' ? beforePhotos : afterPhotos
    setSelectedIds(prev => {
      const next = new Set(prev)
      list.forEach(p => {
        if (!p.id) return
        if (checked) next.add(p.id)
        else next.delete(p.id)
      })
      return next
    })
  }

  const performMove = async (ids: string[], targetType: 'before' | 'after') => {
    try {
      await Promise.all(
        ids.map(id =>
          fetch(`/api/admin/sites/${siteId}/photos/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photo_type: targetType }),
          })
        )
      )
      await fetchPhotos(pagination.page)
      toast({ title: '이동 완료', description: '사진 구분 이동을 완료했습니다.' })
    } catch (e) {
      toast({ title: '이동 실패', variant: 'destructive' })
    }
  }

  const performDelete = async (ids: string[]) => {
    const ok = await confirm({
      title: '삭제 확인',
      description: `${ids.length}장의 사진을 삭제하시겠습니까?`,
      variant: 'destructive',
    })
    if (!ok) return

    try {
      await Promise.all(
        ids.map(id => fetch(`/api/admin/sites/${siteId}/photos/${id}`, { method: 'DELETE' }))
      )
      await fetchPhotos(pagination.page)
      setSelectedIds(new Set())
      toast({ title: '삭제 완료' })
    } catch (e) {
      toast({ title: '삭제 실패', variant: 'destructive' })
    }
  }

  const handleUpload = async () => {
    if (!uploadForm.reportId) return toast({ title: '작업일지 미선택', variant: 'destructive' })

    setUploading(true)
    try {
      const sets = [
        ...uploadForm.beforeFiles.map(f => ({ file: f.file, type: 'before' })),
        ...uploadForm.afterFiles.map(f => ({ file: f.file, type: 'after' })),
      ]

      for (const item of sets) {
        const formData = new FormData()
        formData.append('file', item.file)
        formData.append('photo_type', item.type)
        formData.append('daily_report_id', uploadForm.reportId)
        if (uploadForm.description) formData.append('description', uploadForm.description)

        await fetch(`/api/admin/sites/${siteId}/photos`, { method: 'POST', body: formData })
      }

      resetUploadForm()
      setUploaderOpen(false)
      await fetchPhotos(1)
      toast({ title: '업로드 및 추가 완료' })
    } catch (e) {
      toast({ title: '업로드 중 오류 발생', variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  return {
    photos,
    beforePhotos,
    afterPhotos,
    counts,
    pagination,
    loading,
    error,
    fetchPhotos,
    filters,
    setFilters,
    selectedIds,
    setSelectedIds,
    toggleSelect,
    handleSelectAll,
    selectedPhotos,
    performMove,
    performDelete,
    previewPhoto,
    setPreviewPhoto,
    uploaderOpen,
    setUploaderOpen,
    uploading,
    handleUpload,
    uploadForm,
    setUploadForm,
    resetUploadForm,
    photoSheets,
    photoSheetsLoading,
    fetchPhotoSheets,
    reports,
    reportsLoading,
    viewMode,
    setViewMode,
    highlightBucket,
    setHighlightBucket,
    uploaderOptions,
  }
}
