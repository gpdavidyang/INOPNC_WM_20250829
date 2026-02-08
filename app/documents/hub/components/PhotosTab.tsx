'use client'

import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { cn } from '@/lib/utils'
import { ArrowLeft, ArrowRight, Image as ImageIcon, Plus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { deletePhotoAction, movePhotoAction, uploadPhotoAction } from '../actions'
import { formatDateShort, PhotoGroup, PhotoItem } from '../doc-hub-data'
import { HubDocumentCard } from './HubDocumentCard'

interface PhotosTabProps {
  docs: PhotoGroup[]
  loading: boolean
  selectedIds: Set<string>
  onToggleSelection: (id: string) => void
  onRefresh: () => void
  initialSiteFilter?: string
  initialExpandedDocId?: string
  siteList?: string[]
  onSiteChange?: (site: string) => void
}

interface PhotoCardProps {
  photo: PhotoItem
  docId: string
  type: 'before' | 'after' // Reverted to 2 types
  onRefresh: () => void
  onSelect: (photo: PhotoItem) => void
}

function PhotoCard({ photo, docId, type, onRefresh, onSelect }: PhotoCardProps) {
  const handleMove = async (e: React.MouseEvent) => {
    e.stopPropagation()

    // Simple toggle between before/after
    const targetType = type === 'before' ? 'after' : 'before'
    const targetText = type === 'before' ? '시공 후' : '시공 전'

    if (!confirm(`이 사진을 [${targetText}]로 이동하시겠습니까?`)) return

    try {
      const res = await movePhotoAction(
        photo.reportId || docId,
        photo.url,
        type,
        targetType,
        photo.source,
        photo.ref
      )
      if (res.success) {
        toast.success(`사진을 ${targetText}로 이동했습니다.`)
        onRefresh()
      } else {
        toast.error('이동 실패: ' + res.error)
      }
    } catch (err) {
      toast.error('이동 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('선택한 사진을 삭제하시겠습니까?')) return

    try {
      const res = await deletePhotoAction(
        photo.reportId || docId,
        photo.url,
        type,
        photo.source,
        photo.ref
      )
      if (res.success) {
        toast.success('사진을 삭제했습니다.')
        onRefresh()
      } else {
        toast.error('삭제 실패: ' + res.error)
      }
    } catch (err) {
      toast.error('삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <div
      className="aspect-square rounded-md overflow-hidden bg-white border border-black/5 relative group cursor-pointer"
      onClick={e => {
        e.stopPropagation()
        onSelect(photo)
      }}
    >
      <img src={photo.url} alt="" className="w-full h-full object-cover" />

      {/* Move Button */}
      <button
        className="absolute top-1 right-7 bg-black/50 hover:bg-blue-500 text-white p-1 rounded-full transition-all z-10"
        onClick={handleMove}
      >
        {type === 'before' ? <ArrowRight size={12} /> : <ArrowLeft size={12} />}
      </button>

      {/* Delete Button */}
      <button
        className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full transition-all z-10"
        onClick={handleDelete}
      >
        <Trash2 size={12} />
      </button>
    </div>
  )
}

export function PhotosTab({
  docs,
  loading,
  selectedIds,
  onToggleSelection,
  onRefresh,
  initialSiteFilter,
  initialExpandedDocId,
  siteList = [],
  onSiteChange,
}: PhotosTabProps) {
  const [expandedDocIds, setExpandedDocIds] = useState<Set<string>>(
    () => new Set(initialExpandedDocId ? [initialExpandedDocId] : [])
  )

  // --- Filter State ---
  const [siteFilter, setSiteFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null)

  const initialSiteAppliedRef = useRef(false)
  const initialExpandAppliedRef = useRef(false)

  // --- Filter Logic ---
  // 1. Unique Sites - Use passed siteList or derive
  const uniqueSites =
    siteList.length > 0
      ? siteList
      : Array.from(new Set(docs.map(d => d.title)))
          .filter(Boolean)
          .sort()

  useEffect(() => {
    if (initialSiteAppliedRef.current) return
    if (!initialSiteFilter) return
    if (docs.length === 0) return
    const hasSite = docs.some(doc => doc.title === initialSiteFilter)
    setSiteFilter(hasSite ? initialSiteFilter : 'all')
    initialSiteAppliedRef.current = true
  }, [initialSiteFilter, docs])

  useEffect(() => {
    if (initialExpandAppliedRef.current) return
    if (!initialExpandedDocId) return
    if (docs.length === 0) return
    const has = docs.some(doc => doc.id === initialExpandedDocId)
    if (!has) return
    setExpandedDocIds(new Set([initialExpandedDocId]))
    initialExpandAppliedRef.current = true
  }, [initialExpandedDocId, docs])

  const filteredDocs = docs.filter(doc => {
    // Site Filter
    if (siteFilter !== 'all' && doc.title !== siteFilter) return false

    // Status Filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'submitted' && doc.status !== 'submitted') return false
      if (statusFilter === 'approved' && doc.status !== 'approved') return false
      if (statusFilter === 'rejected' && doc.status !== 'rejected') return false
      // Fallback for legacy data
      if (statusFilter === 'approved' && doc.status === 'done') return true // Map legacy done -> approved
      if (statusFilter === 'submitted' && doc.status === 'pending') return true // Map legacy pending -> submitted
    }

    // Period Filter
    if (periodFilter !== 'all') {
      const docDate = new Date(doc.date)
      const now = new Date()
      // Reset time for day diff
      const d1 = new Date(docDate.getFullYear(), docDate.getMonth(), docDate.getDate())
      const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const diffTime = Math.abs(d2.getTime() - d1.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (periodFilter === '7d' && diffDays > 7) return false
      if (periodFilter === '1m' && diffDays > 30) return false
      if (periodFilter === '1y' && diffDays > 365) return false
    }

    return true
  })

  // --- Upload Logic ---
  const [uploadTarget, setUploadTarget] = useState<{
    docId: string
    type: 'before' | 'after'
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadClick = (docId: string, type: 'before' | 'after') => {
    setUploadTarget({ docId, type })
    if (fileInputRef.current) {
      fileInputRef.current.value = '' // Reset
      fileInputRef.current.click()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !uploadTarget) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('reportId', uploadTarget.docId)
    formData.append('photoType', uploadTarget.type)
    formData.append('originalName', file.name)
    // siteId is resolved server-side from reportId

    const typeLabel = uploadTarget.type === 'before' ? '시공 전' : '시공 후'

    toast.promise(
      async () => {
        const res = await uploadPhotoAction(formData)
        if (!res.success) throw new Error(res.error)
        onRefresh?.()
      },
      {
        loading: `${typeLabel} 사진 업로드 중...`,
        success: '사진이 업로드되었습니다.',
        error: err => `업로드 실패: ${err.message}`,
      }
    )

    setUploadTarget(null)
  }

  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const newSet = new Set(expandedDocIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setExpandedDocIds(newSet)
  }

  const renderPhotoBadge = (photo: PhotoItem) => {
    if (!photo.type) return null

    const colorMap: Record<string, string> = {
      before: 'bg-slate-800',
      after: 'bg-sky-500',
      ref: 'bg-emerald-500',
      ing: 'bg-blue-500',
    }

    const labelMap: Record<string, string> = {
      before: '시공전',
      after: '시공후',
      ref: '참고도면',
      ing: '시공중',
    }

    return (
      <span
        className={cn(
          'absolute bottom-2 left-2 text-[10px] font-bold text-white px-1.5 py-0.5 rounded shadow-sm z-10',
          colorMap[photo.type] || 'bg-slate-500'
        )}
      >
        {labelMap[photo.type] || photo.type}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-40 bg-white rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (docs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <ImageIcon size={32} className="opacity-50" />
        </div>
        <p className="font-bold">등록된 사진이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="doc-list flex flex-col gap-3 pb-24">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />

      {/* --- Filter Options (Sticky) --- */}
      <div className="sticky top-[102px] md:top-[156px] z-40 bg-[#f2f4f6] pt-0 pb-0 grid grid-cols-3 gap-1 border-b border-slate-200/50">
        {/* Site Filter */}
        <CustomSelect
          value={siteFilter}
          onValueChange={val => {
            setSiteFilter(val)
            onSiteChange?.(val)
          }}
        >
          <CustomSelectTrigger className="w-full h-10 text-[13px] font-bold text-slate-600 bg-white border-slate-200 rounded-lg px-2 shadow-none focus:ring-1 focus:ring-blue-500">
            <CustomSelectValue placeholder="전체 현장" />
          </CustomSelectTrigger>
          <CustomSelectContent>
            <CustomSelectItem value="all">전체 현장</CustomSelectItem>
            {uniqueSites.map(site => (
              <CustomSelectItem key={site} value={site}>
                {site}
              </CustomSelectItem>
            ))}
          </CustomSelectContent>
        </CustomSelect>

        {/* Period Filter */}
        <CustomSelect value={periodFilter} onValueChange={setPeriodFilter}>
          <CustomSelectTrigger className="w-full h-10 text-[13px] font-bold text-slate-600 bg-white border-slate-200 rounded-lg px-2 shadow-none focus:ring-1 focus:ring-blue-500">
            <CustomSelectValue placeholder="전체 기간" />
          </CustomSelectTrigger>
          <CustomSelectContent>
            <CustomSelectItem value="7d">최근 7일</CustomSelectItem>
            <CustomSelectItem value="1m">최근 1개월</CustomSelectItem>
            <CustomSelectItem value="1y">최근 1년</CustomSelectItem>
            <CustomSelectItem value="all">전체 기간</CustomSelectItem>
          </CustomSelectContent>
        </CustomSelect>

        {/* Status Filter */}
        <CustomSelect value={statusFilter} onValueChange={setStatusFilter}>
          <CustomSelectTrigger className="w-full h-10 text-[13px] font-bold text-slate-600 bg-white border-slate-200 rounded-lg px-2 shadow-none focus:ring-1 focus:ring-blue-500">
            <CustomSelectValue placeholder="전체 상태" />
          </CustomSelectTrigger>
          <CustomSelectContent>
            <CustomSelectItem value="all">전체 상태</CustomSelectItem>
            <CustomSelectItem value="submitted">제출</CustomSelectItem>
            <CustomSelectItem value="approved">승인</CustomSelectItem>
            <CustomSelectItem value="rejected">반려</CustomSelectItem>
          </CustomSelectContent>
        </CustomSelect>
      </div>

      {filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <ImageIcon size={32} className="opacity-50" />
          </div>
          <p className="font-bold">조건에 맞는 사진이 없습니다.</p>
        </div>
      ) : (
        filteredDocs.map(doc => {
          const isSelected = selectedIds.has(doc.id)
          const isExpanded = expandedDocIds.has(doc.id)
          const photoCount = doc.photos ? doc.photos.length : 0
          const beforeCount = doc.photos ? doc.photos.filter(p => p.type === 'before').length : 0
          const afterCount = doc.photos ? doc.photos.filter(p => p.type === 'after').length : 0
          const previewPhotos = doc.photos ? doc.photos.slice(0, 4) : []
          const descText = String(doc.desc || '').trim()

          const collapsedPreview = (
            <div className="grid grid-cols-5 gap-2">
              {previewPhotos.map(photo => (
                <div
                  key={photo.id}
                  className="aspect-square rounded-lg bg-slate-100 overflow-hidden relative border border-slate-200"
                >
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
              {photoCount > 4 && (
                <div className="aspect-square rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                  +{photoCount - 4}
                </div>
              )}
            </div>
          )

          return (
            <HubDocumentCard
              key={doc.id}
              id={doc.id}
              title={doc.title}
              date={doc.date}
              author={doc.author}
              status={doc.status}
              desc={descText}
              countLabel={`사진 ${photoCount}장`}
              count={photoCount}
              isExpanded={isExpanded}
              isSelected={isSelected}
              onToggleExpand={toggleExpand}
              collapsedContent={previewPhotos.length > 0 ? collapsedPreview : null}
            >
              <div className="cursor-default" onClick={e => e.stopPropagation()}>
                {/* 1. Photo Upload Section */}
                <div className="mb-6">
                  <div className="text-[15px] font-medium text-[#1f2942] mb-2">사진 업로드</div>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Before Upload Box */}
                    <div
                      className="bg-white border border-dashed border-slate-200 rounded-lg p-4 h-[100px] flex flex-col items-center justify-center gap-3 cursor-pointer active:bg-slate-50 transition-colors"
                      onClick={() => handleUploadClick(doc.id, 'before')}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-[15px] font-bold text-[#1f2942]">
                          시공 전 ({beforeCount})
                        </span>
                        <span className="text-[15px] font-medium text-slate-500">
                          {beforeCount}/30장
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <Plus size={16} className="text-slate-500" />
                      </div>
                    </div>

                    {/* After Upload Box */}
                    <div
                      className="bg-white border border-dashed border-slate-200 rounded-lg p-4 h-[100px] flex flex-col items-center justify-center gap-3 cursor-pointer active:bg-slate-50 transition-colors"
                      onClick={() => handleUploadClick(doc.id, 'after')}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-[15px] font-bold text-[#1f2942]">
                          시공 후 ({afterCount})
                        </span>
                        <span className="text-[15px] font-medium text-slate-500">
                          {afterCount}/30장
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <Plus size={16} className="text-slate-500" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Uploaded Photos Section */}
                <div>
                  <div className="text-[15px] font-medium text-[#1f2942] mb-2">업로드 된 사진</div>
                  {/* Photos Grid */}
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    {/* Before Construction (시공 전) */}
                    <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[15px] font-bold text-[#1f2942]">시공 전</span>
                        <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-400">
                          {doc.photos.filter(p => p.type === 'before').length}장
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {doc.photos
                          .filter(p => p.type === 'before')
                          .map((photo, idx) => (
                            <PhotoCard
                              key={photo.id || idx}
                              photo={photo}
                              docId={doc.id}
                              type="before"
                              onRefresh={onRefresh}
                              onSelect={setSelectedPhoto}
                            />
                          ))}
                      </div>
                    </div>

                    {/* After Construction (시공 후) */}
                    <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[15px] font-bold text-[#1f2942]">시공 후</span>
                        <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-400">
                          {doc.photos.filter(p => p.type === 'after').length}장
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {doc.photos
                          .filter(p => p.type === 'after')
                          .map((photo, idx) => (
                            <PhotoCard
                              key={photo.id || idx}
                              photo={photo}
                              docId={doc.id}
                              type="after"
                              onRefresh={onRefresh}
                              onSelect={setSelectedPhoto}
                            />
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </HubDocumentCard>
          )
        })
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-200 backdrop-blur-sm"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="absolute top-0 left-0 p-4 pt-[env(safe-area-inset-top,20px)] z-[120]">
            <button
              className="text-white/90 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 active:scale-95"
              onClick={e => {
                e.stopPropagation()
                setSelectedPhoto(null)
              }}
            >
              <ArrowLeft size={28} strokeWidth={2.5} />
            </button>
          </div>

          <div
            className="relative max-w-5xl max-h-[85vh] w-full flex flex-col items-center justify-center outline-none"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={selectedPhoto.url}
              alt=""
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            {selectedPhoto.caption && (
              <div className="mt-4 text-center text-white/90 text-[15px] font-medium px-4 py-2 bg-black/50 rounded-full backdrop-blur-md">
                {selectedPhoto.caption}
              </div>
            )}
            <div className="mt-2 text-white/50 text-[13px]">
              {formatDateShort(selectedPhoto.date)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
