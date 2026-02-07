'use client'

import {
  Check,
  Download,
  FileImage,
  FileText,
  PenTool,
  Plus,
  Save,
  Search,
  Share2,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'

import { CompanyDocsTab } from './components/CompanyDocsTab'
import { DrawingsTab } from './components/DrawingsTab'
import { MyDocsTab } from './components/MyDocsTab'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchCompanyDocs,
  fetchDrawings,
  fetchMyDocs,
  fetchPhotos,
  uploadUserDocumentAction,
} from './actions'
import {
  CompanyDoc,
  DrawingWorklog,
  FILTERS,
  MyDoc,
  PhotoGroup,
  formatDateShort,
} from './doc-hub-data'
import './doc-hub.css'

// Alias for compatibility if needed
const FileImageIcon = FileImage

// Helper for class names
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ')

export default function DocumentHubPage() {
  // State
  const [activeTab, setActiveTab] = useState('my-docs')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('전체')

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedWorklogs, setExpandedWorklogs] = useState<Set<string>>(new Set())
  const [expandedPhotoGroups, setExpandedPhotoGroups] = useState<Set<string>>(new Set())

  const [isUploadSheetOpen, setIsUploadSheetOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false) // New state for upload spinner

  // New state for upload sheet
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadTypeId, setUploadTypeId] = useState<string | null>(null)
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0])
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [editingDocId, setEditingDocId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [directUploadTarget, setDirectUploadTarget] = useState<MyDoc | null>(null)

  // Data
  const [documents, setDocuments] = useState<{
    'my-docs': MyDoc[]
    'company-docs': CompanyDoc[]
    drawings: DrawingWorklog[]
    photos: PhotoGroup[]
  }>({
    'my-docs': [],
    'company-docs': [],
    drawings: [],
    photos: [],
  })

  // Fetch Data
  const loadData = async () => {
    // Only set generic loading on initial load or full refresh, not necessarily on every small update
    // But here we want to refresh everything
    try {
      const [myDocs, companyDocs, drawings, photos] = await Promise.all([
        fetchMyDocs(),
        fetchCompanyDocs(),
        fetchDrawings(),
        fetchPhotos(),
      ])

      setDocuments({
        'my-docs': myDocs,
        'company-docs': companyDocs,
        drawings: drawings,
        photos: photos,
      })
    } catch (error) {
      console.error('Failed to load document hub data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    loadData()

    const onFocus = () => {
      loadData()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  // Derived State
  const filteredDocs = useMemo(() => {
    let docs = documents[activeTab as keyof typeof documents] || []
    console.log(`filteredDocs: Tab=${activeTab}, docsCount=${docs.length}, filter=${activeFilter}`)

    // Search Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      docs = docs.filter(
        (d: any) =>
          (d.title && d.title.toLowerCase().includes(q)) ||
          (d.desc && d.desc.toLowerCase().includes(q)) ||
          (d.siteName && d.siteName.toLowerCase().includes(q)) ||
          (d.author && d.author.toLowerCase().includes(q))
      )
    }

    // Category/Status Filter (Simplified for now)
    if (activeFilter !== '전체') {
      if (activeTab === 'my-docs') {
        docs = docs.filter((d: any) => {
          const statusText =
            d.status === 'not_submitted'
              ? '미제출'
              : d.status === 'pending'
                ? '심사중'
                : d.status === 'approved'
                  ? '승인완료'
                  : d.status === 'rejected'
                    ? '반려됨'
                    : ''
          return statusText === activeFilter
        })
      } else if (activeTab === 'company-docs') {
        docs = docs.filter((d: any) => d.category === activeFilter)
      }
    }

    return docs
  }, [documents, activeTab, searchQuery, activeFilter])

  // Handlers
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setActiveFilter('전체')
    setSearchQuery('')
    setSelectedIds(new Set())
  }

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const openUploadSheet = (doc?: MyDoc) => {
    if (doc) {
      setUploadTitle(doc.title)
      setUploadTypeId(doc.typeId || null)
      setEditingDocId(doc.id)
    } else {
      setUploadTitle('')
      setUploadTypeId(null)
      setEditingDocId(null)
    }
    setUploadDate(new Date().toISOString().split('T')[0])
    setUploadFiles([])
    setShowTypeDropdown(false)
    setIsUploadSheetOpen(true)
  }

  const handleDirectUpload = (doc: MyDoc) => {
    setDirectUploadTarget(doc)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  const onNativeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !directUploadTarget) return

    const file = files[0]

    // Check if doc has a typeId (requirementId)
    if (!directUploadTarget.typeId) {
      alert('업로드할 수 없는 문서 유형입니다. (필수 서류 ID 누락)')
      return
    }

    if (!confirm(`'${directUploadTarget.title}' 서류를 제출하시겠습니까?`)) {
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('requirementId', directUploadTarget.typeId)
      // Check if it's an update to existing doc? current fetchMyDocs uses requirement_id to map

      const result = await uploadUserDocumentAction(formData)

      if (result && result.success) {
        alert('제출이 완료되었습니다.')
        await loadData() // Refresh list
      } else {
        throw new Error(result?.error || 'Unknown error')
      }
    } catch (err: any) {
      console.error('Upload failed:', err)
      alert(`업로드 실패: ${err.message}`)
    } finally {
      setIsUploading(false)
      setDirectUploadTarget(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const toggleWorklogExpand = (id: string) => {
    const newSet = new Set(expandedWorklogs)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setExpandedWorklogs(newSet)

    // Set default sub-tab
    if (!drawingTabState[id]) {
      setDrawingTabState(prev => ({ ...prev, [id]: 'list' }))
    }
  }

  const togglePhotoGroupExpand = (id: string) => {
    const newSet = new Set(expandedPhotoGroups)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setExpandedPhotoGroups(newSet)
  }

  /* RenderPhotosTab - Pixel Perfect */
  const renderPhotosTab = () => {
    if (loading) return <div className="p-8 text-center text-slate-500">로딩중...</div>
    if (filteredDocs.length === 0)
      return <div className="p-8 text-center text-slate-500">사진이 없습니다.</div>

    return (
      <div className="doc-list">
        {filteredDocs.map((doc: any) => {
          const isSelected = selectedIds.has(doc.id)
          const isExpanded = expandedPhotoGroups.has(doc.id)
          const photoCount = doc.photos ? doc.photos.length : 0
          const previewPhotos = doc.photos ? doc.photos.slice(0, 3) : []

          return (
            <div
              key={doc.id}
              className={cn('doc-card', isSelected && 'selected')}
              style={{ display: 'block', cursor: 'pointer' }}
              onClick={e => {
                if ((e.target as HTMLElement).closest('.checkbox-wrapper')) return
                togglePhotoGroupExpand(doc.id)
              }}
            >
              <div
                className="checkbox-wrapper"
                onClick={e => {
                  e.stopPropagation()
                  toggleSelection(doc.id)
                }}
              >
                <div className={cn('checkbox', isSelected && 'checked')}>
                  <Check size={14} strokeWidth={3} />
                </div>
              </div>

              <div className="mb-1.5 pr-10">
                <div className="card-title text-[18px] font-bold text-slate-900 leading-tight">
                  {doc.desc || doc.title}
                </div>
              </div>

              <div className="card-meta text-[14px] text-slate-500 flex items-center">
                <span className="font-semibold text-slate-600">{doc.author}</span>
                <span className="text-separator mx-1.5 text-slate-300">|</span>
                <span>{doc.title}</span>
                <span className="text-separator mx-1.5 text-slate-300">|</span>
                <span>{formatDateShort(doc.date)}</span>
              </div>

              <div className="mt-2 flex justify-between items-center">
                <span className="inline-block text-[12px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  사진 {photoCount}장
                </span>
              </div>

              {/* Preview or Expanded Grid */}
              <div className="mt-3">
                {!isExpanded && previewPhotos.length > 0 && (
                  <div className="flex gap-1.5 overflow-hidden">
                    {previewPhotos.map((p: any) => (
                      <div
                        key={p.id}
                        className="w-10 h-10 rounded-md bg-slate-100 overflow-hidden border border-slate-200"
                      >
                        <img src={p.url} className="w-full h-full object-cover" alt="" />
                      </div>
                    ))}
                  </div>
                )}

                {isExpanded && doc.photos && (
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                    {doc.photos.map((p: any) => (
                      <div
                        key={p.id}
                        className="aspect-square bg-slate-100 rounded-lg overflow-hidden relative border border-slate-200"
                      >
                        <img src={p.url} className="w-full h-full object-cover" alt="" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // --- Main Render ---
  return (
    <div className="doc-hub-container">
      {/* 1. Tabs */}
      <div className="doc-tabs">
        <button
          className={cn('tab-item', activeTab === 'my-docs' && 'active')}
          onClick={() => handleTabChange('my-docs')}
        >
          내문서함
        </button>
        <button
          className={cn('tab-item', activeTab === 'company-docs' && 'active')}
          onClick={() => handleTabChange('company-docs')}
        >
          회사서류
        </button>
        <button
          className={cn('tab-item', activeTab === 'drawings' && 'active')}
          onClick={() => handleTabChange('drawings')}
        >
          도면함
        </button>
        <button
          className={cn('tab-item', activeTab === 'photos' && 'active')}
          onClick={() => handleTabChange('photos')}
        >
          사진함
        </button>
      </div>

      <div className="doc-content">
        <div className="doc-sticky-header">
          {/* 2. Search Bar */}
          <div className="search-bar">
            <input
              type="text"
              className="search-input"
              placeholder="문서명 검색..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Search className="text-slate-400" size={20} />
          </div>

          {/* 3. Filter Bar */}
          {(FILTERS[activeTab as keyof typeof FILTERS] || []).length > 0 && (
            <div className="filter-bar">
              <div className="filter-scroll">
                {(FILTERS[activeTab as keyof typeof FILTERS] || []).map(f => (
                  <button
                    key={f}
                    className={cn('filter-chip', activeFilter === f && 'active')}
                    onClick={() => setActiveFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. Document Lists */}
        {activeTab === 'my-docs' && (
          <MyDocsTab
            docs={filteredDocs}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
            onRefresh={loadData}
            loading={loading}
            onDirectUpload={handleDirectUpload}
            setSelectedIds={setSelectedIds}
          />
        )}
        {activeTab === 'company-docs' && (
          <CompanyDocsTab
            docs={filteredDocs as CompanyDoc[]}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
            loading={loading}
          />
        )}
        {activeTab === 'drawings' && (
          <DrawingsTab
            docs={filteredDocs as DrawingWorklog[]}
            loading={loading}
            onRefresh={loadData}
          />
        )}
        {activeTab === 'photos' && renderPhotosTab()}
      </div>

      {/* Global Batch Bar */}
      <div className={cn('batch-bar', selectedIds.size > 0 && 'show')}>
        <button
          className="batch-action"
          onClick={() => {
            const selected = filteredDocs.filter((d: any) => selectedIds.has(d.id))
            selected.forEach((doc: any) => {
              const url = doc.url || doc.fileUrl
              if (url) {
                const a = document.createElement('a')
                a.href = url
                a.download = doc.title || 'document'
                a.target = '_blank'
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
              }
            })
          }}
        >
          <Save size={20} />
          <span>저장</span>
        </button>
        <button
          className="batch-action"
          onClick={() => {
            const selected = filteredDocs.filter((d: any) => selectedIds.has(d.id))
            selected.forEach((doc: any) => {
              const url = doc.url || doc.fileUrl
              if (url) {
                const a = document.createElement('a')
                a.href = url
                a.download = doc.title || 'document'
                a.target = '_blank'
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
              }
            })
          }}
        >
          <Download size={20} />
          <span>다운로드</span>
        </button>
        <button
          className="batch-action"
          onClick={async () => {
            const selected = filteredDocs.filter((d: any) => selectedIds.has(d.id))
            const urls = selected
              .map((d: any) => `${d.title}: ${d.url || d.fileUrl}`)
              .filter((u: any) => u.includes('http'))
              .join('\n')
            if (navigator.share) {
              await navigator.share({ title: '문서 공유', text: urls })
            } else {
              await navigator.clipboard.writeText(urls)
              alert('링크가 복사되었습니다.')
            }
          }}
        >
          <Share2 size={20} />
          <span>공유</span>
        </button>
        {activeTab === 'my-docs' && (
          <button
            className="batch-action delete"
            onClick={async () => {
              const selectedIdsArray = Array.from(selectedIds)
              const realSubmissions = selectedIdsArray.filter(id => !id.startsWith('req-'))
              if (realSubmissions.length === 0) {
                alert('제출되지 않은 문서는 삭제할 수 없습니다.')
                return
              }
              if (!confirm(`${realSubmissions.length}개 문서를 삭제하시겠습니까?`)) return
              const { deleteUserDocumentsAction } = await import('./actions')
              const result = await deleteUserDocumentsAction(realSubmissions)
              if (result.success) {
                alert(result.message || '삭제되었습니다.')
                setSelectedIds(new Set())
                loadData()
              } else {
                alert(result.error || '삭제 실패')
              }
            }}
          >
            <Trash2 size={20} />
            <span>삭제</span>
          </button>
        )}
      </div>

      {/* FAB (Floating Action Button) */}
      <div className="fab-container">
        <button className="fab-button" onClick={() => openUploadSheet()}>
          <Plus size={24} strokeWidth={3} />
        </button>
      </div>

      {/* Bottom Sheet for Upload */}
      {isUploadSheetOpen && (
        <div className="bottom-sheet-overlay" onClick={() => setIsUploadSheetOpen(false)}>
          <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle"></div>

            {activeTab === 'my-docs' ? (
              <div className="space-y-4">
                <div className="sheet-header">
                  <h3 className="sheet-title">{editingDocId ? '자료 변경' : '자료 등록'}</h3>
                  <button className="close-button" onClick={() => setIsUploadSheetOpen(false)}>
                    <X size={24} />
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label">서류명</label>
                  <div className="input-with-clear">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="서류명을 선택하거나 입력하세요"
                      value={uploadTitle}
                      onChange={e => {
                        setUploadTitle(e.target.value)
                        setShowTypeDropdown(true)
                      }}
                      onFocus={() => {
                        if (!editingDocId) setShowTypeDropdown(true)
                      }}
                      readOnly={!!editingDocId}
                    />
                    {!editingDocId && uploadTitle && (
                      <button
                        className="upload-clear-button"
                        onClick={() => {
                          setUploadTitle('')
                          setUploadTypeId(null)
                        }}
                      >
                        <X size={14} color="white" />
                      </button>
                    )}

                    {showTypeDropdown && !editingDocId && (
                      <ul className="type-dropdown-list">
                        {documents['my-docs']
                          .filter(d => d.title.toLowerCase().includes(uploadTitle.toLowerCase()))
                          .map(type => (
                            <li
                              key={type.id}
                              onClick={() => {
                                setUploadTitle(type.title)
                                setUploadTypeId(type.typeId || null)
                                setShowTypeDropdown(false)
                              }}
                            >
                              <span className="item-title font-bold block">{type.title}</span>
                              <span className="item-desc">{type.desc}</span>
                            </li>
                          ))}
                        {documents['my-docs'].filter(d =>
                          d.title.toLowerCase().includes(uploadTitle.toLowerCase())
                        ).length === 0 && (
                          <li className="text-slate-400 text-center py-4">검색 결과가 없습니다</li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">등록일</label>
                  <input
                    type="date"
                    className="form-input"
                    value={uploadDate}
                    onChange={e => setUploadDate(e.target.value)}
                  />
                </div>

                <div
                  className="upload-area"
                  onClick={() => document.getElementById('fileInput')?.click()}
                >
                  <UploadCloud size={32} className="text-slate-400" />
                  <span className="upload-label">
                    {uploadFiles.length > 0
                      ? `${uploadFiles.length}개 파일 선택됨`
                      : '파일 선택 (다중 가능)'}
                  </span>
                  <input
                    type="file"
                    id="fileInput"
                    multiple
                    className="hidden"
                    onChange={e => setUploadFiles(Array.from(e.target.files || []))}
                  />
                </div>

                <div className="sheet-actions">
                  <button className="btn-sheet-cancel" onClick={() => setIsUploadSheetOpen(false)}>
                    취소
                  </button>
                  <button
                    className="btn-sheet-submit"
                    onClick={() => {
                      alert('등록되었습니다.')
                      setIsUploadSheetOpen(false)
                    }}
                  >
                    등록하기
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <button className="upload-option-card">
                  <div className="icon-box blue">
                    <FileText size={24} />
                  </div>
                  <span className="font-bold text-slate-700">문서 업로드</span>
                </button>
                <button className="upload-option-card">
                  <div className="icon-box green">
                    <FileImageIcon size={24} />
                  </div>
                  <span className="font-bold text-slate-700">사진 등록</span>
                </button>
                <button className="upload-option-card">
                  <div className="icon-box purple">
                    <PenTool size={24} />
                  </div>
                  <span className="font-bold text-slate-700">도면 마킹</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Hidden Native File Input for Direct Upload */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple={false} // Force single file for now as action handles one
        onChange={onNativeFileChange}
        accept="image/*,application/pdf,.doc,.docx,.hwp"
      />

      {/* Loading Overlay */}
      {isUploading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
          <div className="bg-white px-8 py-6 rounded-xl flex flex-col items-center gap-4 shadow-xl">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-bold text-slate-800 text-lg">업로드 중...</span>
          </div>
        </div>
      )}
    </div>
  )
}
