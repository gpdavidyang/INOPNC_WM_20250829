import React, { useState, useEffect, useRef } from 'react'
import {
  Search,
  Mic,
  X,
  ArrowLeft,
  Check,
  Plus,
  MapPin,
  AlertCircle,
  FileText,
  ChevronRight,
  UploadCloud,
  Download,
  Share2,
  Trash2,
  Folder,
  Camera,
  Edit3,
  MoreHorizontal,
  RefreshCw,
  Calendar,
  Eye,
  Moon,
  Sun,
} from 'lucide-react'
import { TabType, DocumentGroup, FileItem, PunchData } from '@inopnc/shared/types'
import { ReportEditor } from './components/ReportEditor'
import { MainLayout } from '@inopnc/shared'
import { themeManager, Theme } from './themeManager'
import './theme.css'

// --- Construction Themed Images (High Quality Unsplash) ---
const IMG_CONCRETE =
  'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?q=80&w=2070&auto=format&fit=crop'
const IMG_CRACK =
  'https://images.unsplash.com/photo-1584463673554-71bc73426767?q=80&w=1000&auto=format&fit=crop'
const IMG_WALL =
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop'
const IMG_DRAWING =
  'https://images.unsplash.com/photo-1581094794329-cdac82a6cc88?q=80&w=1000&auto=format&fit=crop'

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
        // Added mock file to ensure preview is shown instead of empty/broken icon
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

const App: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<TabType>('punch')
  const [documents, setDocuments] = useState(MOCK_DOCS)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

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

  // Hover state for file cards
  const [hoveredFileId, setHoveredFileId] = useState<string | null>(null)

  // Theme state
  const [currentTheme, setCurrentTheme] = useState<Theme>('light')

  // Initialize theme manager
  useEffect(() => {
    const unsubscribe = themeManager.subscribe(theme => {
      setCurrentTheme(theme)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // --- Helpers ---
  const currentGroup = selectedGroupId
    ? documents[activeTab].find(g => g.id === selectedGroupId)
    : null

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

  const uniqueSites = Array.from(new Set(documents['punch'].map(d => d.title)))

  // --- Handlers ---

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setSelectedGroupId(null)
    setSelectedIds(new Set())
    setIsPunchEditMode(false)
    setSearchQuery('')
    setSiteFilter('')
  }

  const openDetailView = (id: string) => {
    setSelectedGroupId(id)
    setSelectedIds(new Set()) // Clear selection from list view when entering detail
  }

  const closeDetailView = () => {
    setSelectedGroupId(null)
    setIsPunchEditMode(false)
    setSelectedIds(new Set()) // Clear selection from detail view when exiting
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

  // --- Render Components ---

  const renderPunchSummary = () => (
    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => setPunchStatusFilter('all')}
        className={`px-4 py-2 rounded-full text-sm font-bold border whitespace-nowrap ${punchStatusFilter === 'all' ? 'bg-[#1a254f] text-white border-[#1a254f]' : 'bg-white text-gray-500 border-gray-200'}`}
      >
        전체 {punchStats.total}
      </button>
      <button
        onClick={() => setPunchStatusFilter('open')}
        className={`px-4 py-2 rounded-full text-sm font-bold border whitespace-nowrap ${punchStatusFilter === 'open' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-500 border-gray-200'}`}
      >
        미조치 {punchStats.open}
      </button>
      <button
        onClick={() => setPunchStatusFilter('done')}
        className={`px-4 py-2 rounded-full text-sm font-bold border whitespace-nowrap ${punchStatusFilter === 'done' ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-500 border-gray-200'}`}
      >
        완료 {punchStats.done}
      </button>
    </div>
  )

  const renderTabBar = () => (
    <div className="fixed top-0 left-0 right-0 h-[54px] bg-bg-surface border-b border-border z-40 flex justify-center shadow-sm">
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
              className={`flex-1 text-[15px] font-semibold transition-colors border-b-[3px] ${active ? 'text-primary border-primary font-bold' : 'text-text-sub border-transparent'}`}
            >
              {labels[key]}
            </button>
          )
        })}
      </div>
    </div>
  )

  const renderBatchBar = () => {
    if (selectedIds.size === 0) return null
    return (
      <div
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[calc(100%-32px)] max-w-[500px] rounded-2xl p-3 flex gap-2 z-[2000] transition-all duration-300"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-default)',
          borderWidth: '1px',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <button
          onClick={handleBatchDownload}
          className="flex-1 h-12 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-colors"
          style={{
            backgroundColor: 'var(--brand-primary)',
            color: 'var(--text-inverse)',
          }}
        >
          <Download size={20} /> 저장
        </button>
        <button
          onClick={handleBatchShare}
          className="flex-1 h-12 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-colors"
          style={{
            backgroundColor: 'var(--brand-secondary)',
            color: 'var(--text-inverse)',
          }}
        >
          <Share2 size={20} /> 공유
        </button>
        {activeTab !== 'company-docs' && (
          <button
            onClick={handleBatchDelete}
            className="flex-1 h-12 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-colors"
            style={{
              backgroundColor: 'var(--accent-danger)',
              color: 'var(--text-inverse)',
            }}
          >
            <Trash2 size={20} /> 삭제
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
          className={`doc-list-item ${isSelected ? 'selected' : ''}`}
          // Height auto ensures bg fills content, alignment logic handled in inner flex
        >
          <div
            className={`absolute top-0 right-0 px-3 py-1.5 rounded-bl-2xl rounded-tr-xl text-xs font-bold text-white ${isDone ? 'bg-success' : 'bg-danger'}`}
          >
            {isDone ? '완료' : '미조치'}
          </div>
          <div className="flex gap-4 items-start w-full">
            <div className="pt-1" onClick={e => toggleSelection(e, group.id)}>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'bg-white border-slate-300'}`}
              >
                <Check size={14} className="text-white" />
              </div>
            </div>
            <div className="w-20 h-20 rounded-xl bg-slate-100 border border-border overflow-hidden flex-shrink-0">
              {/* Always show an image, fallback to IMG_CONCRETE if missing */}
              <img src={thumbUrl || IMG_CONCRETE} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-sm text-header-navy font-bold mb-1">
                <MapPin size={14} /> {group.punchData?.location}
              </div>
              <div className="text-lg font-bold text-text-main truncate leading-tight mb-2">
                {group.punchData?.issue}
              </div>
              <div className="text-sm font-medium text-text-sub">
                {group.title} <span className="mx-1 text-gray-300">|</span>{' '}
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
        className={`doc-list-item ${isSelected ? 'selected' : ''}`}
      >
        <div className="mt-1" onClick={e => toggleSelection(e, group.id)}>
          <div
            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'bg-white border-slate-300'}`}
          >
            <Check size={16} className="text-white" />
          </div>
        </div>
        <div className="w-16 h-16 rounded-xl bg-slate-100 border border-border overflow-hidden flex-shrink-0 flex items-center justify-center text-slate-400 ml-4">
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
            {group.author} <span className="mx-2 text-gray-300">|</span>{' '}
            {formatDateShort(group.date)} <span className="ml-2 text-gray-400">{group.time}</span>
          </div>
        </div>
        <ChevronRight className="text-gray-300 self-center ml-auto" />
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
      <div className="fixed inset-0 z-50 bg-bg-body flex flex-col animate-in slide-in-from-right duration-200">
        <div className="h-[54px] bg-bg-surface border-b border-border flex items-center justify-between px-4 shrink-0">
          <button onClick={closeDetailView} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-text-main" />
          </button>
          <h2 className="text-lg font-bold truncate flex-1 text-center px-4">
            {isPunch ? currentGroup.title : currentGroup.title}
          </h2>
          <div className="w-16 flex justify-end">
            {isPunch && (
              <button
                onClick={() => setIsReportEditorOpen(true)}
                className="bg-slate-100 text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold"
              >
                보고서
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-32">
          {isPunch && pd && (
            <div
              className={`bg-bg-surface rounded-2xl p-6 shadow-soft mb-6 border ${isPunchEditMode ? 'border-primary' : 'border-transparent'}`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-black text-text-main">펀치 정보</h3>
                {!isPunchEditMode && (
                  <button
                    onClick={() => setIsPunchEditMode(true)}
                    className="bg-header-navy text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1"
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
                      className="w-full h-[50px] px-4 rounded-xl border border-border bg-white text-lg focus:border-primary"
                      defaultValue={pd.location}
                      onChange={e => handlePunchSave({ ...pd, location: e.target.value })}
                    />
                  ) : (
                    <div className="text-lg text-text-main border-b border-gray-100 pb-2">
                      {pd.location}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-1">
                  <label className="text-sm font-bold text-text-sub">문제점</label>
                  {isPunchEditMode ? (
                    <textarea
                      className="w-full h-[80px] p-4 rounded-xl border border-border bg-white text-lg focus:border-primary resize-none"
                      defaultValue={pd.issue}
                      onChange={e => handlePunchSave({ ...pd, issue: e.target.value })}
                    />
                  ) : (
                    <div className="text-lg text-text-main border-b border-gray-100 pb-2">
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
                          className="form-select"
                          defaultValue={pd.status}
                          onChange={e => handlePunchSave({ ...pd, status: e.target.value as any })}
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
                          className="form-select"
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
                          className={`punch-photo-compact ${imgBefore ? 'filled' : ''}`}
                          onClick={() => document.getElementById('upload-before')?.click()}
                        >
                          {imgBefore ? <img src={imgBefore} /> : <Camera size={24} />}
                          {!imgBefore && <span className="text-xs font-bold mt-1">보수 전</span>}
                          {imgBefore && <div className="punch-photo-label">보수 전</div>}
                          <input
                            id="upload-before"
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={e =>
                              e.target.files && handlePunchPhotoUpdate(e.target.files[0], 'before')
                            }
                          />
                        </div>
                        <div
                          className={`punch-photo-compact ${imgAfter ? 'filled' : ''}`}
                          onClick={() => document.getElementById('upload-after')?.click()}
                        >
                          {imgAfter ? <img src={imgAfter} /> : <Camera size={24} />}
                          {!imgAfter && <span className="text-xs font-bold mt-1">보수 후</span>}
                          {imgAfter && (
                            <div className="punch-photo-label bg-green-600/80">보수 후</div>
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

                    <div className="flex gap-3 mt-6 pt-4 border-t border-border">
                      <button
                        onClick={() => setIsPunchEditMode(false)}
                        className="flex-1 h-12 rounded-xl border border-border text-text-sub font-bold text-lg bg-white"
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
                <h3 className="text-lg font-bold text-text-main">
                  {isPunch ? '보수 전/후 사진' : '첨부 파일'}
                </h3>
                {currentGroup.files.length > 0 && activeTab !== 'company-docs' && (
                  <button
                    onClick={handleSelectAll}
                    className="text-sm font-bold text-text-sub flex items-center gap-1"
                  >
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center ${allSelected ? 'bg-primary border-primary' : 'border-gray-400'}`}
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
                    className="aspect-[1/1.2] rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center text-primary cursor-pointer active:bg-gray-50"
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
                  let clickAction = () => {}

                  if (activeTab === 'photos' && isImg) {
                    displayUrl =
                      file.currentView === 'after' ? file.url_after || file.url : file.url_before!
                    badge = (
                      <span
                        className={`absolute bottom-2 right-2 text-white text-xs font-bold px-2 py-1 rounded ${file.currentView === 'after' ? 'bg-success' : 'bg-gray-700'}`}
                      >
                        {file.currentView === 'after' ? '보수후' : '보수전'}
                      </span>
                    )
                    clickAction = () => handlePhotoToggle(file.id)
                  } else if (activeTab === 'drawings') {
                    badge = (
                      <span
                        className={`absolute bottom-2 right-2 text-white text-xs font-bold px-2 py-1 rounded ${file.drawingState === 'done' ? 'bg-header-navy' : 'bg-primary'}`}
                      >
                        {file.drawingState === 'done' ? '완료도면' : '진행도면'}
                      </span>
                    )
                    clickAction = () => handleDrawingToggle(file.id)
                  } else if (isPunch) {
                    if (file.currentView === 'after' && file.url_after) {
                      displayUrl = file.url_after
                      badge = (
                        <span className="absolute bottom-2 right-2 bg-success text-white text-xs font-bold px-2 py-1 rounded">
                          보수후
                        </span>
                      )
                    } else if (file.url_before) {
                      displayUrl = file.url_before
                      badge = (
                        <span className="absolute bottom-2 right-2 bg-gray-700 text-white text-xs font-bold px-2 py-1 rounded">
                          보수전
                        </span>
                      )
                    }
                  }

                  const isSel = selectedIds.has(file.id)
                  const isHovered = hoveredFileId === file.id
                  const showOverlay = isHovered || isSel

                  // Debug: Log hover state
                  if (isHovered) {
                    console.log('Hovering over file:', file.id, 'showOverlay:', showOverlay)
                  }

                  return (
                    <div
                      key={file.id}
                      className={`aspect-[1/1.2] bg-bg-surface rounded-2xl shadow-soft relative border-2 ${isSel ? 'border-primary' : 'border-transparent'} group`}
                      onMouseEnter={() => setHoveredFileId(file.id)}
                      onMouseLeave={() => setHoveredFileId(null)}
                      onClick={activeTab === 'punch' ? undefined : clickAction}
                    >
                      {/* Checkbox - always visible in top-right */}
                      <div
                        className="absolute top-3 right-3 z-20 w-8 h-8"
                        onClick={e => toggleSelection(e, file.id)}
                      >
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ml-auto ${isSel ? 'bg-primary border-primary' : 'bg-white/80 border-gray-300'}`}
                        >
                          {isSel && <Check size={14} className="text-white" />}
                        </div>
                      </div>

                      {/* Image/Content Area */}
                      <div className="w-full h-[75%] bg-slate-100 flex items-center justify-center overflow-hidden relative">
                        {isImg ? (
                          <img
                            src={displayUrl}
                            className="w-full h-full object-cover"
                            alt={file.name}
                          />
                        ) : (
                          <FileText size={40} className="text-slate-400" />
                        )}
                        {badge}
                      </div>

                      {/* Hover Overlay with Action Buttons - moved outside to avoid overflow:hidden */}
                      {/* Temporarily enabled for all tabs to debug */}
                      <div
                        className={`absolute inset-0 bg-black/50 flex items-center justify-center gap-3 transition-all duration-300 z-10 ${
                          showOverlay ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`}
                        style={{ top: '0', height: '75%' }}
                        onClick={e => e.stopPropagation()}
                      >
                        <div
                          className={`flex gap-3 transition-all duration-300 ${
                            showOverlay ? 'translate-y-0' : 'translate-y-4'
                          }`}
                        >
                          {/* Preview Button */}
                          {isImg && (
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                window.open(displayUrl, '_blank')
                              }}
                              className="w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-700 hover:bg-white transition-all hover:scale-110"
                              title="미리보기"
                            >
                              <Eye size={20} />
                            </button>
                          )}

                          {/* Edit/Replace Button */}
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              triggerFileReplace(file.id)
                            }}
                            className="w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-700 hover:bg-white transition-all hover:scale-110"
                            title="수정"
                          >
                            <RefreshCw size={18} />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              if (confirm('이 파일을 삭제하시겠습니까?')) {
                                setDocuments(prev => {
                                  const next = { ...prev }
                                  next[activeTab] = next[activeTab].map(g => {
                                    if (g.id !== selectedGroupId) return g
                                    return { ...g, files: g.files.filter(f => f.id !== file.id) }
                                  })
                                  return next
                                })
                                selectedIds.delete(file.id)
                                setSelectedIds(new Set(selectedIds))
                              }
                            }}
                            className="w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-red-600 hover:bg-white transition-all hover:scale-110"
                            title="삭제"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      {/* File Info Area */}
                      <div className="h-[25%] p-2 flex flex-col justify-center items-center text-center bg-white border-t border-gray-100">
                        <div className="text-xs font-bold text-text-sub truncate w-full">
                          {file.name}
                        </div>
                        <div className="text-[10px] text-gray-400">{file.size}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        <input type="file" id="replace-file-input" hidden onChange={handleSingleFileReplace} />
      </div>
    )
  }

  return (
    <MainLayout title="INOPNC" currentApp="doc">
      <div className="w-full min-h-screen pt-[54px] bg-bg-body">
        {renderTabBar()}

        <div className="w-full max-w-[600px] mx-auto p-4 min-h-[calc(100vh-54px)]">
          {activeTab === 'punch' && (
            <div className="mb-4">
              <select
                className="form-select"
                value={siteFilter}
                onChange={e => setSiteFilter(e.target.value)}
              >
                <option value="">전체 현장</option>
                {uniqueSites.map(site => (
                  <option key={site} value={site}>
                    {site}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="local-search-wrapper relative mb-6">
            <input
              className="search-input-local"
              placeholder={activeTab === 'punch' ? '위치 또는 내용 검색...' : '문서명 검색...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <div
              className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-opacity ${searchQuery ? 'opacity-0' : 'opacity-100'}`}
            >
              <Search size={20} />
            </div>
            {searchQuery && (
              <button className="btn-local-clear show" onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>

          {activeTab === 'punch' && renderPunchSummary()}

          <div className="pb-[120px]">
            {filteredDocs.length > 0 ? (
              filteredDocs.map(renderListItem)
            ) : (
              <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center mb-4">
                  <Search size={32} className="text-slate-400" />
                </div>
                <p className="text-lg font-bold text-slate-400">검색 결과가 없습니다.</p>
              </div>
            )}
          </div>
        </div>

        {activeTab !== 'company-docs' && (
          <button
            onClick={() => setIsUploadSheetOpen(true)}
            className="fixed bottom-8 right-6 w-16 h-16 rounded-full bg-header-navy text-white shadow-lg flex items-center justify-center active:scale-90 transition-transform z-30"
          >
            <Plus size={32} />
          </button>
        )}

        {selectedGroupId && renderDetailView()}

        {isReportEditorOpen && selectedGroupId && (
          <ReportEditor
            items={documents['punch']}
            siteName="송파 B현장"
            onClose={() => setIsReportEditorOpen(false)}
            onUpdateStatus={handleReportUpdateStatus}
            onUpdateImage={handleReportUpdateImage}
          />
        )}

        {renderBatchBar()}

        {/* Theme Toggle Button */}
        <button
          onClick={() => themeManager.toggleTheme()}
          className="fixed top-4 right-4 w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center z-[2500] transition-all hover:scale-110"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-default)',
            borderWidth: '1px',
            color: 'var(--text-primary)',
          }}
          title={currentTheme === 'light' ? '다크모드로 전환' : '라이트모드로 전환'}
        >
          {currentTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {/* Action Sheet (Bottom Sheet) */}
        {isUploadSheetOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-[2100]"
              onClick={() => setIsUploadSheetOpen(false)}
            ></div>
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] bg-white z-[2200] rounded-t-3xl p-6 animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-text-main">자료 등록</h3>
                <button onClick={() => setIsUploadSheetOpen(false)}>
                  <X className="text-text-main" />
                </button>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-bold text-text-sub mb-2">
                  {activeTab === 'punch' ? '현장명' : '문서명'}
                </label>
                {activeTab === 'punch' ? (
                  <select
                    className="form-select"
                    value={uploadTitle}
                    onChange={e => setUploadTitle(e.target.value)}
                  >
                    <option value="">현장을 선택하세요</option>
                    {uniqueSites.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="w-full h-14 px-4 rounded-xl border border-border bg-white text-lg focus:border-primary outline-none"
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
                    className="w-full h-14 px-4 rounded-xl border border-border bg-white text-lg focus:border-primary outline-none"
                    value={uploadDate}
                    onChange={e => setUploadDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-bold text-text-sub mb-2">파일 첨부</label>
                <div
                  className="w-full h-16 border border-border rounded-xl flex items-center justify-center gap-2 cursor-pointer bg-bg-body active:bg-gray-200 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud className="text-text-sub" />
                  <span className="font-bold text-text-sub">파일 선택 (다중 가능)</span>
                  <input type="file" multiple hidden ref={fileInputRef} />
                </div>
              </div>

              <button
                onClick={performUpload}
                className="w-full h-16 bg-header-navy text-white text-lg font-bold rounded-2xl shadow-lg active:scale-[0.98] transition-transform"
              >
                등록하기
              </button>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}

export default App
