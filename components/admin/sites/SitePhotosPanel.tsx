'use client'

import type { ChangeEvent, DragEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import PhotoSheetActions from '@/components/admin/documents/PhotoSheetActions'
import type { AdditionalPhotoData } from '@/types/daily-reports'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  LayoutGrid,
  List,
  RefreshCw,
  Trash2,
  UploadCloud,
  XCircle,
} from 'lucide-react'
import { useConfirm } from '@/components/ui/use-confirm'

type SitePhotosPanelProps = {
  siteId: string
}

type PhotoApiResponse = {
  items: AdditionalPhotoData[]
  counts: { before: number; after: number }
}

type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

type PhotoSheet = {
  id: string
  title: string
  rows: number
  cols: number
  orientation: 'portrait' | 'landscape'
  status?: string | null
  created_at?: string | null
}

type DailyReportOption = {
  id: string
  work_date?: string | null
  member_name?: string | null
  process_type?: string | null
}

type FilterState = {
  type: 'all' | 'before' | 'after'
  startDate?: string
  endDate?: string
  reportId?: string
  uploaderId?: string
  query?: string
}

type LocalUploadFile = {
  file: File
  previewUrl: string
}

const PAGE_SIZE = 120

export function SitePhotosPanel({ siteId }: SitePhotosPanelProps) {
  const { toast } = useToast()
  const { confirm } = useConfirm()
  const [photos, setPhotos] = useState<AdditionalPhotoData[]>([])
  const [counts, setCounts] = useState<{ before: number; after: number }>({ before: 0, after: 0 })
  const [pagination, setPagination] = useState<Pagination>({
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
  const [selectedUploader, setSelectedUploader] = useState<string>('all')
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({})
  const [uploadForm, setUploadForm] = useState<{
    reportId: string
    description: string
    beforeFiles: LocalUploadFile[]
    afterFiles: LocalUploadFile[]
  }>({
    reportId: '',
    description: '',
    beforeFiles: [],
    afterFiles: [],
  })
  const [viewMode, setViewMode] = useState<'preview' | 'list'>('preview')

  const cleanupLocalFiles = useCallback((list: LocalUploadFile[]) => {
    for (const item of list) {
      try {
        URL.revokeObjectURL(item.previewUrl)
      } catch (error) {
        console.warn('Failed to revoke preview URL', error)
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

  const latestUploadsRef = useRef(uploadForm)
  useEffect(() => {
    latestUploadsRef.current = uploadForm
  }, [uploadForm])

  useEffect(() => {
    return () => {
      cleanupLocalFiles(latestUploadsRef.current.beforeFiles)
      cleanupLocalFiles(latestUploadsRef.current.afterFiles)
    }
  }, [cleanupLocalFiles])

  const selectedPhotos = useMemo(
    () => photos.filter(photo => photo.id && selectedIds.has(photo.id)),
    [photos, selectedIds]
  )

  const beforePhotos = useMemo(
    () => photos.filter(photo => photo.photo_type === 'before'),
    [photos]
  )
  const afterPhotos = useMemo(() => photos.filter(photo => photo.photo_type === 'after'), [photos])

  const uploaderOptions = useMemo(() => {
    const entries = new Map<string, string>()
    for (const photo of photos) {
      if (photo.uploaded_by && photo.uploaded_by_name) {
        entries.set(photo.uploaded_by, photo.uploaded_by_name)
      }
    }
    return Array.from(entries.entries()).map(([id, name]) => ({ id, name }))
  }, [photos])

  const fetchPhotoSheets = useCallback(async () => {
    setPhotoSheetsLoading(true)
    try {
      const res = await fetch(`/api/photo-sheets?site_id=${encodeURIComponent(siteId)}`, {
        cache: 'no-store',
        credentials: 'include',
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json?.success && Array.isArray(json.data)) {
        setPhotoSheets(json.data as PhotoSheet[])
      } else {
        setPhotoSheets([])
      }
    } catch (err) {
      console.error('Failed to fetch photo sheets:', err)
      setPhotoSheets([])
    } finally {
      setPhotoSheetsLoading(false)
    }
  }, [siteId])

  const fetchReports = useCallback(async () => {
    setReportsLoading(true)
    try {
      const params = new URLSearchParams({
        limit: '100',
        sort: 'date',
        order: 'desc',
      })
      const res = await fetch(`/api/admin/sites/${siteId}/daily-reports?${params.toString()}`, {
        cache: 'no-store',
        credentials: 'include',
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok && Array.isArray(json?.data)) {
        const options = (json.data as any[]).map(report => ({
          id: report.id,
          work_date: report.work_date,
          member_name: report.member_name,
          process_type: report.process_type,
        }))
        setReports(options)
      } else {
        setReports([])
      }
    } catch (error) {
      console.error('Failed to fetch daily reports:', error)
      setReports([])
    } finally {
      setReportsLoading(false)
    }
  }, [siteId])

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
        if (filters.uploaderId && filters.uploaderId !== 'all') {
          params.set('uploaded_by', filters.uploaderId)
        }
        if (filters.query) params.set('q', filters.query)

        const res = await fetch(`/api/admin/sites/${siteId}/photos?${params.toString()}`, {
          cache: 'no-store',
          credentials: 'include',
        })
        const json = await res.json().catch(() => ({}))

        if (!res.ok || !json?.success) {
          throw new Error(json?.error || '사진을 불러오지 못했습니다.')
        }

        if (json?.warning) {
          toast({ title: '안내', description: json.warning, variant: 'warning' })
        }

        const payload = json.data as PhotoApiResponse
        const meta = json.pagination as Pagination | undefined
        setPhotos(Array.isArray(payload?.items) ? payload.items : [])
        setCounts(payload?.counts || { before: 0, after: 0 })
        if (meta) {
          setPagination(meta)
        } else {
          setPagination({
            page,
            limit: PAGE_SIZE,
            total: Array.isArray(payload?.items) ? payload.items.length : 0,
            totalPages: 1,
          })
        }
        setSelectedIds(new Set())
      } catch (err) {
        console.error('[SitePhotosPanel] fetchPhotos error:', err)
        let message = err instanceof Error ? err.message : '사진을 불러오지 못했습니다.'
        if (message === 'Failed to load photos' || message === 'Failed to load daily reports') {
          message = '업로드된 사진이 없습니다.'
        } else if (message.includes('사진 추가 테이블')) {
          message = '사진 저장 테이블이 준비되지 않았습니다. 관리자에게 문의하세요.'
        } else if (message.includes('daily-reports 스토리지 버킷')) {
          message = '사진 저장용 스토리지 버킷이 없습니다. 관리자에게 문의하세요.'
        }
        setError(message)
        setPhotos([])
        setCounts({ before: 0, after: 0 })
      } finally {
        setLoading(false)
      }
    },
    [filters, siteId]
  )

  useEffect(() => {
    fetchPhotos(1)
  }, [fetchPhotos])

  useEffect(() => {
    fetchPhotoSheets()
  }, [fetchPhotoSheets])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handleFilterChange = (partial: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...partial }))
  }

  const handleSearch = () => {
    fetchPhotos(1)
  }

  const handleResetFilters = () => {
    setFilters({ type: 'all' })
    setDateRange({})
    setSelectedUploader('all')
    fetchPhotos(1)
  }

  const toggleSelect = (photoId: string | undefined) => {
    if (!photoId) return
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(photoId)) next.delete(photoId)
      else next.add(photoId)
      return next
    })
  }

  const handleSelectAll = useCallback(
    (type: 'before' | 'after', checked: boolean) => {
      setSelectedIds(prev => {
        const next = new Set(prev)
        const source = type === 'before' ? beforePhotos : afterPhotos
        for (const photo of source) {
          if (!photo.id) continue
          if (checked) next.add(photo.id)
          else next.delete(photo.id)
        }
        return next
      })
    },
    [beforePhotos, afterPhotos]
  )

  const performMove = useCallback(
    async (photoIds: string[], targetType: 'before' | 'after') => {
      for (const id of photoIds) {
        try {
          const res = await fetch(`/api/admin/sites/${siteId}/photos/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ photo_type: targetType }),
          })
          const json = await res.json().catch(() => ({}))
          if (!res.ok || !json?.success) {
            throw new Error(json?.error || '오류가 발생했습니다.')
          }
        } catch (error) {
          console.error('Failed to move photo:', error)
          toast({
            title: '이동 실패',
            description: error instanceof Error ? error.message : '사진 이동에 실패했습니다.',
            variant: 'destructive',
          })
        }
      }
      await fetchPhotos(pagination.page)
      toast({
        title: '이동 완료',
        description: `선택한 사진을 ${targetType === 'before' ? '보수 전' : '보수 후'}으로 이동했습니다.`,
      })
    },
    [fetchPhotos, pagination.page, siteId, toast]
  )

  const performDelete = useCallback(
    async (photoIds: string[]) => {
      for (const id of photoIds) {
        try {
          const res = await fetch(`/api/admin/sites/${siteId}/photos/${id}`, {
            method: 'DELETE',
            credentials: 'include',
          })
          const json = await res.json().catch(() => ({}))
          if (!res.ok || !json?.success) {
            throw new Error(json?.error || '삭제에 실패했습니다.')
          }
        } catch (error) {
          console.error('Failed to delete photo:', error)
          toast({
            title: '삭제 실패',
            description: error instanceof Error ? error.message : '사진 삭제에 실패했습니다.',
            variant: 'destructive',
          })
        }
      }
      await fetchPhotos(pagination.page)
      setSelectedIds(new Set())
      toast({
        title: '삭제 완료',
        description: '선택한 사진을 삭제했습니다.',
      })
    },
    [fetchPhotos, pagination.page, siteId, toast]
  )

  const handleBulkDelete = useCallback(async () => {
    if (selectedPhotos.length === 0) return
    const ok = await confirm({
      title: '사진 삭제',
      description: '선택한 사진을 삭제할까요? 삭제 후 되돌릴 수 없습니다.',
      confirmText: '삭제',
      cancelText: '취소',
      variant: 'destructive',
    })
    if (!ok) return
    await performDelete(selectedPhotos.map(photo => photo.id!).filter(Boolean))
  }, [confirm, performDelete, selectedPhotos])

  const handleSingleDelete = useCallback(
    async (photo: AdditionalPhotoData) => {
      if (!photo.id) return
      const label = photo.filename ? `"${photo.filename}" ` : ''
      const ok = await confirm({
        title: '사진 삭제',
        description: `${label}사진을 삭제할까요? 삭제 후 되돌릴 수 없습니다.`,
        confirmText: '삭제',
        cancelText: '취소',
        variant: 'destructive',
      })
      if (!ok) return
      await performDelete([photo.id])
    },
    [confirm, performDelete]
  )

  const handleUpload = async () => {
    if (!uploadForm.reportId) {
      toast({ title: '업로드 실패', description: '작업일지를 선택하세요.', variant: 'destructive' })
      return
    }
    if (uploadForm.beforeFiles.length === 0 && uploadForm.afterFiles.length === 0) {
      toast({
        title: '업로드 실패',
        description: '업로드할 파일을 선택하세요.',
        variant: 'destructive',
      })
      return
    }

    setUploading(true)
    try {
      const uploadSets: Array<{ type: 'before' | 'after'; files: File[] }> = []
      if (uploadForm.beforeFiles.length > 0) {
        uploadSets.push({
          type: 'before',
          files: uploadForm.beforeFiles.map(item => item.file),
        })
      }
      if (uploadForm.afterFiles.length > 0) {
        uploadSets.push({
          type: 'after',
          files: uploadForm.afterFiles.map(item => item.file),
        })
      }

      let uploadedCount = 0
      for (const set of uploadSets) {
        for (const file of set.files) {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('photo_type', set.type)
          formData.append('daily_report_id', uploadForm.reportId)
          if (uploadForm.description) {
            formData.append('description', uploadForm.description)
          }
          const res = await fetch(`/api/admin/sites/${siteId}/photos`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
          })
          const json = await res.json().catch(() => ({}))
          if (!res.ok || !json?.success) {
            throw new Error(json?.error || '업로드에 실패했습니다.')
          }
          uploadedCount += 1
        }
      }
      resetUploadForm()
      setUploaderOpen(false)
      setHighlightBucket(null)
      toast({
        title: '업로드 완료',
        description:
          uploadedCount > 0
            ? `사진 ${uploadedCount}장이 업로드되었습니다.`
            : '사진을 업로드했습니다.',
      })
      await fetchPhotos(pagination.page)
    } catch (error) {
      console.error('Upload failed:', error)
      let message = '사진을 업로드하지 못했습니다.'
      if (error instanceof Error) {
        if (error.message.includes('사진 추가 테이블이 준비되지 않았습니다')) {
          message = '사진 저장 테이블이 준비되지 않았습니다. 관리자에게 문의하세요.'
        } else if (error.message.includes('does not exist')) {
          message = '사진 저장 테이블이 존재하지 않습니다. 관리자에게 문의하세요.'
        } else if (error.message.includes('daily-reports 스토리지 버킷')) {
          message = '사진 저장용 스토리지 버킷이 없습니다. 관리자에게 문의하세요.'
        } else {
          message = error.message
        }
      }
      toast({
        title: '업로드 실패',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const disableMoveToBefore =
    selectedPhotos.length === 0 || selectedPhotos.every(photo => photo.photo_type === 'before')
  const disableMoveToAfter =
    selectedPhotos.length === 0 || selectedPhotos.every(photo => photo.photo_type === 'after')

  const [highlightBucket, setHighlightBucket] = useState<'before' | 'after' | null>(null)

  const createLocalFiles = useCallback((files: File[]): LocalUploadFile[] => {
    return files.map(file => ({ file, previewUrl: URL.createObjectURL(file) }))
  }, [])

  const addFilesToBucket = useCallback(
    (bucket: 'before' | 'after', files: File[]) => {
      if (files.length === 0) return
      const localFiles = createLocalFiles(files)
      setUploadForm(prev =>
        bucket === 'before'
          ? { ...prev, beforeFiles: [...prev.beforeFiles, ...localFiles] }
          : { ...prev, afterFiles: [...prev.afterFiles, ...localFiles] }
      )
    },
    [createLocalFiles]
  )

  const openUploadDialog = useCallback(
    (bucket: 'before' | 'after', initialFiles?: File[]) => {
      setUploaderOpen(true)
      setHighlightBucket(bucket)
      if (initialFiles && initialFiles.length > 0) {
        addFilesToBucket(bucket, initialFiles)
      }
    },
    [addFilesToBucket]
  )

  const handleDrop = useCallback(
    (type: 'before' | 'after', files: File[]) => {
      const imageFiles = files.filter(file => file.type.startsWith('image/'))
      if (imageFiles.length === 0) {
        toast({
          title: '지원되지 않는 파일',
          description: '이미지 파일만 업로드할 수 있습니다.',
          variant: 'destructive',
        })
        return
      }
      setUploaderOpen(true)
      setHighlightBucket(type)
      addFilesToBucket(type, imageFiles)
    },
    [addFilesToBucket, toast]
  )

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="grid gap-3 md:grid-cols-4 md:items-end md:gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">검색</span>
              <Input
                placeholder="파일명 또는 메모 검색"
                value={filters.query || ''}
                onChange={e => handleFilterChange({ query: e.target.value })}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSearch()
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">사진 구분</span>
              <Select
                value={filters.type}
                onValueChange={value => handleFilterChange({ type: value as FilterState['type'] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="구분" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="before">보수 전</SelectItem>
                  <SelectItem value="after">보수 후</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">업로드 시작일</span>
              <Input
                type="date"
                value={dateRange.start || ''}
                onChange={e => {
                  const value = e.target.value || undefined
                  setDateRange(prev => ({ ...prev, start: value }))
                  handleFilterChange({ startDate: value })
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">업로드 종료일</span>
              <Input
                type="date"
                value={dateRange.end || ''}
                onChange={e => {
                  const value = e.target.value || undefined
                  setDateRange(prev => ({ ...prev, end: value }))
                  handleFilterChange({ endDate: value })
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">작업일지</span>
              <Select
                value={filters.reportId || 'all'}
                onValueChange={value =>
                  handleFilterChange({ reportId: value === 'all' ? undefined : value })
                }
                disabled={reportsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="작업일지 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {reports.map(report => (
                    <SelectItem key={report.id} value={report.id}>
                      {report.work_date
                        ? `${format(new Date(report.work_date), 'yyyy-MM-dd')} - ${
                            report.process_type || report.member_name || '작업일지'
                          }`
                        : report.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">업로더</span>
              <Select
                value={selectedUploader}
                onValueChange={value => {
                  setSelectedUploader(value)
                  handleFilterChange({ uploaderId: value === 'all' ? undefined : value })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="업로더 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {uploaderOptions.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleSearch} disabled={loading}>
              검색
            </Button>
            <Button variant="outline" onClick={handleResetFilters} disabled={loading}>
              초기화
            </Button>
            <Button variant="primary" className="gap-1" onClick={() => openUploadDialog('before')}>
              <UploadCloud className="h-4 w-4" />
              사진 추가
            </Button>
          </div>
        </div>
      </section>

      {uploaderOpen && (
        <section className="mt-4 rounded-lg border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">사진 업로드</h3>
              <p className="text-xs text-muted-foreground">
                작업일지를 선택한 뒤 보수 전/보수 후 영역에 이미지를 드래그하거나 파일 선택 버튼을
                사용해 업로드하세요.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setUploaderOpen(false)
                resetUploadForm()
                setHighlightBucket(null)
              }}
              disabled={uploading}
            >
              닫기
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-1">
              <span className="text-xs font-medium text-muted-foreground">작업일지</span>
              <Select
                value={uploadForm.reportId || 'none'}
                onValueChange={value =>
                  setUploadForm(prev => ({ ...prev, reportId: value === 'none' ? '' : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="작업일지를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">선택하세요</SelectItem>
                  {reports.map(report => (
                    <SelectItem key={report.id} value={report.id}>
                      {report.work_date
                        ? `${format(new Date(report.work_date), 'yyyy-MM-dd')} - ${
                            report.process_type || report.member_name || '작업일지'
                          }`
                        : report.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-1">
              <span className="text-xs font-medium text-muted-foreground">설명 (선택)</span>
              <Input
                placeholder="메모를 입력하세요"
                value={uploadForm.description}
                onChange={e => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            JPG, PNG, WEBP 형식, 파일당 최대 10MB, 보수 전/보수 후 각각 최대 30장까지 업로드할 수
            있습니다.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <UploadDropZone
              label="보수 전 사진"
              description="보수 전 사진을 드래그하거나 파일 선택 버튼을 사용해 업로드하세요."
              files={uploadForm.beforeFiles}
              onDrop={files => {
                setHighlightBucket('before')
                addFilesToBucket('before', files)
              }}
              onClear={() =>
                setUploadForm(prev => {
                  cleanupLocalFiles(prev.beforeFiles)
                  return { ...prev, beforeFiles: [] }
                })
              }
              isActive={highlightBucket === 'before'}
              onInvalidFiles={() =>
                toast({
                  title: '지원되지 않는 파일',
                  description: '이미지 파일만 업로드할 수 있습니다.',
                  variant: 'destructive',
                })
              }
              onRemove={index =>
                setUploadForm(prev => {
                  const next = [...prev.beforeFiles]
                  const [removed] = next.splice(index, 1)
                  if (removed) cleanupLocalFiles([removed])
                  return { ...prev, beforeFiles: next }
                })
              }
              onMove={(index, direction) =>
                setUploadForm(prev => {
                  const next = [...prev.beforeFiles]
                  const targetIndex = index + direction
                  if (targetIndex < 0 || targetIndex >= next.length) return prev
                  ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
                  return { ...prev, beforeFiles: next }
                })
              }
              onPreview={index => {
                const item = uploadForm.beforeFiles[index]
                if (!item) return
                setPreviewPhoto({
                  id: undefined,
                  filename: item.file.name,
                  url: item.previewUrl,
                  photo_type: 'before',
                } as AdditionalPhotoData)
              }}
            />
            <UploadDropZone
              label="보수 후 사진"
              description="보수 후 사진을 드래그하거나 파일 선택 버튼을 사용해 업로드하세요."
              files={uploadForm.afterFiles}
              onDrop={files => {
                setHighlightBucket('after')
                addFilesToBucket('after', files)
              }}
              onClear={() =>
                setUploadForm(prev => {
                  cleanupLocalFiles(prev.afterFiles)
                  return { ...prev, afterFiles: [] }
                })
              }
              isActive={highlightBucket === 'after'}
              onInvalidFiles={() =>
                toast({
                  title: '지원되지 않는 파일',
                  description: '이미지 파일만 업로드할 수 있습니다.',
                  variant: 'destructive',
                })
              }
              onRemove={index =>
                setUploadForm(prev => {
                  const next = [...prev.afterFiles]
                  const [removed] = next.splice(index, 1)
                  if (removed) cleanupLocalFiles([removed])
                  return { ...prev, afterFiles: next }
                })
              }
              onMove={(index, direction) =>
                setUploadForm(prev => {
                  const next = [...prev.afterFiles]
                  const targetIndex = index + direction
                  if (targetIndex < 0 || targetIndex >= next.length) return prev
                  ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
                  return { ...prev, afterFiles: next }
                })
              }
              onPreview={index => {
                const item = uploadForm.afterFiles[index]
                if (!item) return
                setPreviewPhoto({
                  id: undefined,
                  filename: item.file.name,
                  url: item.previewUrl,
                  photo_type: 'after',
                } as AdditionalPhotoData)
              }}
            />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setUploaderOpen(false)
                resetUploadForm()
                setHighlightBucket(null)
              }}
              disabled={uploading}
            >
              취소
            </Button>
            <Button variant="primary" onClick={handleUpload} disabled={uploading}>
              {uploading ? '업로드 중...' : '업로드'}
            </Button>
          </div>
        </section>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive bg-destructive/10 px-4 py-6 text-sm text-destructive">
          {error}
        </div>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>
                전체{' '}
                <span className="font-semibold text-foreground">
                  {pagination.total.toLocaleString()}
                </span>
                장
              </span>
              <Badge variant="outline">보수 전 {counts.before.toLocaleString()}</Badge>
              <Badge variant="outline">보수 후 {counts.after.toLocaleString()}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'preview' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('preview')}
                aria-pressed={viewMode === 'preview'}
              >
                <LayoutGrid className="mr-1 h-4 w-4" />
                미리보기
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
              >
                <List className="mr-1 h-4 w-4" />
                리스트
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchPhotos(pagination.page)}
                disabled={loading}
              >
                <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
                새로고침
              </Button>
            </div>
          </div>

          {selectedPhotos.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3">
              <div className="text-sm text-muted-foreground">
                선택된 사진{' '}
                <span className="font-semibold text-foreground">{selectedPhotos.length}</span>장
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    performMove(
                      selectedPhotos
                        .filter(photo => photo.id)
                        .map(photo => photo.id!)
                        .filter(Boolean),
                      'before'
                    )
                  }
                  disabled={disableMoveToBefore}
                >
                  보수 전으로 이동
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    performMove(
                      selectedPhotos
                        .filter(photo => photo.id)
                        .map(photo => photo.id!)
                        .filter(Boolean),
                      'after'
                    )
                  }
                  disabled={disableMoveToAfter}
                >
                  보수 후로 이동
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  삭제
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                  선택 해제
                </Button>
              </div>
            </div>
          )}

          {photos.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
              <XCircle className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">표시할 사진이 없습니다.</p>
            </div>
          ) : viewMode === 'preview' ? (
            <div className="grid gap-4 md:grid-cols-2">
              <PhotoColumn
                title="보수 전"
                count={counts.before}
                photos={beforePhotos}
                selectedIds={selectedIds}
                onSelect={toggleSelect}
                onSelectAll={checked => handleSelectAll('before', checked)}
                onCreate={() => openUploadDialog('before')}
                onDrop={files => handleDrop('before', files)}
                isActive={highlightBucket === 'before'}
                onPreview={setPreviewPhoto}
                onMove={photo => performMove([photo.id!], 'after')}
                onDelete={handleSingleDelete}
              />
              <PhotoColumn
                title="보수 후"
                count={counts.after}
                photos={afterPhotos}
                selectedIds={selectedIds}
                onSelect={toggleSelect}
                onSelectAll={checked => handleSelectAll('after', checked)}
                onCreate={() => openUploadDialog('after')}
                onDrop={files => handleDrop('after', files)}
                isActive={highlightBucket === 'after'}
                onPreview={setPreviewPhoto}
                onMove={photo => performMove([photo.id!], 'before')}
                onDelete={handleSingleDelete}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <PhotoList
                title="보수 전"
                count={counts.before}
                photos={beforePhotos}
                selectedIds={selectedIds}
                onSelect={toggleSelect}
                onSelectAll={checked => handleSelectAll('before', checked)}
                onCreate={() => openUploadDialog('before')}
                onPreview={setPreviewPhoto}
                onMove={photo => performMove([photo.id!], 'after')}
                onDelete={handleSingleDelete}
              />
              <PhotoList
                title="보수 후"
                count={counts.after}
                photos={afterPhotos}
                selectedIds={selectedIds}
                onSelect={toggleSelect}
                onSelectAll={checked => handleSelectAll('after', checked)}
                onCreate={() => openUploadDialog('after')}
                onPreview={setPreviewPhoto}
                onMove={photo => performMove([photo.id!], 'before')}
                onDelete={handleSingleDelete}
              />
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchPhotos(pagination.page - 1)}
              >
                이전
              </Button>
              <span className="text-sm text-muted-foreground">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchPhotos(pagination.page + 1)}
              >
                다음
              </Button>
            </div>
          )}
        </section>
      )}

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground">현장 사진대지</h3>
            <p className="text-xs text-muted-foreground">
              이 현장에서 생성된 사진대지 목록과 상태를 확인합니다.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`/dashboard/admin/photo-sheets?site_id=${siteId}`}>사진대지 관리로 이동</a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`/dashboard/admin/tools/photo-grid?site_id=${siteId}`}>사진대지 생성</a>
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {photoSheetsLoading ? (
            <LoadingSpinner />
          ) : photoSheets.length === 0 ? (
            <div className="py-6 text-sm text-muted-foreground">등록된 사진대지가 없습니다.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2 font-medium">제목</th>
                  <th className="px-3 py-2 font-medium">행×열</th>
                  <th className="px-3 py-2 font-medium">방향</th>
                  <th className="px-3 py-2 font-medium">상태</th>
                  <th className="px-3 py-2 font-medium">생성일</th>
                  <th className="px-3 py-2 font-medium">작업</th>
                </tr>
              </thead>
              <tbody>
                {photoSheets.map(sheet => (
                  <tr key={sheet.id} className="border-b last:border-none">
                    <td className="px-3 py-2">{sheet.title || '-'}</td>
                    <td className="px-3 py-2">
                      {sheet.rows}×{sheet.cols}
                    </td>
                    <td className="px-3 py-2">
                      {sheet.orientation === 'landscape' ? '가로' : '세로'}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={sheet.status === 'final' ? 'default' : 'outline'}>
                        {sheet.status === 'final' ? '확정' : '초안'}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      {sheet.created_at
                        ? format(new Date(sheet.created_at), 'yyyy-MM-dd HH:mm')
                        : '-'}
                    </td>
                    <td className="px-3 py-2">
                      <PhotoSheetActions id={sheet.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <Dialog open={!!previewPhoto} onOpenChange={open => !open && setPreviewPhoto(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewPhoto?.filename || '사진 미리보기'}</DialogTitle>
            <p className="text-xs text-muted-foreground">
              클릭한 사진을 크게 확인할 수 있습니다. 창을 닫으려면 바깥 영역을 클릭하세요.
            </p>
          </DialogHeader>
          {previewPhoto && (
            <div className="relative h-[60vh] w-full overflow-hidden rounded-lg bg-muted">
              <Image
                src={previewPhoto.url || previewPhoto.path || ''}
                alt={previewPhoto.filename || 'photo'}
                fill
                className="object-contain"
                sizes="100vw"
                unoptimized
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

type PhotoColumnProps = {
  title: string
  count: number
  photos: AdditionalPhotoData[]
  selectedIds: Set<string>
  onSelect: (id?: string) => void
  onSelectAll: (checked: boolean) => void
  onCreate: () => void
  onDrop: (files: File[]) => void
  isActive?: boolean
  onPreview: (photo: AdditionalPhotoData) => void
  onMove: (photo: AdditionalPhotoData) => Promise<void> | void
  onDelete: (photo: AdditionalPhotoData) => Promise<void> | void
}

function PhotoColumn({
  title,
  count,
  photos,
  selectedIds,
  onSelect,
  onSelectAll,
  onCreate,
  onDrop,
  isActive,
  onPreview,
  onMove,
  onDelete,
}: PhotoColumnProps) {
  const [isDragging, setIsDragging] = useState(false)
  const allSelected =
    photos.length > 0 && photos.every(photo => photo.id && selectedIds.has(photo.id))

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!isDragging) setIsDragging(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node)) return
    setIsDragging(false)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const files = Array.from(event.dataTransfer.files || [])
    if (files.length === 0) return
    onDrop(files)
  }

  return (
    <div
      className={cn(
        'rounded-lg border bg-muted/20 p-4 shadow-sm transition-colors',
        (isDragging || isActive) && 'border-primary bg-primary/10'
      )}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          <Badge variant="secondary">{count.toLocaleString()}장</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCreate}>
            사진 추가
          </Button>
          <input
            type="checkbox"
            className="h-4 w-4 rounded border border-input"
            checked={allSelected}
            onChange={event => onSelectAll(event.target.checked)}
          />
          <span className="text-xs text-muted-foreground">전체 선택</span>
        </div>
      </div>
      {photos.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded border border-dashed text-xs text-muted-foreground">
          {isDragging ? '여기에 파일을 놓아 업로드하세요.' : '사진이 없습니다.'}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {photos.map(photo => {
            const id = photo.id || ''
            const isSelected = id ? selectedIds.has(id) : false
            const workDate = photo.work_date ? new Date(photo.work_date) : null
            return (
              <div
                key={id}
                className="flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm"
              >
                <div className="relative h-40 w-full overflow-hidden border-b">
                  <label className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/80">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border border-input"
                      checked={isSelected}
                      onChange={() => onSelect(id)}
                    />
                  </label>
                  <Image
                    src={photo.url || photo.path || ''}
                    alt={photo.filename || 'photo'}
                    fill
                    sizes="50vw"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3 text-xs text-muted-foreground">
                  <div className="text-sm font-semibold text-foreground">{photo.filename}</div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">작업일자</span>
                    <span>{workDate ? format(workDate, 'yyyy-MM-dd') : '-'}</span>
                  </div>
                  <div>부재명: {photo.component_name || photo.metadata?.component_name || '-'}</div>
                  <div>작업공정: {photo.work_process || photo.metadata?.work_process || '-'}</div>
                  <div>업로더: {photo.uploaded_by_name || '알 수 없음'}</div>
                  {photo.description && <div>메모: {photo.description}</div>}
                  <div className="mt-auto flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => onPreview(photo)}
                    >
                      <Eye className="h-4 w-4" />
                      미리보기
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        void onMove(photo)
                      }}
                    >
                      {photo.photo_type === 'before' ? '보수 후로 이동' : '보수 전으로 이동'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        void onDelete(photo)
                      }}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      삭제
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={`/dashboard/admin/daily-reports/${photo.daily_report_id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        작업일지
                      </a>
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

type PhotoListProps = {
  title: string
  count: number
  photos: AdditionalPhotoData[]
  selectedIds: Set<string>
  onSelect: (id?: string) => void
  onSelectAll: (checked: boolean) => void
  onCreate: () => void
  onPreview: (photo: AdditionalPhotoData) => void
  onMove: (photo: AdditionalPhotoData) => Promise<void> | void
  onDelete: (photo: AdditionalPhotoData) => Promise<void> | void
}

function PhotoList({
  title,
  count,
  photos,
  selectedIds,
  onSelect,
  onSelectAll,
  onCreate,
  onPreview,
  onMove,
  onDelete,
}: PhotoListProps) {
  const allSelected =
    photos.length > 0 && photos.every(photo => photo.id && selectedIds.has(photo.id))

  return (
    <div className="rounded-lg border bg-muted/20 p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          <Badge variant="secondary">{count.toLocaleString()}장</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCreate}>
            사진 추가
          </Button>
          <input
            type="checkbox"
            className="h-4 w-4 rounded border border-input"
            checked={allSelected}
            onChange={event => onSelectAll(event.target.checked)}
          />
          <span className="text-xs text-muted-foreground">전체 선택</span>
        </div>
      </div>
      {photos.length === 0 ? (
        <div className="flex h-28 items-center justify-center rounded border border-dashed text-xs text-muted-foreground">
          사진이 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-muted-foreground">
            <thead>
              <tr className="bg-muted/40 text-left uppercase tracking-wide">
                <th className="px-3 py-2 font-medium">선택</th>
                <th className="px-3 py-2 font-medium">미리보기</th>
                <th className="px-3 py-2 font-medium">파일명</th>
                <th className="px-3 py-2 font-medium">작업일자</th>
                <th className="px-3 py-2 font-medium">업로더</th>
                <th className="px-3 py-2 font-medium">메모</th>
                <th className="px-3 py-2 font-medium">작업일지</th>
                <th className="px-3 py-2 font-medium">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {photos.map(photo => {
                const id = photo.id || ''
                const isSelected = id ? selectedIds.has(id) : false
                const workDate = photo.work_date ? new Date(photo.work_date) : null
                return (
                  <tr key={id} className="bg-background/60">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border border-input"
                        checked={isSelected}
                        onChange={() => onSelect(id)}
                      />
                    </td>
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
                    <td className="px-3 py-2 text-foreground">{photo.filename || '-'}</td>
                    <td className="px-3 py-2">{workDate ? format(workDate, 'yyyy-MM-dd') : '-'}</td>
                    <td className="px-3 py-2">{photo.uploaded_by_name || '알 수 없음'}</td>
                    <td className="px-3 py-2">
                      {photo.description ? (
                        <span className="line-clamp-2">{photo.description}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={`/dashboard/admin/daily-reports/${photo.daily_report_id}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          열기
                        </a>
                      </Button>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => onPreview(photo)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          보기
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            void onMove(photo)
                          }}
                        >
                          {photo.photo_type === 'before' ? '보수 후로' : '보수 전으로'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            void onDelete(photo)
                          }}
                        >
                          삭제
                        </Button>
                      </div>
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

type UploadDropZoneProps = {
  label: string
  description: string
  files: LocalUploadFile[]
  onDrop: (files: File[]) => void
  onClear: () => void
  isActive?: boolean
  onInvalidFiles?: () => void
  onRemove: (index: number) => void
  onMove: (index: number, direction: -1 | 1) => void
  onPreview: (index: number) => void
}

function UploadDropZone({
  label,
  description,
  files,
  onDrop,
  onClear,
  isActive,
  onInvalidFiles,
  onRemove,
  onMove,
  onPreview,
}: UploadDropZoneProps) {
  const [dragActive, setDragActive] = useState(false)

  const processFiles = (fileList: FileList | File[]) => {
    const list = Array.from(fileList as ArrayLike<File>)
    const allowedMime = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/heic',
      'image/heif',
      'image/avif',
      'image/tiff',
      'image/bmp',
    ]
    const allowedExt = [
      '.jpg',
      '.jpeg',
      '.png',
      '.webp',
      '.gif',
      '.heic',
      '.heif',
      '.avif',
      '.tif',
      '.tiff',
      '.bmp',
    ]
    const imageFiles = list.filter(file => {
      const mime = (file.type || '').toLowerCase()
      const ext = file.name ? file.name.toLowerCase().slice(file.name.lastIndexOf('.')) : ''
      return (
        (mime && allowedMime.includes(mime)) ||
        (ext && allowedExt.includes(ext)) ||
        mime.startsWith('image/')
      )
    })
    if (imageFiles.length === 0) {
      onInvalidFiles?.()
      return
    }
    onDrop(imageFiles)
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { files: selected } = event.target
    if (selected && selected.length > 0) {
      processFiles(selected)
      event.target.value = ''
    }
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!dragActive) setDragActive(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node)) return
    setDragActive(false)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragActive(false)
    const dropped = event.dataTransfer?.files
    if (!dropped || dropped.length === 0) return
    processFiles(dropped)
  }

  return (
    <div
      className={cn(
        'rounded-lg border-2 border-dashed bg-muted/20 p-4 transition-colors',
        (dragActive || isActive) && 'border-primary bg-primary/10'
      )}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 text-center">
        <UploadCloud className="h-8 w-8 text-primary" />
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
        <span className="rounded-sm border border-dashed border-input px-3 py-1 text-xs text-primary">
          파일 선택
        </span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleInputChange}
        />
      </label>
      {files.length > 0 && (
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{files.length}개 파일 선택됨</span>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onClear}>
              비우기
            </Button>
          </div>
          <div className="space-y-2">
            {files.map((item, index) => (
              <div
                key={`${item.file.name}-${item.file.size}-${index}`}
                className="flex items-center gap-3 rounded-md border bg-background p-2"
              >
                <button
                  type="button"
                  className="relative h-16 w-16 overflow-hidden rounded border"
                  onClick={() => onPreview(index)}
                >
                  <Image
                    src={item.previewUrl}
                    alt={item.file.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                    unoptimized
                  />
                </button>
                <div className="flex-1 overflow-hidden text-left text-xs text-muted-foreground">
                  <div className="truncate text-sm font-medium text-foreground">
                    {item.file.name}
                  </div>
                  <div>{Math.round(item.file.size / 1024)} KB</div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onMove(index, -1)}
                    disabled={index === 0}
                    title="왼쪽으로 이동"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onMove(index, 1)}
                    disabled={index === files.length - 1}
                    title="오른쪽으로 이동"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onPreview(index)}
                    title="미리보기"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onRemove(index)}
                    title="삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
