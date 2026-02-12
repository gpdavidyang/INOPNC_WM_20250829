'use client'

import {
  ArrowLeft,
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

import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'

import { renderMarkupSnapshotDataUrl } from '@/components/markup/utils/snapshot'
import { useUnifiedAuth } from '@/hooks/use-unified-auth'
import { toast } from 'sonner'

import { SharedMarkupEditor } from '@/components/markup/SharedMarkupEditor'
import { DrawingBrowser } from '@/modules/mobile/components/markup/DrawingBrowser'

import { CompanyDocsTab } from './components/CompanyDocsTab'
import { DrawingsTab } from './components/DrawingsTab'
import { MyDocsTab } from './components/MyDocsTab'
import { PhotosTab } from './components/PhotosTab'

import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchAllSites,
  fetchCompanyDocs,
  fetchDrawings,
  fetchMyDocs,
  fetchPhotos,
  uploadDrawingAction,
  uploadPhotoAction,
  uploadUserDocumentAction,
} from './actions'
import { CompanyDoc, DrawingWorklog, FILTERS, MyDoc, PhotoGroup } from './doc-hub-data'
import './doc-hub.css'

// Alias for compatibility if needed
const FileImageIcon = FileImage

// Helper for class names
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ')

const normalizeTabParam = (raw: string | null) => {
  const value = String(raw || '')
    .trim()
    .toLowerCase()
  if (!value) return null
  if (value === 'photos' || value === 'photo') return 'photos'
  if (value === 'drawings' || value === 'drawing') return 'drawings'
  if (value === 'company-docs' || value === 'company') return 'company-docs'
  if (value === 'my-docs' || value === 'my') return 'my-docs'
  return null
}

const normalizeDateLike = (raw: string) => {
  const value = String(raw || '').trim()
  if (!value) return ''
  const match = value.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$/)
  if (match) {
    const [, yyyy, mm, dd] = match
    return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return value
}

export default function DocumentHubPage() {
  // State
  const [activeTab, setActiveTab] = useState('my-docs')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('전체')

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedWorklogs, setExpandedWorklogs] = useState<Set<string>>(new Set())

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

  // Drawings Upload State
  const [activeWorklogId, setActiveWorklogId] = useState<string>('')
  const [uploadSiteId, setUploadSiteId] = useState<string>('')
  const [drawingUploadType, setDrawingUploadType] = useState<string>('progress')
  const [photoUploadType, setPhotoUploadType] = useState<string>('after')

  const { user, profile } = useUnifiedAuth()
  const markupObjectUrlRef = useRef<string | null>(null)

  const searchParams = useSearchParams()
  const deepLinkTab = useMemo(() => normalizeTabParam(searchParams.get('tab')), [searchParams])
  const deepLinkSiteName = useMemo(() => searchParams.get('siteName') || '', [searchParams])
  const deepLinkOpenUploadSheet = useMemo(() => {
    const raw = String(searchParams.get('openUploadSheet') || '').toLowerCase()
    const sheet = String(searchParams.get('sheet') || '').toLowerCase()
    return ['1', 'true', 'yes'].includes(raw) || sheet === 'upload'
  }, [searchParams])
  const deepLinkUploadSiteId = useMemo(() => searchParams.get('siteId') || '', [searchParams])
  const deepLinkUploadWorkDate = useMemo(
    () => searchParams.get('workDate') || searchParams.get('date') || '',
    [searchParams]
  )
  const deepLinkUploadWorklogId = useMemo(() => searchParams.get('worklogId') || '', [searchParams])
  const deepLinkExpandId = useMemo(
    () => searchParams.get('expandId') || searchParams.get('worklogId') || '',
    [searchParams]
  )

  useEffect(() => {
    if (!deepLinkTab) return
    setActiveTab(deepLinkTab)
  }, [deepLinkTab])

  const uploadSheetDeepLinkAppliedRef = useRef(false)
  const uploadWorklogDeepLinkAppliedRef = useRef(false)

  useEffect(() => {
    if (uploadSheetDeepLinkAppliedRef.current) return
    if (!deepLinkOpenUploadSheet) return

    const targetTab =
      deepLinkTab === 'drawings' || deepLinkTab === 'photos' ? deepLinkTab : 'photos'
    setActiveTab(targetTab)
    setActiveFilter('전체')
    setSearchQuery('')
    setSelectedIds(new Set())

    setUploadTitle('')
    setUploadTypeId(null)
    setEditingDocId(null)
    setActiveWorklogId('')
    setUploadSiteId('')
    if (targetTab === 'drawings') {
      setDrawingUploadType('progress')
    } else {
      setPhotoUploadType('after')
    }
    setUploadFiles([])
    setShowTypeDropdown(false)
    setIsUploadSheetOpen(true)

    if (deepLinkUploadSiteId) {
      setUploadSiteId(deepLinkUploadSiteId)
    }

    if (deepLinkUploadWorklogId) {
      setActiveWorklogId(deepLinkUploadWorklogId)
      uploadWorklogDeepLinkAppliedRef.current = true
    }

    if (deepLinkUploadWorkDate) {
      setUploadDate(deepLinkUploadWorkDate)
    }

    uploadSheetDeepLinkAppliedRef.current = true
  }, [
    deepLinkOpenUploadSheet,
    deepLinkTab,
    deepLinkUploadSiteId,
    deepLinkUploadWorkDate,
    deepLinkUploadWorklogId,
  ])

  useEffect(() => {
    if (!deepLinkOpenUploadSheet) return
    if (uploadWorklogDeepLinkAppliedRef.current) return
    if (activeWorklogId) return
    if (!deepLinkUploadSiteId || !deepLinkUploadWorkDate) return
    if (documents.drawings.length === 0) return

    const desiredDate = normalizeDateLike(deepLinkUploadWorkDate)
    const match = documents.drawings.find((doc: any) => {
      const siteId = String(doc?.siteId || '')
      const date = normalizeDateLike(String(doc?.date || ''))
      return siteId === String(deepLinkUploadSiteId) && date === desiredDate
    })
    if (!match?.id) return

    setActiveWorklogId(String(match.id))
    uploadWorklogDeepLinkAppliedRef.current = true
  }, [
    activeWorklogId,
    deepLinkOpenUploadSheet,
    deepLinkUploadSiteId,
    deepLinkUploadWorkDate,
    documents.drawings,
  ])

  const [markupEditor, setMarkupEditor] = useState<{
    open: boolean
    mode: 'upload' | 'start' | 'resume'
    docId?: string
    worklogId?: string
    siteId?: string
    showBrowser: boolean
    drawingFile: any | null
    markupDocument: any | null
  }>({
    open: false,
    mode: 'start',
    showBrowser: false,
    drawingFile: null,
    markupDocument: null,
  })

  useEffect(() => {
    if (markupEditor.open) return
    const url = markupObjectUrlRef.current
    if (url && url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url)
      } catch {
        // ignore
      }
    }
    markupObjectUrlRef.current = null
  }, [markupEditor.open])

  // In-App Viewer State
  const [drawingViewer, setDrawingViewer] = useState<{
    open: boolean
    url: string
    title: string
  }>({
    open: false,
    url: '',
    title: '',
  })

  const handleOpenViewer = (url: string, title?: string) => {
    setDrawingViewer({
      open: true,
      url,
      title: title || '도면 미리보기',
    })
  }

  const handleOpenMarkup = (
    mode: 'upload' | 'start' | 'resume',
    docId?: string,
    targetWorklogId?: string,
    directDrawing?: any
  ) => {
    let siteId: string | undefined
    if (targetWorklogId) {
      const w = documents.drawings.find(d => d.id === targetWorklogId)
      if (w) siteId = w.siteId
    }

    const baseEditorState = {
      open: true,
      mode,
      docId: directDrawing && mode === 'start' ? undefined : docId,
      worklogId: targetWorklogId || markupEditor.worklogId,
      siteId,
      showBrowser: mode === 'upload',
      drawingFile: null,
      markupDocument: null,
    }

    if (directDrawing) {
      const directUrl = typeof directDrawing.url === 'string' ? directDrawing.url : ''
      if (directUrl.startsWith('blob:')) {
        markupObjectUrlRef.current = directUrl
      }
      const drawingFile = {
        id: directDrawing.id,
        name: directDrawing.title || directDrawing.name,
        size: 0,
        type: 'image',
        url: directDrawing.url,
        file: directDrawing.file,
        siteId: directDrawing.siteId || siteId,
        uploadDate: new Date(),
      }

      const markupDocument = {
        id: directDrawing.id,
        title: directDrawing.title || directDrawing.name,
        original_blueprint_filename: directDrawing.title || directDrawing.name,
        original_blueprint_url: directDrawing.url,
        markup_data: directDrawing.markupData || [],
        markupId: directDrawing.markupId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setMarkupEditor({
        ...baseEditorState,
        drawingFile,
        markupDocument,
        showBrowser: false,
      })
    } else {
      setMarkupEditor(baseEditorState)
    }
  }

  const handleDrawingSelect = (drawing: any) => {
    const drawingFile = {
      id: drawing.id,
      name: drawing.name || drawing.title,
      size: drawing.size || 0,
      type: drawing.type || 'image',
      url: drawing.url,
      siteId: drawing.siteId,
      uploadDate: drawing.uploadDate || new Date(),
    }

    const markupDocument = {
      id: drawing.id,
      title: drawing.name || drawing.title,
      original_blueprint_filename: drawing.name || drawing.title,
      original_blueprint_url: drawing.url,
      markup_data: drawing.markupData || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setMarkupEditor(prev => ({
      ...prev,
      drawingFile,
      markupDocument,
      showBrowser: false,
    }))
  }

  const handleMarkupSave = async (doc: any) => {
    const worklogId = markupEditor.worklogId

    try {
      const publish = Boolean(doc?.published)
      const payload = {
        title: (doc?.title || markupEditor.drawingFile?.name || '무제 도면') as string,
        description: doc.description || '',
        markup_data: Array.isArray(doc.markup_data) ? doc.markup_data : [],
        preview_image_url: doc.preview_image_url || undefined,
      }

      let savedId: string | undefined

      const blueprintUrl =
        (markupEditor.drawingFile?.url as string | undefined) ||
        (doc?.original_blueprint_url as string | undefined) ||
        ''
      const previewDataUrl = await renderMarkupSnapshotDataUrl(blueprintUrl, payload.markup_data)
      if (publish && !previewDataUrl && !payload.preview_image_url) {
        throw new Error('진행도면 저장을 위한 미리보기 생성에 실패했습니다.')
      }

      const isUuid = (value?: string | null) =>
        typeof value === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

      const ensureBlueprintUpload = async () => {
        const currentUrl = blueprintUrl
        const blueprintFileName =
          (markupEditor.drawingFile?.name as string | undefined) || 'blueprint.png'
        if (!currentUrl) return { url: '', fileName: blueprintFileName }
        const isEphemeral =
          currentUrl.startsWith('blob:') ||
          currentUrl.startsWith('data:') ||
          currentUrl.startsWith('filesystem:') ||
          currentUrl.startsWith('capacitor:') ||
          currentUrl.startsWith('capacitor-file:')
        if (!isEphemeral) return { url: currentUrl, fileName: blueprintFileName }
        try {
          const sourceFile: File | null =
            markupEditor.drawingFile?.file instanceof File ? markupEditor.drawingFile.file : null
          let uploadFile: File | null = sourceFile
          let safeName = blueprintFileName

          if (!uploadFile && currentUrl.startsWith('data:')) {
            const match = /^data:([^;]+);base64,(.+)$/i.exec(currentUrl)
            if (!match) throw new Error('지원하지 않는 파일 형식입니다.')
            const [, mimeType, base64] = match
            const bin = atob(base64)
            const bytes = new Uint8Array(bin.length)
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
            const inferredType = mimeType || 'image/png'
            const ext = (safeName.split('.').pop() || '').toLowerCase()
            const hasExt = Boolean(ext && ext.length <= 5)
            safeName = hasExt
              ? safeName
              : `blueprint.${(inferredType.split('/')[1] || 'png').split(';')[0]}`
            uploadFile = new File([bytes], safeName, { type: inferredType })
          }

          if (!uploadFile) {
            throw new Error('원본 도면 업로드에 실패했습니다. 파일을 다시 선택해 주세요.')
          }

          const fd = new FormData()
          fd.append('file', uploadFile)
          const uploadRes = await fetch('/api/uploads/preview', { method: 'POST', body: fd })
          const uploadJson = await uploadRes.json().catch(() => ({}))
          if (!uploadRes.ok || !uploadJson?.url) {
            throw new Error(uploadJson?.error || '도면 업로드에 실패했습니다.')
          }
          return { url: uploadJson.url as string, fileName: safeName }
        } catch (err) {
          console.warn('Blueprint upload failed:', err)
          throw err
        }
      }

      if (!markupEditor.drawingFile) {
        throw new Error('마킹할 도면을 먼저 선택해주세요.')
      }

      const ensured = await ensureBlueprintUpload()
      const drawingId = isUuid(markupEditor.drawingFile?.id)
        ? markupEditor.drawingFile.id
        : undefined

      const siteIdForSave =
        markupEditor.siteId || (markupEditor.drawingFile?.siteId as string | undefined) || undefined
      if (!drawingId && !siteIdForSave) {
        throw new Error('현장을 먼저 선택해주세요.')
      }

      const body = {
        ...(drawingId ? { drawingId } : {}),
        siteId: siteIdForSave,
        original_blueprint_url: ensured.url || blueprintUrl || undefined,
        original_blueprint_filename:
          ensured.fileName || markupEditor.drawingFile?.name || undefined,
        title: payload.title,
        description: payload.description,
        markupData: payload.markupData || payload.markup_data,
        preview_image_url: payload.preview_image_url,
        preview_image_data: previewDataUrl,
        published: publish,
        linked_worklog_id: worklogId || undefined,
        linked_worklog_ids: worklogId ? [worklogId] : undefined,
      }

      const res = await fetch('/api/docs/drawings/markups/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok || json?.success === false) throw new Error(json?.error || '마킹 저장 실패')
      savedId = json?.data?.markup?.id

      if (worklogId && savedId) {
        const res = await fetch(`/api/markup-documents/${savedId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ linked_worklog_ids: [worklogId] }),
        })
        if (!res.ok) console.warn('작업일지 연동 실패')
      }

      toast.success(publish ? '진행도면으로 저장했습니다.' : '마킹을 저장했습니다.')

      setMarkupEditor(prev => ({ ...prev, open: false }))
      loadData()
    } catch (error) {
      console.error('Save error:', error)
      toast.error(error instanceof Error ? error.message : '저장에 실패했습니다.')
    }
  }

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
  const [allSites, setAllSites] = useState<string[]>([])

  // Fetch Data
  const loadData = async () => {
    // Only set generic loading on initial load or full refresh, not necessarily on every small update
    // But here we want to refresh everything
    try {
      const [myDocs, companyDocs, drawings, photos, sites] = await Promise.all([
        fetchMyDocs(),
        fetchCompanyDocs(),
        fetchDrawings(),
        fetchPhotos(),
        fetchAllSites(),
      ])

      setDocuments({
        'my-docs': myDocs,
        'company-docs': companyDocs,
        drawings: drawings,
        photos: photos,
      })
      setAllSites(sites)
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

    if (activeTab === 'drawings') {
      setActiveWorklogId('')
      setUploadSiteId('')
      setDrawingUploadType('progress')
    } else if (activeTab === 'photos') {
      setActiveWorklogId('')
      setUploadSiteId('')
      setPhotoUploadType('after')
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
      formData.append('originalName', file.name) // Explicitly send name for safe encoding
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
            onOpenMarkup={handleOpenMarkup}
            onOpenViewer={handleOpenViewer}
            initialSiteFilter={deepLinkSiteName || undefined}
            initialExpandedDocId={deepLinkExpandId || undefined}
            siteList={allSites}
          />
        )}
        {activeTab === 'photos' && (
          <PhotosTab
            docs={filteredDocs as PhotoGroup[]}
            loading={loading}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
            onRefresh={loadData}
            initialSiteFilter={deepLinkSiteName || undefined}
            initialExpandedDocId={deepLinkExpandId || undefined}
            siteList={allSites}
          />
        )}
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
                // Force reload data
                await loadData()
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
          <Plus size={32} strokeWidth={3} />
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
                    onClick={async () => {
                      if (!uploadTypeId) {
                        alert('서류명을 선택해주세요.')
                        return
                      }
                      if (uploadFiles.length === 0) {
                        alert('파일을 선택해주세요.')
                        return
                      }

                      setIsUploading(true)
                      try {
                        const { uploadUserDocumentAction } = await import('./actions')
                        for (const file of uploadFiles) {
                          const formData = new FormData()
                          formData.append('file', file)
                          formData.append('requirementId', uploadTypeId)
                          if (editingDocId) {
                            formData.append('documentId', editingDocId)
                          }
                          formData.append('originalName', file.name)

                          const res = await uploadUserDocumentAction(formData)
                          if (!res.success) throw new Error(res.error)
                        }
                        alert('서류가 등록되었습니다.')
                        setIsUploadSheetOpen(false)
                        setUploadFiles([])
                        setUploadTitle('')
                        setUploadTypeId(null)
                        setEditingDocId(null)
                        loadData()
                      } catch (err: any) {
                        console.error(err)
                        alert(`등록 실패: ${err.message}`)
                      } finally {
                        setIsUploading(false)
                      }
                    }}
                  >
                    등록하기
                  </button>
                </div>
              </div>
            ) : activeTab === 'drawings' ? (
              <div className="space-y-4">
                <div className="sheet-header">
                  <h3 className="sheet-title">도면 등록</h3>
                  <button className="close-button" onClick={() => setIsUploadSheetOpen(false)}>
                    <X size={24} />
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label">현장 선택</label>
                  <CustomSelect
                    value={uploadSiteId}
                    onValueChange={value => {
                      setUploadSiteId(value)
                      setActiveWorklogId('') // Reset dependent worklog
                    }}
                  >
                    <CustomSelectTrigger className="w-full h-12 text-[15px] bg-white border border-slate-200 rounded-xl px-3 focus:ring-2 focus:ring-blue-500/20">
                      <CustomSelectValue placeholder="현장을 선택하세요" />
                    </CustomSelectTrigger>
                    <CustomSelectContent>
                      {Array.from(new Set(documents.drawings.map(d => d.siteName)))
                        .sort()
                        .map(siteName => {
                          const representative = documents.drawings.find(
                            d => d.siteName === siteName
                          )
                          const siteId = representative?.siteId
                          if (!siteId) return null
                          return (
                            <CustomSelectItem key={siteId} value={siteId}>
                              {siteName}
                            </CustomSelectItem>
                          )
                        })}
                    </CustomSelectContent>
                  </CustomSelect>
                </div>

                <div className="form-group">
                  <label className="form-label">작업일지 선택</label>
                  <CustomSelect
                    value={activeWorklogId}
                    onValueChange={setActiveWorklogId}
                    disabled={!uploadSiteId}
                  >
                    <CustomSelectTrigger className="w-full h-12 text-[15px] bg-white border border-slate-200 rounded-xl px-3 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-400">
                      <CustomSelectValue
                        placeholder={
                          uploadSiteId ? '작업일지를 선택하세요' : '현장을 먼저 선택하세요'
                        }
                      />
                    </CustomSelectTrigger>
                    <CustomSelectContent>
                      {documents.drawings
                        .filter(d => d.siteId === uploadSiteId)
                        .map(doc => (
                          <CustomSelectItem key={doc.id} value={doc.id}>
                            <span className="truncate">
                              {doc.date} | {doc.desc}
                            </span>
                          </CustomSelectItem>
                        ))}
                    </CustomSelectContent>
                  </CustomSelect>
                </div>

                <div className="form-group">
                  <label className="form-label">도면 구분</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      className={cn(
                        'h-12 rounded-xl text-[14px] font-bold border transition-all',
                        drawingUploadType === 'blueprint'
                          ? 'bg-blue-50 border-blue-200 text-blue-600'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      )}
                      onClick={() => setDrawingUploadType('blueprint')}
                    >
                      공도면
                    </button>
                    <button
                      className={cn(
                        'h-12 rounded-xl text-[14px] font-bold border transition-all',
                        drawingUploadType === 'progress'
                          ? 'bg-blue-50 border-blue-200 text-blue-600'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      )}
                      onClick={() => setDrawingUploadType('progress')}
                    >
                      진행도면
                    </button>
                    <button
                      className={cn(
                        'h-12 rounded-xl text-[14px] font-bold border transition-all',
                        drawingUploadType === 'completion'
                          ? 'bg-blue-50 border-blue-200 text-blue-600'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      )}
                      onClick={() => setDrawingUploadType('completion')}
                    >
                      완료도면
                    </button>
                  </div>
                </div>

                <div
                  className="upload-area"
                  onClick={() => document.getElementById('drawingFileInput')?.click()}
                >
                  <UploadCloud size={32} className="text-slate-400" />
                  <span className="upload-label">
                    {uploadFiles.length > 0
                      ? `${uploadFiles.length}개 파일 선택됨`
                      : '파일 선택 (다중 가능)'}
                  </span>
                  <input
                    type="file"
                    id="drawingFileInput"
                    multiple
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={e => setUploadFiles(Array.from(e.target.files || []))}
                  />
                </div>

                <div className="sheet-actions">
                  <button className="btn-sheet-cancel" onClick={() => setIsUploadSheetOpen(false)}>
                    취소
                  </button>
                  <button
                    className="btn-sheet-submit"
                    onClick={async () => {
                      if (!activeWorklogId) {
                        alert('작업일지를 선택해주세요.')
                        return
                      }
                      if (uploadFiles.length === 0) {
                        alert('파일을 선택해주세요.')
                        return
                      }

                      const selectedDoc = documents.drawings.find(d => d.id === activeWorklogId)
                      if (!selectedDoc) return

                      setIsUploading(true)
                      try {
                        for (const file of uploadFiles) {
                          const formData = new FormData()
                          formData.append('file', file)
                          formData.append('reportId', activeWorklogId)
                          formData.append('siteId', selectedDoc.siteId)
                          formData.append('docType', drawingUploadType)
                          formData.append('originalName', file.name)

                          const res = await uploadDrawingAction(formData)
                          if (!res.success) throw new Error(res.error)
                        }
                        alert('도면이 업로드되었습니다.')
                        setIsUploadSheetOpen(false)
                        loadData()
                      } catch (err: any) {
                        console.error(err)
                        alert(`업로드 실패: ${err.message}`)
                      } finally {
                        setIsUploading(false)
                      }
                    }}
                  >
                    등록하기
                  </button>
                </div>
              </div>
            ) : activeTab === 'photos' ? (
              <div className="space-y-4">
                <div className="sheet-header">
                  <h3 className="sheet-title">사진 등록</h3>
                  <button className="close-button" onClick={() => setIsUploadSheetOpen(false)}>
                    <X size={24} />
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label">현장 선택</label>
                  <CustomSelect
                    value={uploadSiteId}
                    onValueChange={value => {
                      setUploadSiteId(value)
                      setActiveWorklogId('')
                    }}
                  >
                    <CustomSelectTrigger className="w-full h-12 text-[15px] bg-white border border-slate-200 rounded-xl px-3 focus:ring-2 focus:ring-blue-500/20">
                      <CustomSelectValue placeholder="현장을 선택하세요" />
                    </CustomSelectTrigger>
                    <CustomSelectContent>
                      {Array.from(new Set(documents.drawings.map(d => d.siteName)))
                        .sort()
                        .map(siteName => {
                          const representative = documents.drawings.find(
                            d => d.siteName === siteName
                          )
                          const siteId = representative?.siteId
                          if (!siteId) return null
                          return (
                            <CustomSelectItem key={siteId} value={siteId}>
                              {siteName}
                            </CustomSelectItem>
                          )
                        })}
                    </CustomSelectContent>
                  </CustomSelect>
                </div>

                <div className="form-group">
                  <label className="form-label">작업일지 선택</label>
                  <CustomSelect
                    value={activeWorklogId}
                    onValueChange={setActiveWorklogId}
                    disabled={!uploadSiteId}
                  >
                    <CustomSelectTrigger className="w-full h-12 text-[15px] bg-white border border-slate-200 rounded-xl px-3 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-400">
                      <CustomSelectValue
                        placeholder={
                          uploadSiteId ? '작업일지를 선택하세요' : '현장을 먼저 선택하세요'
                        }
                      />
                    </CustomSelectTrigger>
                    <CustomSelectContent>
                      {documents.drawings
                        .filter(d => d.siteId === uploadSiteId)
                        .map(doc => (
                          <CustomSelectItem key={doc.id} value={doc.id}>
                            <span className="truncate">
                              {doc.date} | {doc.desc}
                            </span>
                          </CustomSelectItem>
                        ))}
                    </CustomSelectContent>
                  </CustomSelect>
                </div>

                <div className="form-group">
                  <label className="form-label">사진 구분</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'before', label: '시공 전' },
                      { id: 'after', label: '시공 후' },
                    ].map(type => (
                      <button
                        key={type.id}
                        className={cn(
                          'h-10 rounded-lg text-[13px] font-bold border transition-all',
                          photoUploadType === type.id
                            ? 'bg-blue-50 border-blue-200 text-blue-600'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        )}
                        onClick={() => setPhotoUploadType(type.id)}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className="upload-area"
                  onClick={() => document.getElementById('photoFileInput')?.click()}
                >
                  <FileImage size={32} className="text-slate-400" />
                  <span className="upload-label">
                    {uploadFiles.length > 0
                      ? `${uploadFiles.length}개 파일 선택됨`
                      : '사진 선택 (다중 가능)'}
                  </span>
                  <input
                    type="file"
                    id="photoFileInput"
                    multiple
                    className="hidden"
                    accept="image/*"
                    onChange={e => setUploadFiles(Array.from(e.target.files || []))}
                  />
                </div>

                <div className="sheet-actions">
                  <button className="btn-sheet-cancel" onClick={() => setIsUploadSheetOpen(false)}>
                    취소
                  </button>
                  <button
                    className="btn-sheet-submit"
                    onClick={async () => {
                      if (!activeWorklogId) {
                        alert('작업일지를 선택해주세요.')
                        return
                      }
                      if (uploadFiles.length === 0) {
                        alert('사진을 선택해주세요.')
                        return
                      }

                      setIsUploading(true)
                      try {
                        for (const file of uploadFiles) {
                          const formData = new FormData()
                          formData.append('file', file)
                          formData.append('reportId', activeWorklogId)
                          formData.append('photoType', photoUploadType)
                          formData.append('originalName', file.name)

                          const res = await uploadPhotoAction(formData)
                          if (!res.success) throw new Error(res.error)
                        }
                        alert('사진이 등록되었습니다.')
                        setIsUploadSheetOpen(false)
                        loadData()
                      } catch (err: any) {
                        console.error(err)
                        alert(`등록 실패: ${err.message}`)
                      } finally {
                        setIsUploading(false)
                      }
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

      {/* Viewer Overlay */}
      {drawingViewer.open && (
        <div className="fixed inset-0 z-[100000] flex flex-col bg-black/95 animate-in fade-in duration-200">
          {/* Viewer Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/50 backdrop-blur-sm border-b border-white/10">
            <button
              onClick={() => setDrawingViewer(prev => ({ ...prev, open: false }))}
              className="p-2 -ml-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h3 className="text-white font-bold text-sm truncate">{drawingViewer.title}</h3>
          </div>

          {/* Viewer Content */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
            {drawingViewer.url ? (
              <img
                src={drawingViewer.url}
                alt={drawingViewer.title}
                className="max-w-full max-h-full object-contain shadow-2xl"
              />
            ) : (
              <div className="text-white/50 text-sm">이미지를 불러올 수 없습니다.</div>
            )}
          </div>
        </div>
      )}
      {/* Markup Tool Overlay */}
      {markupEditor.open && (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-white pt-[env(safe-area-inset-top)]">
          <div className="flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
            <button
              type="button"
              onClick={() => setMarkupEditor(prev => ({ ...prev, open: false }))}
              className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-bold text-[#6b7280] active:bg-gray-200"
            >
              <ArrowLeft className="h-4 w-4" />
              뒤로
            </button>
            <h2 className="text-sm font-bold text-[#1f2942]">
              {markupEditor.showBrowser ? '도면 선택' : '도면 마킹 작업'}
            </h2>
            <div className="w-12" />
          </div>

          <div className="flex-1 overflow-hidden bg-[#f8f9fc]">
            {markupEditor.showBrowser ? (
              <DrawingBrowser
                selectedSite={markupEditor.siteId}
                userId={user?.id || ''}
                onDrawingSelect={handleDrawingSelect}
                initialMode={markupEditor.mode === 'upload' ? 'upload' : 'browse'}
              />
            ) : markupEditor.markupDocument ? (
              <div className="h-full">
                <SharedMarkupEditor
                  initialDocument={markupEditor.markupDocument}
                  onSave={handleMarkupSave}
                  onClose={() => setMarkupEditor(prev => ({ ...prev, open: false }))}
                  embedded={true}
                  savePrompt="save-as"
                />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center p-10 text-center">
                <div className="space-y-6">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                    <UploadCloud className="h-10 w-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-[#1f2942]">마킹할 도면을 선택해주세요</h3>
                    <p className="text-sm text-[#9aa4c5]">
                      저장된 도면을 불러와서 치수 측정을 시작합니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMarkupEditor(prev => ({ ...prev, showBrowser: true }))}
                    className="w-full rounded-xl bg-[#31a3fa] py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 active:scale-[0.98]"
                  >
                    도면 불러오기
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
