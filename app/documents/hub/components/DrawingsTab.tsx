'use client'

import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { cn } from '@/lib/utils'
import { Check, Download, Eye, FileText, Pencil, Save, Trash2, UploadCloud } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { deleteDrawingsAction, uploadDrawingAction } from '../actions'
import { DrawingWorklog } from '../doc-hub-data'
import { HubDocumentCard } from './HubDocumentCard'

interface DrawingsTabProps {
  docs: DrawingWorklog[]
  loading: boolean
  onRefresh: () => void
  onOpenMarkup?: (
    mode: 'upload' | 'start' | 'resume',
    docId?: string,
    targetWorklogId?: string,
    directDrawing?: any
  ) => void
  onOpenViewer?: (url: string, title?: string) => void
  initialSiteFilter?: string
  initialExpandedDocId?: string
  siteList?: string[]
  onSiteChange?: (site: string) => void
}

type SubTabType = 'list' | 'upload' | 'tool'
type UploadType = 'progress' | 'blueprint' | 'completion'

export function DrawingsTab({
  docs,
  loading,
  onRefresh,
  onOpenMarkup,
  onOpenViewer,
  initialSiteFilter,
  initialExpandedDocId,
  siteList = [],
  onSiteChange,
}: DrawingsTabProps) {
  const [subTabState, setSubTabState] = useState<Record<string, SubTabType>>({})
  const [uploadTypeState, setUploadTypeState] = useState<Record<string, UploadType>>({})
  const [selectedDrawingIds, setSelectedDrawingIds] = useState<Set<string>>(new Set())
  const [expandedDocIds, setExpandedDocIds] = useState<Set<string>>(
    () => new Set(initialExpandedDocId ? [initialExpandedDocId] : [])
  )
  const [activeUploadContext, setActiveUploadContext] = useState<{
    reportId: string
    siteId: string
    docType: UploadType
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- Filter State ---
  const [siteFilter, setSiteFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all') // Default: All Time
  const [statusFilter, setStatusFilter] = useState('all') // Default: All Status

  const initialSiteAppliedRef = useRef(false)
  const initialExpandAppliedRef = useRef(false)

  // --- Filter Logic ---
  // 1. Unique Sites
  const uniqueSites =
    siteList.length > 0
      ? siteList
      : Array.from(new Set(docs.map(d => d.siteName)))
          .filter(Boolean)
          .sort()

  useEffect(() => {
    if (initialSiteAppliedRef.current) return
    if (!initialSiteFilter) return
    if (docs.length === 0) return
    const hasSite = docs.some(doc => doc.siteName === initialSiteFilter)
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

  // 2. Filtered Docs
  const filteredDocs = docs.filter(doc => {
    // Site Filter
    if (siteFilter !== 'all' && doc.siteName !== siteFilter) return false

    // Status Filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'open') {
        // 제출: open, ing, pending
        if (!['open', 'ing', 'pending'].includes(doc.status)) return false
      } else if (statusFilter === 'done') {
        // 승인: done, approved
        if (!['done', 'approved'].includes(doc.status)) return false
      } else if (statusFilter === 'rejected') {
        // 반려: rejected
        if (doc.status !== 'rejected') return false
      }
    }

    // Period Filter
    if (periodFilter !== 'all') {
      const docDate = new Date(doc.date)
      const now = new Date()
      // Create date objects for comparison (reset time part for accurate day diff)
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

  // Change sub-tab (List | Upload | Tool)
  const setSubTab = (id: string, tab: SubTabType) => {
    setSubTabState(prev => ({ ...prev, [id]: tab }))
  }

  // Change upload type (Progress | Blueprint)
  const setUploadType = (id: string, type: UploadType) => {
    setUploadTypeState(prev => ({ ...prev, [id]: type }))
  }

  // Toggle individual drawing selection
  const toggleDrawingSelection = (drawingId: string) => {
    const newSet = new Set(selectedDrawingIds)
    if (newSet.has(drawingId)) {
      newSet.delete(drawingId)
    } else {
      newSet.add(drawingId)
    }
    setSelectedDrawingIds(newSet)
  }

  // Toggle worklog expand
  const toggleDocExpand = (docId: string) => {
    const newSet = new Set(expandedDocIds)
    if (newSet.has(docId)) {
      newSet.delete(docId)
    } else {
      newSet.add(docId)
    }
    setExpandedDocIds(newSet)
  }

  // --- Multi-Selection Actions ---
  const handleBatchSave = () => {
    alert(`${selectedDrawingIds.size}건의 도면 선택이 완료되었습니다.`)
  }

  /* Batch Preview Logic */
  const handleBatchPreview = () => {
    if (selectedDrawingIds.size === 0) {
      alert('선택된 도면이 없습니다.')
      return
    }

    // Find all selected drawings
    const allDrawings = docs.flatMap(d => d.drawings || [])
    const selected = allDrawings.filter(dr => selectedDrawingIds.has(dr.id))

    if (selected.length === 0) {
      alert('선택된 도면 정보를 찾을 수 없습니다.')
      return
    }

    const firstValid = selected.find(item => item.url)
    if (firstValid) {
      if (onOpenViewer) {
        onOpenViewer(firstValid.url, firstValid.title)
      } else {
        console.warn('onOpenViewer callback is missing')
        window.open(firstValid.url, '_blank')
      }
    } else {
      alert('미리보기할 수 있는 이미지 URL이 없습니다.')
    }
  }

  const handleSingleEdit = (drawingId: string) => {
    // Find which doc this drawing belongs to
    const targetDoc = docs.find(d => d.drawings.some(dr => dr.id === drawingId))
    if (!targetDoc) return

    const drawing = targetDoc.drawings.find(dr => dr.id === drawingId)
    if (drawing) {
      // Just open the markup tool directly with this drawing
      onOpenMarkup?.('start', undefined, targetDoc.id, {
        id: drawing.id,
        title: drawing.title,
        url: drawing.originalUrl || drawing.url,
        siteId: targetDoc.siteId,
        markupData: drawing.markupData,
        markupId: drawing.markupId,
      })
    }
  }

  const handleBatchDownload = async () => {
    const selected = docs.flatMap(d => d.drawings).filter(dr => selectedDrawingIds.has(dr.id))
    for (const item of selected) {
      if (!item.url) continue
      const link = document.createElement('a')
      link.href = item.url
      link.download = item.title || 'drawing'
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleBatchDelete = async () => {
    if (!confirm(`선택한 ${selectedDrawingIds.size}건의 도면을 삭제하시겠습니까?`)) return

    const res = await deleteDrawingsAction(Array.from(selectedDrawingIds))
    if (res.success) {
      alert(res.message)
      setSelectedDrawingIds(new Set())
      onRefresh()
    } else {
      alert(`삭제 실패: ${res.error}`)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-500">로딩중...</div>
  }

  return (
    <div className="doc-list flex flex-col gap-3 px-0 pb-4">
      {/* --- Row 2: Filter Options (Sticky) --- */}
      <div className="sticky top-[102px] md:top-[156px] z-30 bg-[#f2f4f6] pt-4 pb-2 grid grid-cols-3 gap-1 -mt-4 border-b border-slate-200/50">
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
            <CustomSelectItem value="open">제출</CustomSelectItem>
            <CustomSelectItem value="done">승인</CustomSelectItem>
            <CustomSelectItem value="rejected">반려</CustomSelectItem>
          </CustomSelectContent>
        </CustomSelect>
      </div>

      {/* --- Row 3: Filtered Doc List --- */}
      {filteredDocs.length === 0 ? (
        <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
            <FileText className="text-slate-300" size={20} />
          </div>
          <span className="text-[13px]">조건에 맞는 작업일지가 없습니다.</span>
        </div>
      ) : (
        filteredDocs.map(doc => {
          const currentSubTab = subTabState[doc.id] || 'list'
          const currentUploadType = uploadTypeState[doc.id] || 'progress'
          const drawingCount = doc.drawings.length
          const isExpanded = expandedDocIds.has(doc.id)
          const descText = (doc.desc || '작업일지').replace(/^작업일지\s*-\s*/, '')

          return (
            <HubDocumentCard
              key={doc.id}
              id={doc.id}
              title={doc.siteName}
              date={doc.date}
              author={doc.author}
              status={doc.status}
              desc={descText}
              countLabel={`도면 ${drawingCount}건`}
              count={drawingCount}
              isExpanded={isExpanded}
              onToggleExpand={toggleDocExpand}
            >
              <div>
                {/* Line 4: Tabs */}
                <div className="flex items-center gap-1 mb-4 bg-slate-100 p-1 rounded-xl">
                  <button
                    className={cn(
                      'flex-1 py-2 text-[13px] font-bold rounded-lg flex items-center justify-center transition-all',
                      currentSubTab === 'list'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-500 hover:bg-slate-200/50'
                    )}
                    onClick={e => {
                      e.stopPropagation()
                      setSubTab(doc.id, 'list')
                    }}
                  >
                    목록
                  </button>
                  <button
                    className={cn(
                      'flex-1 py-2 text-[13px] font-bold rounded-lg flex items-center justify-center transition-all',
                      currentSubTab === 'upload'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-500 hover:bg-slate-200/50'
                    )}
                    onClick={e => {
                      e.stopPropagation()
                      setSubTab(doc.id, 'upload')
                    }}
                  >
                    업로드
                  </button>
                  <button
                    className={cn(
                      'flex-1 py-2 text-[13px] font-bold rounded-lg flex items-center justify-center transition-all',
                      currentSubTab === 'tool'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-500 hover:bg-slate-200/50'
                    )}
                    onClick={e => {
                      e.stopPropagation()
                      setSubTab(doc.id, 'tool')
                    }}
                  >
                    마킹도구
                  </button>
                </div>

                {/* Sub Tab Content */}
                <div className="sub-tab-content">
                  {/* 1. List Tab */}
                  {currentSubTab === 'list' && (
                    <>
                      {doc.drawings.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          등록된 도면이 없습니다.
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {doc.drawings.map(drawing => {
                            const isSelected = selectedDrawingIds.has(drawing.id)
                            return (
                              <div
                                key={drawing.id}
                                onClick={() => toggleDrawingSelection(drawing.id)}
                                className={cn(
                                  'relative flex items-center p-3 rounded-xl border-2 transition-all cursor-pointer',
                                  isSelected
                                    ? 'bg-[#f0f9ff] border-[#31a3fa] shadow-[0_4px_20px_rgba(49,163,250,0.1)]'
                                    : 'bg-white border-transparent'
                                )}
                              >
                                {/* Checkbox */}
                                <div
                                  className={cn(
                                    'w-[30px] h-[30px] rounded-full border-2 flex items-center justify-center transition-all shrink-0 mr-3',
                                    isSelected
                                      ? 'bg-[#0ea5e9] border-[#0ea5e9] shadow-[0_2px_8px_rgba(14,165,233,0.3)]'
                                      : 'bg-white border-[#cbd5e1]'
                                  )}
                                >
                                  {isSelected && (
                                    <Check size={14} className="text-white" strokeWidth={3} />
                                  )}
                                </div>

                                {/* Thumbnail */}
                                <div
                                  className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={e => {
                                    e.stopPropagation()
                                    if (drawing.url) onOpenViewer?.(drawing.url, drawing.title)
                                  }}
                                >
                                  {drawing.url ? (
                                    <img
                                      src={drawing.url}
                                      alt={drawing.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <FileText className="text-slate-300" size={20} />
                                  )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 ml-3 min-w-0 flex flex-col justify-center gap-1">
                                  <div className="text-[15px] font-bold text-slate-800 truncate leading-tight">
                                    {drawing.title}
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {drawing.type === 'blueprint' ? (
                                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 whitespace-nowrap">
                                        공도면
                                      </span>
                                    ) : drawing.type === 'completion' ? (
                                      <span className="text-[10px] font-bold text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                                        완료도면
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100 whitespace-nowrap">
                                        진행도면
                                      </span>
                                    )}
                                    <span className="text-[11px] text-slate-400 font-medium border-l pl-1.5 border-slate-200">
                                      {drawing.date}
                                    </span>
                                  </div>
                                </div>

                                {/* Right Action - Mark Button */}
                                <div className="ml-2 shrink-0">
                                  <button
                                    onClick={e => {
                                      e.stopPropagation()
                                      handleSingleEdit(drawing.id)
                                    }}
                                    className="flex items-center gap-1 h-8 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg shadow-sm transition-all active:scale-95"
                                  >
                                    <Pencil size={13} strokeWidth={2.5} />
                                    <span className="text-[12px] font-bold tracking-tight">
                                      도면마킹하기
                                    </span>
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </>
                  )}

                  {/* 2. Upload Tab */}
                  {currentSubTab === 'upload' && (
                    <div className="flex flex-col gap-4">
                      {/* Upload Type Switcher */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1 rounded-xl">
                        <button
                          className={cn(
                            'py-2 text-[13px] font-bold rounded-lg transition-all border border-blue-200',
                            currentUploadType === 'blueprint'
                              ? 'bg-slate-100 text-blue-900 shadow-sm'
                              : 'bg-white text-slate-400 hover:bg-slate-50'
                          )}
                          onClick={e => {
                            e.stopPropagation()
                            setUploadType(doc.id, 'blueprint')
                          }}
                        >
                          공도면
                        </button>
                        <button
                          className={cn(
                            'py-2 text-[13px] font-bold rounded-lg transition-all border border-blue-200',
                            currentUploadType === 'progress'
                              ? 'bg-slate-100 text-blue-900 shadow-sm'
                              : 'bg-white text-slate-400 hover:bg-slate-50'
                          )}
                          onClick={e => {
                            e.stopPropagation()
                            setUploadType(doc.id, 'progress')
                          }}
                        >
                          진행도면
                        </button>
                        <button
                          className={cn(
                            'py-2 text-[13px] font-bold rounded-lg transition-all border border-blue-200',
                            currentUploadType === 'completion'
                              ? 'bg-slate-100 text-blue-900 shadow-sm'
                              : 'bg-white text-slate-400 hover:bg-slate-50'
                          )}
                          onClick={e => {
                            e.stopPropagation()
                            setUploadType(doc.id, 'completion')
                          }}
                        >
                          완료도면
                        </button>
                      </div>

                      <div
                        onClick={() => {
                          setActiveUploadContext({
                            reportId: doc.id,
                            siteId: doc.siteId,
                            docType: currentUploadType,
                          })
                          fileInputRef.current?.click()
                        }}
                        className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors group"
                      >
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                          <UploadCloud className="text-slate-400" size={24} />
                        </div>
                        <span className="text-slate-600 font-bold text-[15px]">
                          파일 선택 (다중 가능)
                        </span>
                        <span className="text-slate-400 text-xs mt-1">이미지, PDF 파일 지원</span>
                      </div>
                    </div>
                  )}

                  {/* 3. Tool Tab */}
                  {currentSubTab === 'tool' && (
                    <div className="flex flex-col">
                      <div className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-100">
                        <h4 className="text-[15px] font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                          <span>📏</span> 마킹할 도면 불러오기
                        </h4>
                        <p className="text-[13px] text-slate-600 leading-snug break-keep mb-3">
                          로컬 이미지 파일을 선택하여 마킹 작업을 시작합니다.
                        </p>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={e => {
                              const file = e.target.files?.[0]
                              if (file) {
                                const url = URL.createObjectURL(file)
                                onOpenMarkup?.('start', undefined, doc.id, {
                                  id: `temp-${Date.now()}`,
                                  title: file.name,
                                  url,
                                  file,
                                  siteId: doc.siteId,
                                })
                                // Reset input value to allow selecting same file again
                                e.target.value = ''
                              }
                            }}
                          />
                          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm active:scale-[0.98]">
                            마킹할 도면 불러오기
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </HubDocumentCard>
          )
        })
      )}

      {/* --- Batch Action Bar --- */}
      <div className={cn('batch-bar no-fab', selectedDrawingIds.size > 0 && 'show')}>
        <button className="batch-action" onClick={handleBatchSave}>
          <Save size={24} className="icon-2xl" />
          <span className="text-[14px] font-[800] whitespace-nowrap">저장</span>
        </button>
        <button className="batch-action" onClick={handleBatchPreview}>
          <Eye size={24} className="icon-2xl" />
          <span className="text-[14px] font-[800] whitespace-nowrap">미리보기</span>
        </button>
        <button className="batch-action" onClick={handleBatchDownload}>
          <Download size={24} className="icon-2xl" />
          <span className="text-[14px] font-[800] whitespace-nowrap">다운로드</span>
        </button>
        <button className="batch-action delete" onClick={handleBatchDelete}>
          <Trash2 size={24} className="icon-2xl" strokeWidth={3} />
          <span className="text-[14px] font-[800] whitespace-nowrap">삭제</span>
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        multiple
        className="hidden"
        accept="image/*,application/pdf"
        onChange={async e => {
          const files = e.target.files
          if (!files || files.length === 0 || !activeUploadContext) return

          const { reportId, siteId, docType } = activeUploadContext

          try {
            for (const file of Array.from(files)) {
              const formData = new FormData()
              formData.append('file', file)
              formData.append('reportId', reportId)
              formData.append('siteId', siteId)
              formData.append('docType', docType)
              formData.append('originalName', file.name) // Pass name explicitly as a string field

              const res = await uploadDrawingAction(formData)
              if (!res.success) {
                alert(`업로드 실패: ${res.error}`)
                return
              }
            }

            alert('업로드가 완료되었습니다.')
            onRefresh()
            setSubTab(reportId, 'list')
          } catch (err) {
            console.error(err)
            alert('업로드 중 오류가 발생했습니다.')
          } finally {
            setActiveUploadContext(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
          }
        }}
      />
    </div>
  )
}
