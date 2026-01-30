import React, { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Search,
  Plus,
  Download,
  Share2,
  Trash2,
  Edit3,
  X,
  ChevronRight,
  FileText,
  MapPin,
  Check,
  Folder,
  ArrowLeft,
  Camera,
  RefreshCw,
  ChevronDown,
  UploadCloud,
  Eye,
} from 'lucide-react'
import { INITIAL_SITES } from '../../site/constants'
import { ReportEditor } from '../components/ReportEditor'

// --- Types ---
type TabType = 'my-docs' | 'company-docs' | 'drawings' | 'photos' | 'punch'

interface FileItem {
  id: string
  name: string
  type: 'img' | 'file'
  url: string
  url_before?: string
  url_after?: string
  size: string
  ext: string
  currentView?: 'before' | 'after'
  drawingState?: 'ing' | 'done'
}

interface PunchData {
  location: string
  issue: string
  priority: '높음' | '중간' | '낮음'
  status: 'open' | 'ing' | 'done'
  assignee: string
  dueDate: string
}

export interface DocumentGroup {
  id: string
  title: string
  author: string
  date: string
  time: string
  files: FileItem[]
  punchData?: PunchData
}

// --- Construction Themed Images (High Quality Unsplash) ---
const IMG_CONCRETE =
  'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?q=80&w=2070&auto=format&fit=crop'
const IMG_CRACK =
  'https://images.unsplash.com/photo-1584463673554-71bc73426767?q=80&w=1000&auto=format&fit=crop'
const IMG_WALL =
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop'

// --- Mock Data ---
const MOCK_DOCS: Record<TabType, DocumentGroup[]> = {
  'my-docs': [
    {
      id: 'g1',
      title: '개인 증빙서류',
      author: '박작업',
      date: '2025-12-01',
      time: '09:30',
      files: [
        {
          id: 'f1',
          name: '신분증.jpg',
          type: 'img',
          url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=1000&auto=format&fit=crop',
          size: '1.2MB',
          ext: 'JPG',
        },
      ],
    },
  ],
  'company-docs': [
    {
      id: 'g2',
      title: '표준계약서',
      author: '관리자',
      date: '2025-01-01',
      time: '10:00',
      files: [{ id: 'f2', name: '계약서.hwp', type: 'file', url: '', size: '54KB', ext: 'HWP' }],
    },
  ],
  drawings: [
    {
      id: 'g3',
      title: '송파 B현장',
      author: '김설계',
      date: '2025-12-08',
      time: '14:20',
      files: [
        {
          id: 'f3',
          name: '1F 배관도면.pdf',
          type: 'file',
          url: '',
          size: '5MB',
          ext: 'PDF',
          drawingState: 'ing',
        },
      ],
    },
  ],
  photos: [
    {
      id: 'g4',
      title: '송파 B현장',
      author: '이시공',
      date: '2025-12-09',
      time: '16:45',
      files: [
        {
          id: 'f4',
          name: '시공사진1',
          type: 'img',
          url: IMG_CONCRETE,
          url_before: IMG_CONCRETE,
          currentView: 'after',
          size: '2.5MB',
          ext: 'JPG',
        },
      ],
    },
  ],
  punch: [
    {
      id: 'p1',
      title: '자이 아파트 101동',
      author: '관리자',
      date: '2025-12-20',
      time: '14:30',
      punchData: {
        location: '3층 복도',
        issue: '벽면 크랙 발견 및 도장 불량 상태 확인 요망',
        priority: '높음',
        status: 'open',
        assignee: '김보수',
        dueDate: '2025-12-25',
      },
      files: [
        {
          id: 'p1f1',
          name: '보수전',
          type: 'img',
          currentView: 'before',
          url: IMG_CRACK,
          url_before: IMG_CRACK,
          url_after: '',
          size: '1.8MB',
          ext: 'JPG',
        },
      ],
    },
    {
      id: 'p2',
      title: '삼성 반도체 P3',
      author: '안전팀',
      date: '2025-12-22',
      time: '09:15',
      punchData: {
        location: 'B동 1층 로비',
        issue: '타일 들뜸 현상',
        priority: '중간',
        status: 'done',
        assignee: '박시공',
        dueDate: '2025-12-28',
      },
      files: [
        {
          id: 'p2f1',
          name: '보수완료',
          type: 'img',
          currentView: 'after',
          url: IMG_WALL,
          url_before: IMG_CRACK,
          url_after: IMG_WALL,
          size: '2.1MB',
          ext: 'JPG',
        },
      ],
    },
    {
      id: 'p3',
      title: '강남 오피스텔 3차',
      author: '최감리',
      date: '2025-12-23',
      time: '11:00',
      punchData: {
        location: '지하 주차장 입구',
        issue: '페인트 도장 불량',
        priority: '낮음',
        status: 'open',
        assignee: '이도장',
        dueDate: '2025-12-30',
      },
      files: [
        {
          id: 'p3f1',
          name: '현장사진',
          type: 'img',
          currentView: 'before',
          url: IMG_CONCRETE,
          url_before: IMG_CONCRETE,
          url_after: '',
          size: '3.0MB',
          ext: 'JPG',
        },
      ],
    },
    {
      id: 'p4',
      title: '판교 IT센터',
      author: '정소장',
      date: '2025-12-24',
      time: '15:20',
      punchData: {
        location: '5층 화장실',
        issue: '배관 누수 의심',
        priority: '높음',
        status: 'open',
        assignee: '김설비',
        dueDate: '2025-12-26',
      },
      files: [
        {
          id: 'p4f1',
          name: '누수위치.jpg',
          type: 'img',
          currentView: 'before',
          url: IMG_CONCRETE,
          url_before: IMG_CONCRETE,
          url_after: '',
          size: '1.5MB',
          ext: 'JPG',
        },
      ],
    },
  ],
}

// Helper: Format Date to YY.MM.DD (Compact)
const formatDateShort = (dateStr: string) => {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[0].slice(2)}.${parts[1]}.${parts[2]}`
  }
  return dateStr
}

export const DocPage: React.FC = () => {
  const location = useLocation()
  // State
  const [activeTab, setActiveTab] = useState<TabType>('punch')
  const [documents, setDocuments] = useState(MOCK_DOCS)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [visibleCount, setVisibleCount] = useState(5)

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [siteFilter, setSiteFilter] = useState('')

  // Punch Specific State
  const [punchStatusFilter, setPunchStatusFilter] = useState<'all' | 'open' | 'done'>('all')
  const [isPunchEditMode, setIsPunchEditMode] = useState(false)
  const [isReportEditorOpen, setIsReportEditorOpen] = useState(false)

  // Upload Sheet
  const [isUploadSheetOpen, setIsUploadSheetOpen] = useState(false)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0])
  const [fileToReplaceId, setFileToReplaceId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Site Search Dropdown State (for punch tab)
  const [showSiteDropdown, setShowSiteDropdown] = useState(false)
  const [siteSearchQuery, setSiteSearchQuery] = useState('')
  const siteSearchWrapperRef = useRef<HTMLDivElement>(null)

  // Image Preview Modal State
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [previewImageTitle, setPreviewImageTitle] = useState<string>('')

  // Handle navigation state
  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab)
    }
  }, [location.state])

  // --- Helpers ---
  const currentGroup = selectedGroupId
    ? documents[activeTab].find(g => g.id === selectedGroupId)
    : null

  const uniqueSites = Array.from(new Set(documents['punch'].map(d => d.title)))
  const connectedSites = INITIAL_SITES.map(site => site.name)

  // Filter Logic
  const filteredDocs = documents[activeTab].filter(doc => {
    const q = searchQuery.toLowerCase()

    // 1. Site Filter (Dropdown)
    if (activeTab === 'punch' && siteFilter && doc.title !== siteFilter) {
      return false
    }

    // 2. Search Query
    const matchesSearch =
      doc.title.toLowerCase().includes(q) ||
      (doc.punchData && (doc.punchData.location.includes(q) || doc.punchData.issue.includes(q)))

    // 3. Status Filter (Punch Tab)
    if (activeTab === 'punch') {
      if (punchStatusFilter === 'all') return matchesSearch
      return matchesSearch && doc.punchData?.status === punchStatusFilter
    }

    return matchesSearch
  })

  const displayDocs = filteredDocs.slice(0, visibleCount)

  // Punch Statistics
  const punchStats = documents['punch'].reduce(
    (acc, curr) => {
      acc.total++
      if (curr.punchData?.status === 'open') acc.open++
      if (curr.punchData?.status === 'done') acc.done++
      return acc
    },
    { total: 0, open: 0, done: 0 }
  )

  // --- Handlers ---

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setSelectedGroupId(null)
    // Only clear selection when switching tabs, not when opening detail view
    if (tab !== activeTab) {
      setSelectedIds(new Set())
    }
    setIsPunchEditMode(false)
    setSearchQuery('')
    setSiteFilter('')
    setVisibleCount(5) // Reset visible count when switching tabs
  }

  const openDetailView = (id: string) => {
    setSelectedGroupId(id)
    // Don't clear selection when opening detail view
  }

  const closeDetailView = () => {
    setSelectedGroupId(null)
    setIsPunchEditMode(false)
    // Don't clear selection when exiting detail view to allow batch actions
  }

  const toggleSelection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleSelectAll = () => {
    if (!currentGroup) return
    const next = new Set(selectedIds)
    const allSelected = currentGroup.files.every(f => next.has(f.id))

    if (allSelected) {
      currentGroup.files.forEach(f => next.delete(f.id))
    } else {
      currentGroup.files.forEach(f => next.add(f.id))
    }
    setSelectedIds(next)
  }

  // Site Search Handlers (for punch tab)
  const handleSiteSearchInteraction = () => {
    if (siteSearchQuery.trim().length > 0) setShowSiteDropdown(true)
  }

  const handleSiteSearchChange = (value: string) => {
    setSiteSearchQuery(value)
    setSiteFilter(value)
    setShowSiteDropdown(value.trim().length > 0)
  }

  const handleSiteSearchSelect = (siteName: string) => {
    setSiteFilter(siteName)
    setSiteSearchQuery(siteName)
    setShowSiteDropdown(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        siteSearchWrapperRef.current &&
        !siteSearchWrapperRef.current.contains(event.target as Node)
      ) {
        setShowSiteDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // --- Batch Actions ---

  const downloadFile = async (url: string, name: string) => {
    if (!url) return
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = blobUrl
      a.download = name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.warn('Blob fetch failed, falling back to direct link', err)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const handleBatchDownload = async () => {
    const itemsToDownload: FileItem[] = []

    if (selectedGroupId) {
      currentGroup?.files.forEach(f => {
        if (selectedIds.has(f.id)) itemsToDownload.push(f)
      })
    } else {
      documents[activeTab].forEach(g => {
        if (selectedIds.has(g.id)) {
          itemsToDownload.push(...g.files)
        }
      })
    }

    if (itemsToDownload.length === 0) {
      alert('선택된 파일이 없습니다.')
      return
    }

    for (let i = 0; i < itemsToDownload.length; i++) {
      const file = itemsToDownload[i]
      await downloadFile(file.url, file.name)
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    setSelectedIds(new Set())
  }

  const handleBatchShare = async () => {
    const shareData = {
      title: 'INOPNC 공유',
      text: `${selectedIds.size}개의 항목을 공유합니다.`,
      url: window.location.href,
    }

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        console.log('Error sharing', error)
        alert('공유하기를 실행할 수 없습니다. (HTTPS 환경인지 확인해주세요)')
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert('공유 링크가 클립보드에 복사되었습니다.')
      } catch (err) {
        alert('공유 기능을 사용할 수 없습니다.')
      }
    }
    setSelectedIds(new Set())
  }

  const handleBatchDelete = () => {
    const count = selectedIds.size
    if (count === 0) return

    // eslint-disable-next-line no-restricted-globals
    if (!confirm(`${count}개 항목을 삭제하시겠습니까?`)) return

    if (selectedGroupId) {
      // Deleting files within a group
      setDocuments(prev => {
        const newDocs = { ...prev }
        const groupIndex = newDocs[activeTab].findIndex(g => g.id === selectedGroupId)
        if (groupIndex > -1) {
          const group = { ...newDocs[activeTab][groupIndex] }
          group.files = group.files.filter(f => !selectedIds.has(f.id))
          newDocs[activeTab] = [...newDocs[activeTab]]
          newDocs[activeTab][groupIndex] = group
        }
        return newDocs
      })
    } else {
      // Deleting groups from the list
      setDocuments(prev => ({
        ...prev,
        [activeTab]: prev[activeTab].filter(g => !selectedIds.has(g.id)),
      }))
    }
    setSelectedIds(new Set())
  }

  // --- Punch & Photo Logic ---

  const handlePunchSave = (data: PunchData) => {
    if (!currentGroup) return
    const updatedGroup = { ...currentGroup, punchData: data }

    setDocuments(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(g => (g.id === currentGroup.id ? updatedGroup : g)),
    }))
    setIsPunchEditMode(false)
  }

  const handlePunchPhotoUpdate = (file: File, type: 'before' | 'after') => {
    if (!currentGroup) return
    const url = URL.createObjectURL(file)

    let targetFileIndex = currentGroup.files.findIndex(f => f.type === 'img')
    let newFiles = [...currentGroup.files]
    let targetFile = targetFileIndex >= 0 ? { ...newFiles[targetFileIndex] } : null

    if (!targetFile) {
      targetFile = {
        id: `f_${Date.now()}`,
        name: '현장사진',
        type: 'img',
        url: url,
        url_before: '',
        url_after: '',
        size: '0MB',
        ext: 'JPG',
        currentView: type,
      }
      newFiles.push(targetFile)
    } else {
      if (type === 'before') targetFile.url_before = url
      else targetFile.url_after = url

      targetFile.currentView = type
      if (targetFile.currentView === type) targetFile.url = url

      newFiles[targetFileIndex] = targetFile
    }

    const updatedGroup = { ...currentGroup, files: newFiles }
    setDocuments(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(g => (g.id === currentGroup.id ? updatedGroup : g)),
    }))
  }

  const handleSingleFileReplace = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentGroup || !fileToReplaceId || !e.target.files) return
    const file = e.target.files[0]
    const url = URL.createObjectURL(file)

    const updatedFiles = currentGroup.files.map(f => {
      if (f.id === fileToReplaceId) {
        return {
          ...f,
          url: url,
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(1)}MB`,
          ...(f.type === 'img' && f.currentView === 'before' ? { url_before: url } : {}),
          ...(f.type === 'img' && f.currentView === 'after' ? { url_after: url } : {}),
        }
      }
      return f
    })

    const updatedGroup = { ...currentGroup, files: updatedFiles }
    setDocuments(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(g => (g.id === currentGroup.id ? updatedGroup : g)),
    }))
    setFileToReplaceId(null)
  }

  const triggerFileReplace = (id: string) => {
    setFileToReplaceId(id)
    document.getElementById('replace-file-input')?.click()
  }

  const handlePhotoToggle = (fileId: string) => {
    if (!currentGroup) return
    const updatedFiles = currentGroup.files.map(f => {
      if (f.id === fileId && f.type === 'img') {
        const nextView = f.currentView === 'after' ? 'before' : 'after'
        if (nextView === 'before' && !f.url_before) return f
        return {
          ...f,
          currentView: nextView,
          url: nextView === 'after' ? f.url_after || f.url : f.url_before!,
        }
      }
      return f
    })

    const updatedGroup = { ...currentGroup, files: updatedFiles }
    setDocuments(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(g => (g.id === currentGroup.id ? updatedGroup : g)),
    }))
  }

  const handleDrawingToggle = (fileId: string) => {
    if (!currentGroup) return
    const updatedFiles = currentGroup.files.map(f => {
      if (f.id === fileId && f.ext === 'PDF') {
        const nextState = f.drawingState === 'ing' ? 'done' : 'ing'
        return { ...f, drawingState: nextState }
      }
      return f
    })
    const updatedGroup = { ...currentGroup, files: updatedFiles }
    setDocuments(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(g => (g.id === currentGroup.id ? updatedGroup : g)),
    }))
  }

  const openFilePreview = (file: FileItem) => {
    if (file.type !== 'img') return
    const url =
      activeTab === 'photos'
        ? file.currentView === 'after'
          ? file.url_after || file.url
          : file.url_before || file.url
        : file.url
    setPreviewImageUrl(url)
    setPreviewImageTitle(file.name)
  }

  const handleReportUpdateStatus = (id: string, status: 'open' | 'done') => {
    setDocuments(prev => ({
      ...prev,
      punch: prev.punch.map(doc => {
        if (doc.id === id && doc.punchData) {
          return {
            ...doc,
            punchData: { ...doc.punchData!, status: status },
          }
        }
        return doc
      }),
    }))
  }

  const handleReportUpdateImage = (id: string, type: 'before' | 'after', file: File) => {
    const url = URL.createObjectURL(file)
    setDocuments(prev => ({
      ...prev,
      punch: prev.punch.map(doc => {
        if (doc.id === id) {
          let newFiles = [...doc.files]
          let targetFileIndex = newFiles.findIndex(f => f.type === 'img')
          let targetFile = targetFileIndex >= 0 ? { ...newFiles[targetFileIndex] } : null

          if (!targetFile) {
            targetFile = {
              id: `f_${Date.now()}`,
              name: '현장사진',
              type: 'img',
              url: url,
              url_before: '',
              url_after: '',
              size: '0MB',
              ext: 'JPG',
              currentView: type,
            }
            newFiles.push(targetFile)
          } else {
            if (type === 'before') targetFile.url_before = url
            else targetFile.url_after = url
            if (targetFile.currentView === type) targetFile.url = url
            newFiles[targetFileIndex] = targetFile
          }
          return { ...doc, files: newFiles }
        }
        return doc
      }),
    }))
  }

  const performUpload = () => {
    if (activeTab === 'company-docs') return

    const title = uploadTitle || (activeTab === 'punch' ? '새 펀치 항목' : '새 문서')
    const newId = `${activeTab === 'punch' ? 'p' : 'g'}_${Date.now()}`

    const files: FileItem[] = []
    if (fileInputRef.current && fileInputRef.current.files) {
      ;(Array.from(fileInputRef.current.files) as File[]).forEach((f, i) => {
        const url = URL.createObjectURL(f)
        files.push({
          id: `f_${Date.now()}_${i}`,
          name: f.name,
          type: f.type.startsWith('image') ? 'img' : 'file',
          url: url,
          size: `${(f.size / 1024 / 1024).toFixed(2)}MB`,
          ext: f.name.split('.').pop()?.toUpperCase() || 'FILE',
          currentView: 'after',
          drawingState: 'ing',
        })
      })
    }

    const newGroup: DocumentGroup = {
      id: newId,
      title: title,
      author: '나',
      date: uploadDate,
      time: new Date().toTimeString().slice(0, 5),
      files: files,
    }

    if (activeTab === 'punch') {
      newGroup.punchData = {
        location: '위치 미지정',
        issue: '내용 없음',
        priority: '중간',
        status: 'open',
        assignee: '담당자',
        dueDate: uploadDate,
      }
    }

    setDocuments(prev => ({
      ...prev,
      [activeTab]: [newGroup, ...prev[activeTab]],
    }))

    setIsUploadSheetOpen(false)
    setUploadTitle('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleAddFileToGroup = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentGroup || !e.target.files) return
    const file = e.target.files[0]
    const url = URL.createObjectURL(file)

    const newFile: FileItem = {
      id: `f_${Date.now()}`,
      name: file.name,
      type: file.type.startsWith('image') ? 'img' : 'file',
      url: url,
      size: `${(file.size / (1024 * 1024)).toFixed(1)}MB`,
      ext: file.name.split('.').pop()?.toUpperCase() || 'FILE',
      currentView: 'after',
      drawingState: 'ing',
    }

    const updatedGroup = { ...currentGroup, files: [...currentGroup.files, newFile] }
    setDocuments(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(g => (g.id === currentGroup.id ? updatedGroup : g)),
    }))
    setFileToReplaceId(null)
  }

  const handleDeleteFile = (fileId: string) => {
    if (!currentGroup) return

    const updatedGroup = {
      ...currentGroup,
      files: currentGroup.files.filter(f => f.id !== fileId),
    }

    setDocuments(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(g => (g.id === currentGroup.id ? updatedGroup : g)),
    }))

    // Also remove from selected IDs if it was selected
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(fileId)
      return newSet
    })
  }

  // --- Render Components ---

  const renderPunchSummary = () => (
    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => setPunchStatusFilter('all')}
        className={`px-4 py-2 rounded-full text-sm font-bold border whitespace-nowrap ${punchStatusFilter === 'all' ? 'bg-header-navy text-white border-transparent' : 'bg-[var(--bg-surface)] text-text-sub border-[var(--border)]'}`}
      >
        전체 {punchStats.total}
      </button>
      <button
        onClick={() => setPunchStatusFilter('open')}
        className={`px-4 py-2 rounded-full text-sm font-bold border whitespace-nowrap ${punchStatusFilter === 'open' ? 'bg-red-500 text-white border-red-500' : 'bg-[var(--bg-surface)] text-text-sub border-[var(--border)]'}`}
      >
        미조치 {punchStats.open}
      </button>
      <button
        onClick={() => setPunchStatusFilter('done')}
        className={`px-4 py-2 rounded-full text-sm font-bold border whitespace-nowrap ${punchStatusFilter === 'done' ? 'bg-green-500 text-white border-green-500' : 'bg-[var(--bg-surface)] text-text-sub border-[var(--border)]'}`}
      >
        완료 {punchStats.done}
      </button>
    </div>
  )

  const renderTabBar = () => (
    <div className="fixed top-[60px] left-0 right-0 h-[48px] bg-[var(--bg-surface)] border-b border-[var(--border)] z-40 flex justify-center shadow-sm transition-colors duration-300">
      <div className="w-full max-w-[600px] flex h-full">
        {['my-docs', 'company-docs', 'drawings', 'photos', 'punch'].map(key => {
          const labels: Record<string, string> = {
            'my-docs': '내문서함',
            'company-docs': '회사서류',
            drawings: '도면',
            photos: '사진함',
            punch: '펀치',
          }
          const active = activeTab === key
          return (
            <button
              key={key}
              onClick={() => handleTabChange(key as TabType)}
              className={`flex-1 text-[16px] font-semibold transition-colors border-b-[3px] px-1 ${active ? 'text-primary border-primary font-bold' : 'text-text-sub border-transparent'}`}
            >
              {labels[key]}
            </button>
          )
        })}
      </div>
    </div>
  )

  const renderBatchBar = () => {
    const show = selectedIds.size > 0
    const fabVisible = activeTab !== 'company-docs'
    return (
      <div
        className={
          `fixed bottom-[calc(96px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 ` +
          (fabVisible
            ? 'w-[calc(100%-184px)] max-w-[420px] '
            : 'w-[calc(100%-32px)] max-w-[500px] ') +
          `bg-header-navy text-white rounded-[24px] px-3 py-3 flex items-center justify-around shadow-2xl z-[5000] border border-white/10 ` +
          `backdrop-blur-md transition-all duration-300 ease-out will-change-transform ` +
          (show
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-6 pointer-events-none')
        }
      >
        <button
          onClick={handleBatchDownload}
          className="flex flex-col items-center gap-1.5 px-4 py-1.5 hover:bg-slate-50/10 active:bg-slate-50/15 active:scale-95 rounded-xl transition-all"
        >
          <Download size={24} />
          <span className="text-sm font-extrabold leading-none">저장</span>
        </button>
        <button
          onClick={handleBatchShare}
          className="flex flex-col items-center gap-1.5 px-4 py-1.5 hover:bg-slate-50/10 active:bg-slate-50/15 active:scale-95 rounded-xl transition-all"
        >
          <Share2 size={24} />
          <span className="text-sm font-extrabold leading-none">공유</span>
        </button>
        {activeTab !== 'company-docs' && (
          <button
            onClick={handleBatchDelete}
            className="flex flex-col items-center gap-1.5 px-4 py-1.5 hover:bg-slate-50/10 active:bg-slate-50/15 active:scale-95 rounded-xl transition-all text-rose-500"
          >
            <Trash2 size={24} strokeWidth={3} />
            <span className="text-sm font-black leading-none">삭제</span>
          </button>
        )}
      </div>
    )
  }

  const renderListItem = (group: DocumentGroup) => {
    const isPunch = activeTab === 'punch'
    const isSelected = selectedIds.has(group.id)
    const repImg = group.files.find(f => f.type === 'img')

    // FORCE TEST IMAGE IF EMPTY: Fixes broken icon clipping
    const thumbUrl = repImg
      ? (repImg.currentView === 'after' ? repImg.url_after : repImg.url_before) || repImg.url
      : IMG_CONCRETE

    if (isPunch) {
      const status = group.punchData?.status || 'open'
      const isDone = status === 'done'

      return (
        <div
          key={group.id}
          onClick={() => openDetailView(group.id)}
          className={`bg-[var(--bg-surface)] rounded-2xl p-4 mb-3 shadow-sm border-2 cursor-pointer transition-all relative ${isSelected ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20' : 'border-[var(--border)]'}`}
        >
          <span
            className={`
                        absolute top-0 right-0 z-10 text-[13px] font-semibold px-3.5 py-1.5
                        text-white inline-flex items-center justify-center leading-none
                        ${isDone ? 'bg-slate-500' : 'bg-red-500'}
                    `}
            style={{
              margin: 0,
              borderRadius: '0 16px 0 16px',
              border: 'none',
            }}
          >
            {isDone ? '완료' : '미조치'}
          </span>
          <div className="flex gap-4 items-start w-full">
            <div className="pt-1" onClick={e => toggleSelection(e, group.id)}>
              <div
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-sky-500 border-sky-500 shadow-md' : 'bg-[var(--bg-surface)] border-slate-300 dark:border-slate-600'}`}
              >
                <Check size={14} className="text-white" />
              </div>
            </div>
            <div className="w-20 h-20 rounded-xl bg-[var(--bg-hover)] border border-[var(--border)] overflow-hidden flex-shrink-0">
              {/* Always show an image, fallback to IMG_CONCRETE if missing */}
              <img src={thumbUrl || IMG_CONCRETE} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-sm text-text-sub font-bold mb-1">
                <MapPin size={14} /> {group.punchData?.location}
              </div>
              <div className="text-lg font-bold text-text-main truncate leading-tight mb-2">
                {group.punchData?.issue}
              </div>
              <div className="text-sm font-medium text-text-sub">
                {group.title} <span className="mx-1 text-slate-300 dark:text-slate-600">|</span>{' '}
                {formatDateShort(group.date)}
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div
        key={group.id}
        onClick={() => openDetailView(group.id)}
        className={`bg-[var(--bg-surface)] rounded-2xl p-4 mb-3 shadow-sm border-2 cursor-pointer flex items-center transition-all ${isSelected ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20' : 'border-[var(--border)]'}`}
      >
        <div className="mt-1" onClick={e => toggleSelection(e, group.id)}>
          <div
            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-sky-500 border-sky-500' : 'bg-[var(--bg-surface)] border-slate-300 dark:border-slate-600'}`}
          >
            <Check size={16} className="text-white" />
          </div>
        </div>
        <div className="w-16 h-16 rounded-xl bg-[var(--bg-hover)] border border-[var(--border)] overflow-hidden flex-shrink-0 flex items-center justify-center text-slate-400 dark:text-slate-500 ml-4">
          {thumbUrl ? (
            <img src={thumbUrl} className="w-full h-full object-cover" />
          ) : (
            <Folder size={32} />
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 ml-4">
          <div className="text-lg font-bold text-text-main truncate leading-tight">
            {group.title}
          </div>
          <div className="flex items-center text-sm font-medium text-text-sub mt-1">
            {group.author} <span className="mx-2 text-slate-300 dark:text-slate-600">|</span>{' '}
            {formatDateShort(group.date)}{' '}
            <span className="ml-2 text-slate-400 dark:text-slate-500">{group.time}</span>
          </div>
        </div>
        <ChevronRight className="text-slate-300 dark:text-slate-600 self-center ml-auto" />
      </div>
    )
  }

  const renderDetailView = () => {
    if (!currentGroup) return null
    const isPunch = activeTab === 'punch'
    const pd = currentGroup.punchData
    const allSelected =
      currentGroup.files.length > 0 && currentGroup.files.every(f => selectedIds.has(f.id))

    const punchFile = currentGroup.files.find(f => f.type === 'img')
    const imgBefore = punchFile?.url_before || punchFile?.url
    const imgAfter = punchFile?.url_after

    return (
      <div
        className="fixed inset-0 z-50 transition-colors duration-300 flex flex-col"
        style={{ backgroundColor: 'var(--bg-body)' }}
      >
        <div className="bg-[var(--bg-surface)] border-b border-[var(--border)] shrink-0">
          <div className="h-[54px] max-w-[720px] w-full mx-auto flex items-center justify-between px-4">
            <button
              onClick={closeDetailView}
              className="flex items-center gap-2 p-2 -ml-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-[var(--text-main)]" />
              <span className="text-[var(--text-main)] font-medium">이전</span>
            </button>
            <h2 className="text-lg font-bold text-[var(--text-main)] truncate flex-1 text-center px-4">
              {isPunch ? currentGroup.title : currentGroup.title}
            </h2>
            <div className="w-16 flex justify-end">
              {isPunch && (
                <button
                  onClick={() => setIsReportEditorOpen(true)}
                  className="bg-[var(--bg-hover)] text-text-sub border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm font-bold hover:bg-[var(--bg-input)]"
                >
                  보고서
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[720px] w-full mx-auto p-4 pb-32">
            {isPunch && pd && (
              <div
                className={`bg-[var(--bg-surface)] rounded-2xl p-6 shadow-md mb-6 border-2 ${isPunchEditMode ? 'border-sky-500' : 'border-[var(--border)]'}`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-black text-[var(--text-main)]">펀치 정보</h3>
                  {!isPunchEditMode && (
                    <button
                      onClick={() => setIsPunchEditMode(true)}
                      className="bg-sky-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1"
                    >
                      <Edit3 size={16} /> 수정
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-1">
                    <label className="text-sm font-bold text-text-sub">위치</label>
                    {isPunchEditMode ? (
                      <input
                        className="w-full h-[50px] px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-lg text-[var(--text-main)] focus:border-sky-500 outline-none"
                        defaultValue={pd.location}
                        onChange={e => handlePunchSave({ ...pd, location: e.target.value })}
                      />
                    ) : (
                      <div className="text-lg text-[var(--text-main)] border-b border-[var(--border)] pb-2">
                        {pd.location}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    <label className="text-sm font-bold text-text-sub">문제점</label>
                    {isPunchEditMode ? (
                      <textarea
                        className="w-full h-[80px] p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-lg text-[var(--text-main)] focus:border-sky-500 outline-none resize-none"
                        defaultValue={pd.issue}
                        onChange={e => handlePunchSave({ ...pd, issue: e.target.value })}
                      />
                    ) : (
                      <div className="text-lg text-[var(--text-main)] border-b border-[var(--border)] pb-2">
                        {pd.issue}
                      </div>
                    )}
                  </div>
                  {isPunchEditMode && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-bold text-text-sub mb-2 block">상태</label>
                          <select
                            className="w-full h-[54px] px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-lg text-[var(--text-main)] focus:border-sky-500 appearance-none"
                            defaultValue={pd.status}
                            onChange={e =>
                              handlePunchSave({ ...pd, status: e.target.value as any })
                            }
                          >
                            <option value="open">미조치</option>
                            <option value="ing">조치중</option>
                            <option value="done">완료</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-bold text-text-sub mb-2 block">
                            우선순위
                          </label>
                          <select
                            className="w-full h-[54px] px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-lg text-[var(--text-main)] focus:border-sky-500 appearance-none"
                            defaultValue={pd.priority}
                            onChange={e =>
                              handlePunchSave({ ...pd, priority: e.target.value as any })
                            }
                          >
                            <option value="높음">높음</option>
                            <option value="중간">중간</option>
                            <option value="낮음">낮음</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="text-sm font-bold text-text-sub mb-2 block">
                          사진 등록
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <div
                            className={`aspect-square rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--bg-hover)] flex flex-col items-center justify-center cursor-pointer relative ${imgBefore ? 'border-slate-400 dark:border-slate-600' : ''}`}
                            onClick={() => document.getElementById('upload-before')?.click()}
                          >
                            {imgBefore ? (
                              <img
                                src={imgBefore}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              <Camera size={24} />
                            )}
                            {!imgBefore && <span className="text-xs font-bold mt-1">보수 전</span>}
                            {imgBefore && (
                              <div className="absolute bottom-2 left-2 bg-slate-800 text-white text-xs px-2 py-1 rounded">
                                보수 전
                              </div>
                            )}
                            <input
                              id="upload-before"
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={e =>
                                e.target.files &&
                                handlePunchPhotoUpdate(e.target.files[0], 'before')
                              }
                            />
                          </div>
                          <div
                            className={`aspect-square rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--bg-hover)] flex flex-col items-center justify-center cursor-pointer relative ${imgAfter ? 'border-slate-400 dark:border-slate-600' : ''}`}
                            onClick={() => document.getElementById('upload-after')?.click()}
                          >
                            {imgAfter ? (
                              <img
                                src={imgAfter}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              <Camera size={24} />
                            )}
                            {!imgAfter && <span className="text-xs font-bold mt-1">보수 후</span>}
                            {imgAfter && (
                              <div className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                                보수 후
                              </div>
                            )}
                            <input
                              id="upload-after"
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={e =>
                                e.target.files && handlePunchPhotoUpdate(e.target.files[0], 'after')
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-6 pt-4 border-t border-[var(--border)]">
                        <button
                          onClick={() => setIsPunchEditMode(false)}
                          className="flex-1 h-12 rounded-xl border border-[var(--border)] text-text-sub font-bold text-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)]"
                        >
                          취소
                        </button>
                        <button
                          onClick={() => setIsPunchEditMode(false)}
                          className="flex-1 h-12 rounded-xl bg-header-navy text-white font-bold text-lg"
                        >
                          저장
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {!isPunchEditMode && (
              <div className="mt-2">
                <div className="flex justify-between items-end mb-3">
                  <h3 className="text-lg font-bold text-[var(--text-main)]">
                    {isPunch ? '보수 전/후 사진' : '첨부 파일'}
                  </h3>
                  {currentGroup.files.length > 0 && activeTab !== 'company-docs' && (
                    <button
                      onClick={handleSelectAll}
                      className="text-sm font-bold text-text-sub flex items-center gap-1"
                    >
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center ${allSelected ? 'bg-sky-500 border-sky-500' : 'border-[var(--border)]'}`}
                      >
                        {allSelected && <Check size={12} className="text-white" />}
                      </div>
                      전체선택
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {activeTab !== 'company-docs' && !isPunch && (
                    <div
                      className="aspect-[4/3] rounded-2xl border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center text-sky-500 cursor-pointer bg-[var(--bg-hover)] hover:bg-[var(--bg-input)]"
                      onClick={() => document.getElementById('add-file')?.click()}
                    >
                      <Plus size={32} />
                      <span className="font-bold mt-2">추가</span>
                      <input
                        id="add-file"
                        type="file"
                        hidden
                        multiple
                        onChange={handleAddFileToGroup}
                      />
                    </div>
                  )}

                  {currentGroup.files.map(file => {
                    const isImg = file.type === 'img'
                    let displayUrl = file.url
                    let badge = null

                    if (activeTab === 'photos' && isImg) {
                      displayUrl =
                        file.currentView === 'after' ? file.url_after || file.url : file.url_before!
                      badge = (
                        <span
                          className={`absolute bottom-2 right-2 text-white text-[11px] font-bold px-2 py-1 rounded-lg shadow-sm ${file.currentView === 'after' ? 'bg-sky-500' : 'bg-slate-600'}`}
                          onClick={e => {
                            e.stopPropagation()
                            handlePhotoToggle(file.id)
                          }}
                        >
                          {file.currentView === 'after' ? '보수후' : '보수전'}
                        </span>
                      )
                    } else if (activeTab === 'drawings') {
                      badge = (
                        <span
                          className={`absolute bottom-2 right-2 text-white text-[11px] font-bold px-2 py-1 rounded-lg shadow-sm ${file.drawingState === 'done' ? 'bg-slate-600' : 'bg-sky-500'}`}
                          onClick={e => {
                            e.stopPropagation()
                            handleDrawingToggle(file.id)
                          }}
                        >
                          {file.drawingState === 'done' ? '완료도면' : '진행도면'}
                        </span>
                      )
                    } else if (isPunch) {
                      if (file.currentView === 'after' && file.url_after) {
                        displayUrl = file.url_after
                        badge = (
                          <span className="absolute bottom-2 right-2 bg-green-600 text-white text-[11px] font-bold px-2 py-1 rounded-lg shadow-sm">
                            보수후
                          </span>
                        )
                      } else if (file.url_before) {
                        displayUrl = file.url_before
                        badge = (
                          <span className="absolute bottom-2 right-2 bg-slate-800 text-white text-[11px] font-bold px-2 py-1 rounded-lg shadow-sm">
                            보수전
                          </span>
                        )
                      }
                    }

                    const isSel = selectedIds.has(file.id)

                    const handleCardClick = () => {
                      if (activeTab === 'punch') return

                      if (isSel) {
                        if (isImg) openFilePreview(file)
                        return
                      }

                      setSelectedIds(prev => {
                        const next = new Set(prev)
                        next.add(file.id)
                        return next
                      })
                    }

                    return (
                      <div
                        key={file.id}
                        className={`aspect-[4/3] rounded-2xl shadow-sm overflow-hidden relative border-2 transition-all ${isSel ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20' : 'bg-[var(--bg-surface)] border-[var(--border)]'}`}
                        onClick={activeTab === 'punch' ? undefined : handleCardClick}
                      >
                        {/* 1. 우측 상단: 선택 체크박스 */}
                        <div
                          className="absolute top-2 right-2 z-20"
                          onClick={e => toggleSelection(e, file.id)}
                        >
                          <div
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isSel ? 'bg-sky-500 border-sky-500 shadow-md' : 'bg-[var(--bg-surface)] border-[var(--border)] backdrop-blur-sm'}`}
                          >
                            {isSel && <Check size={16} strokeWidth={3} className="text-white" />}
                          </div>
                        </div>

                        {/* 2. 좌측 상단: 관리 버튼 (재업로드 & 삭제) */}
                        {activeTab !== 'company-docs' && (
                          <div className="absolute top-2 left-2 z-20 flex flex-col gap-1.5">
                            <button
                              className="w-8 h-8 rounded-lg bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                              onClick={e => {
                                e.stopPropagation()
                                triggerFileReplace(file.id)
                              }}
                              title="파일 교체"
                            >
                              <RefreshCw size={14} />
                            </button>
                            <button
                              className="w-8 h-8 rounded-lg bg-rose-500/90 backdrop-blur-md flex items-center justify-center text-white hover:bg-rose-600 transition-colors"
                              onClick={e => {
                                e.stopPropagation()
                                handleDeleteFile(file.id)
                              }}
                              title="개별 삭제"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}

                        {/* 이미지 및 미리보기 영역 */}
                        <div
                          className="w-full h-[75%] bg-[var(--bg-hover)] flex items-center justify-center overflow-hidden relative"
                          onClick={handleCardClick}
                        >
                          {isImg ? (
                            <img
                              src={displayUrl}
                              className="w-full h-full object-cover"
                              alt={file.name}
                            />
                          ) : (
                            <FileText size={40} className="text-slate-300 dark:text-slate-600" />
                          )}

                          {/* 3. 좌측 하단: 미리보기 */}
                          {isImg && activeTab !== 'punch' && (
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                openFilePreview(file)
                              }}
                              className="absolute bottom-2 left-2 h-7 px-2 rounded-lg bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold flex items-center gap-1 hover:bg-black/60 transition"
                            >
                              <Eye size={12} /> 미리보기
                            </button>
                          )}

                          {/* 4. 우측 하단: 상태 배지 */}
                          {badge}
                        </div>

                        <div className="h-[25%] p-2 flex flex-col justify-center items-center text-center bg-[var(--bg-surface)] border-t border-[var(--border)]">
                          <div className="text-[11px] font-bold text-[var(--text-main)] truncate w-full px-1">
                            {file.name}
                          </div>
                          <div className="text-[9px] text-text-sub font-medium">{file.size}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        <input type="file" id="replace-file-input" hidden onChange={handleSingleFileReplace} />
      </div>
    )
  }

  return (
    <div
      className="w-full min-h-screen transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-body)', paddingTop: '0px' }}
    >
      {renderTabBar()}

      <div
        className="w-full max-w-[600px] mx-auto p-4 min-h-[calc(100vh-48px)]"
        style={{ paddingTop: '60px' }}
      >
        {activeTab === 'punch' && (
          <div className="mb-4 relative" ref={siteSearchWrapperRef}>
            <input
              type="text"
              className="w-full h-[54px] rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] px-[22px] pr-12 text-[17px] text-[var(--text-main)] font-medium transition-all duration-200 ease-out hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:bg-[var(--bg-surface)] focus:border-primary focus:border-[1.5px] focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)] cursor-pointer focus:cursor-text placeholder:text-slate-400 dark:placeholder:text-slate-500"
              placeholder="현장명을 입력하세요."
              value={siteSearchQuery}
              onChange={e => handleSiteSearchChange(e.target.value)}
              onClick={handleSiteSearchInteraction}
              onFocus={handleSiteSearchInteraction}
            />
            {siteSearchQuery ? (
              <button
                className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-slate-300 dark:bg-slate-600 text-white rounded-full w-[22px] h-[22px] flex items-center justify-center border-none cursor-pointer"
                onClick={() => {
                  setSiteSearchQuery('')
                  setSiteFilter('')
                  setShowSiteDropdown(false)
                }}
              >
                <X size={14} />
              </button>
            ) : (
              <Search
                className="absolute right-[18px] top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500 pointer-events-none"
                size={20}
              />
            )}

            {showSiteDropdown && (
              <div className="absolute top-[60px] left-0 right-0 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl max-h-[300px] overflow-y-auto z-[100] shadow-xl">
                {uniqueSites.filter(s => s.toLowerCase().includes(siteSearchQuery.toLowerCase()))
                  .length === 0 ? (
                  <div className="p-4 text-slate-400 text-center">검색 결과 없음</div>
                ) : (
                  <>
                    <div
                      className="p-3.5 border-b border-[var(--border)] cursor-pointer hover:bg-[var(--bg-hover)] text-[16px] text-[var(--text-main)]"
                      onClick={() => handleSiteSearchSelect('')}
                    >
                      전체 현장
                    </div>
                    {uniqueSites
                      .filter(s => s.toLowerCase().includes(siteSearchQuery.toLowerCase()))
                      .map(site => (
                        <div
                          key={site}
                          className="p-3.5 border-b border-[var(--border)] cursor-pointer hover:bg-[var(--bg-hover)] text-[16px] text-[var(--text-main)]"
                          onClick={() => handleSiteSearchSelect(site)}
                        >
                          {site}
                        </div>
                      ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <div className="relative mb-6">
          <input
            className="w-full h-[56px] rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] px-4 pr-12 text-[17px] text-[var(--text-main)] font-medium transition-all duration-200 ease-out hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:bg-[var(--bg-surface)] focus:border-primary focus:border-[1.5px] focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)] placeholder:text-slate-400 dark:placeholder:text-slate-500"
            placeholder={activeTab === 'punch' ? '위치 또는 내용 검색...' : '문서명 검색...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <div
            className={`absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none transition-opacity ${searchQuery ? 'opacity-0' : 'opacity-100'}`}
          >
            <Search size={20} />
          </div>
          {searchQuery && (
            <button
              className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-slate-300 dark:bg-slate-600 text-white rounded-full w-[22px] h-[22px] flex items-center justify-center border-none cursor-pointer"
              onClick={() => setSearchQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {activeTab === 'punch' && renderPunchSummary()}

        <div className="pb-[120px]">
          {displayDocs.length > 0 ? (
            displayDocs.map(renderListItem)
          ) : (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
              <div className="w-20 h-20 rounded-full bg-[var(--bg-hover)] flex items-center justify-center mb-4">
                <Search size={32} className="text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-lg font-bold text-slate-400 dark:text-slate-500">
                검색 결과가 없습니다.
              </p>
            </div>
          )}
          {filteredDocs.length > visibleCount && (
            <button
              onClick={() => setVisibleCount(prev => prev + 5)}
              className="w-full h-12 flex items-center justify-center gap-2 text-text-sub text-[14px] font-medium transition-colors duration-200 mt-4 hover:text-text-main"
            >
              <span>더보기</span>
              <ChevronDown size={18} />
            </button>
          )}
          {visibleCount > 5 && filteredDocs.length <= visibleCount && (
            <button
              onClick={() => setVisibleCount(5)}
              className="w-full h-12 flex items-center justify-center gap-2 text-text-sub text-[14px] font-medium transition-colors duration-200 mt-4 hover:text-text-main"
            >
              <span>접기</span>
              <ChevronDown size={18} className="rotate-180" />
            </button>
          )}
        </div>
      </div>

      {activeTab !== 'company-docs' && (
        <button
          onClick={() => setIsUploadSheetOpen(true)}
          className="fixed bottom-24 right-6 w-16 h-16 rounded-full bg-header-navy text-white shadow-lg flex items-center justify-center active:scale-90 transition-transform z-30"
        >
          <Plus size={32} />
        </button>
      )}

      {selectedGroupId && renderDetailView()}

      {isReportEditorOpen && selectedGroupId && (
        <ReportEditor
          items={documents['punch']}
          siteName={currentGroup?.title || '현장'}
          onClose={() => setIsReportEditorOpen(false)}
          onUpdateStatus={handleReportUpdateStatus}
          onUpdateImage={handleReportUpdateImage}
        />
      )}

      {renderBatchBar()}

      {/* Action Sheet (Bottom Sheet) */}
      {isUploadSheetOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[2100]"
            onClick={() => setIsUploadSheetOpen(false)}
          ></div>
          <div className="fixed bottom-0 left-0 right-0 w-full max-w-[600px] mx-auto bg-[var(--bg-surface)] border-t border-[var(--border)] z-[2200] rounded-t-3xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[var(--text-main)]">자료 등록</h3>
              <button onClick={() => setIsUploadSheetOpen(false)}>
                <X className="text-[var(--text-main)]" />
              </button>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-bold text-text-sub mb-2">
                {activeTab === 'punch' ? '현장명' : '문서명'}
              </label>
              {activeTab === 'punch' ? (
                <div className="relative" ref={siteSearchWrapperRef}>
                  <input
                    type="text"
                    className="
                                w-full h-[54px] rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] px-[22px] pr-12 text-[17px] text-[var(--text-main)] font-medium 
                                transition-all duration-200 ease-out 
                                hover:border-slate-300 dark:hover:border-slate-600 
                                focus:outline-none focus:bg-[var(--bg-surface)] 
                                focus:border-primary focus:border-[1.5px] 
                                focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)] 
                                cursor-pointer focus:cursor-text
                                placeholder:text-slate-400 dark:placeholder:text-slate-500
                            "
                    placeholder="현장명을 입력하세요."
                    value={uploadTitle}
                    onChange={e => {
                      setUploadTitle(e.target.value)
                      handleSiteSearchChange(e.target.value)
                    }}
                    onClick={handleSiteSearchInteraction}
                    onFocus={handleSiteSearchInteraction}
                  />
                  {uploadTitle ? (
                    <button
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-slate-300 dark:bg-slate-600 text-white rounded-full w-[22px] h-[22px] flex items-center justify-center border-none cursor-pointer"
                      onClick={() => {
                        setUploadTitle('')
                        setShowSiteDropdown(false)
                      }}
                    >
                      <X size={14} />
                    </button>
                  ) : (
                    <Search
                      className="absolute right-[18px] top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500 pointer-events-none"
                      size={20}
                    />
                  )}

                  {showSiteDropdown && (
                    <div className="absolute top-[60px] left-0 right-0 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl max-h-[300px] overflow-y-auto z-[100] shadow-xl animate-slideDown">
                      {connectedSites.filter(site =>
                        site.toLowerCase().includes(uploadTitle.toLowerCase())
                      ).length === 0 ? (
                        <div className="p-4 text-slate-400 text-center">검색 결과 없음</div>
                      ) : (
                        <>
                          <div
                            className="p-3.5 border-b border-[var(--border)] cursor-pointer hover:bg-[var(--bg-hover)] text-[16px] text-[var(--text-main)]"
                            onClick={() => {
                              setUploadTitle('')
                              setShowSiteDropdown(false)
                            }}
                          >
                            전체 현장
                          </div>
                          {connectedSites
                            .filter(site => site.toLowerCase().includes(uploadTitle.toLowerCase()))
                            .map(site => (
                              <div
                                key={site}
                                className="p-3.5 border-b border-[var(--border)] cursor-pointer hover:bg-[var(--bg-hover)] text-[16px] text-[var(--text-main)]"
                                onClick={() => {
                                  setUploadTitle(site)
                                  setShowSiteDropdown(false)
                                }}
                              >
                                {site}
                              </div>
                            ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  className="w-full h-14 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-lg text-[var(--text-main)] focus:border-sky-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="문서명을 입력하세요"
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                />
              )}
            </div>

            <div className="mb-5">
              <label className="block text-sm font-bold text-text-sub mb-2">등록일</label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full h-14 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-lg text-[var(--text-main)] focus:border-sky-500 outline-none"
                  value={uploadDate}
                  onChange={e => setUploadDate(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-bold text-text-sub mb-2">파일 첨부</label>
              <div
                className="w-full h-16 border-2 border-dashed border-[var(--border)] rounded-xl flex items-center justify-center gap-2 cursor-pointer bg-[var(--bg-hover)] hover:bg-[var(--bg-input)] active:opacity-90 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="text-text-sub" />
                <span className="font-bold text-text-sub">파일 선택 (다중 가능)</span>
                <input type="file" multiple hidden ref={fileInputRef} />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsUploadSheetOpen(false)}
                className="flex-1 h-16 rounded-2xl border-2 border-[var(--border)] text-[var(--text-main)] font-bold text-lg bg-[var(--bg-hover)] hover:bg-[var(--bg-input)] transition-colors"
              >
                취소
              </button>
              <button
                onClick={performUpload}
                className="flex-1 h-16 bg-header-navy text-white text-lg font-bold rounded-2xl shadow-lg active:scale-[0.98] transition-transform hover:opacity-90"
              >
                등록하기
              </button>
            </div>
          </div>
        </>
      )}

      {/* Image Preview Modal */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute -top-12 right-0 text-white hover:text-slate-300 transition"
            >
              <X size={32} />
            </button>
            <img
              src={previewImageUrl}
              alt={previewImageTitle}
              className="max-w-full max-h-[90vh] object-contain"
              onClick={e => e.stopPropagation()}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-4 text-center">
              {previewImageTitle}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DocPage
