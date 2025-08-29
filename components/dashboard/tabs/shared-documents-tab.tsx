'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { 
  Upload, File, Folder, Search, Filter, Download, Eye, 
  Share2, MoreHorizontal, FolderOpen, FileText, Image, 
  Archive, Grid, List, ChevronRight, ChevronDown, ChevronUp, Plus,
  Users, Clock, Star, Bell, Activity, Shield, Lock,
  AlertCircle, CheckCircle, Settings, History, X, Pen, Trash2,
  Mail, MessageSquare, Link2, AlertTriangle, RefreshCw, WifiOff
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/custom-select'
import { useRouter } from 'next/navigation'
import ShareDialog from '@/components/documents/share-dialog'

interface SharedDocumentsTabProps {
  profile: Profile
  initialSearch?: string
}

interface SharedDocument {
  id: string
  name: string
  type: string
  size: number
  category: string
  uploadedAt: string
  uploadedBy: string
  lastModified: string
  version: number
  permissions: 'read' | 'write' | 'admin'
  isStarred: boolean
  url?: string
  thumbnail?: string
  sharedWith: string[]
  versionHistory: DocumentVersion[]
  site_id?: string
  site_name?: string
}

interface DocumentVersion {
  version: number
  uploadedAt: string
  uploadedBy: string
  changes: string
  size: number
}

interface DocumentCategory {
  id: string
  name: string
  icon: any
  description: string
  count: number
  permissions: {
    view: string[]
    upload: string[]
  }
}

interface ActivityItem {
  id: string
  type: 'upload' | 'update' | 'share' | 'download' | 'delete'
  documentName: string
  userName: string
  timestamp: string
  details: string
}

const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  {
    id: 'safety',
    name: '안전관리문서',
    icon: Shield,
    description: '안전 교육, 점검표, 사고 보고서',
    count: 0,
    permissions: {
      view: ['worker', 'site_manager', 'admin', 'system_admin'],
      upload: ['admin', 'system_admin']
    }
  },
  {
    id: 'construction-standards',
    name: '시공기준문서',
    icon: FileText,
    description: '시공 표준, 품질 기준, 기술 지침',
    count: 0,
    permissions: {
      view: ['worker', 'site_manager', 'admin', 'system_admin'],
      upload: ['site_manager', 'admin', 'system_admin']
    }
  },
  {
    id: 'company-regulations',
    name: '사규집',
    icon: Archive,
    description: '회사 규정, 정책, 절차서',
    count: 0,
    permissions: {
      view: ['worker', 'site_manager', 'customer_manager', 'admin', 'system_admin'],
      upload: ['admin', 'system_admin']
    }
  },
  {
    id: 'education',
    name: '교육자료',
    icon: CheckCircle,
    description: '교육 과정, 매뉴얼, 가이드',
    count: 0,
    permissions: {
      view: ['worker', 'site_manager', 'customer_manager', 'admin', 'system_admin'],
      upload: ['admin', 'system_admin', 'trainer']
    }
  },
  {
    id: 'drawings',
    name: '도면',
    icon: Image,
    description: '설계 도면, 시공 도면, 상세도',
    count: 0,
    permissions: {
      view: ['site_manager', 'admin', 'system_admin'],
      upload: ['site_manager', 'admin', 'system_admin']
    }
  }
]

export default function SharedDocumentsTab({ profile, initialSearch }: SharedDocumentsTabProps) {
  const [documents, setDocuments] = useState<SharedDocument[]>([])
  const [categories, setCategories] = useState<DocumentCategory[]>(DOCUMENT_CATEGORIES)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState(initialSearch || '')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [loading, setLoading] = useState(true)
  const [selectedDocument, setSelectedDocument] = useState<SharedDocument | null>(null)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showActivityLog, setShowActivityLog] = useState(false)
  const [activityLog, setActivityLog] = useState<ActivityItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<any[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [showShareModal, setShowShareModal] = useState(false)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [documentToShare, setDocumentToShare] = useState<SharedDocument | null>(null)

  // 현장 목록 state
  const [sites, setSites] = useState<Array<{id: string, name: string}>>([
    { id: 'all', name: '전체 현장' }
  ])

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadSites()
    loadDocuments()
    loadActivityLog()
  }, [])

  const loadSites = async () => {
    try {
      const response = await fetch('/api/sites')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setSites(result.data)
        }
      }
    } catch (error) {
      console.error('Error loading sites:', error)
      // Keep default fallback sites
    }
  }

  const loadDocuments = async () => {
    setLoading(true)
    try {
      // Mock data for demo - in real implementation, this would fetch from Supabase
      const mockDocuments: SharedDocument[] = [
        {
          id: '1',
          name: '안전관리지침_2024.pdf',
          type: 'application/pdf',
          size: 3145728, // 3MB
          category: 'safety',
          uploadedAt: '2024-08-01T09:00:00Z',
          uploadedBy: '안전관리자',
          lastModified: '2024-08-01T09:00:00Z',
          version: 2,
          permissions: 'read',
          isStarred: true,
          sharedWith: ['전체 사용자'],
          site_id: 'site1',
          site_name: '서울 아파트 신축공사',
          versionHistory: [
            {
              version: 2,
              uploadedAt: '2024-08-01T09:00:00Z',
              uploadedBy: '안전관리자',
              changes: '여름철 안전 수칙 추가',
              size: 3145728
            },
            {
              version: 1,
              uploadedAt: '2024-06-01T09:00:00Z',
              uploadedBy: '안전관리자',
              changes: '초기 업로드',
              size: 2097152
            }
          ]
        },
        {
          id: '2',
          name: '콘크리트 시공기준_KCS.pdf',
          type: 'application/pdf',
          size: 5242880, // 5MB
          category: 'construction-standards',
          uploadedAt: '2024-07-30T14:30:00Z',
          uploadedBy: '기술팀장',
          lastModified: '2024-07-30T14:30:00Z',
          version: 1,
          permissions: 'read',
          isStarred: false,
          sharedWith: ['작업자', '현장관리자'],
          site_id: 'site2',
          site_name: '부산 오피스텔 건설',
          versionHistory: [
            {
              version: 1,
              uploadedAt: '2024-07-30T14:30:00Z',
              uploadedBy: '기술팀장',
              changes: '2024년 개정판 업로드',
              size: 5242880
            }
          ]
        },
        {
          id: '3',
          name: '인사규정_개정판.docx',
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 1048576, // 1MB
          category: 'company-regulations',
          uploadedAt: '2024-07-25T10:00:00Z',
          uploadedBy: '인사팀',
          lastModified: '2024-07-28T15:30:00Z',
          version: 3,
          permissions: 'read',
          isStarred: false,
          sharedWith: ['전체 사용자'],
          site_id: 'all',
          site_name: '전체 현장',
          versionHistory: [
            {
              version: 3,
              uploadedAt: '2024-07-28T15:30:00Z',
              uploadedBy: '인사팀',
              changes: '휴가 규정 수정',
              size: 1048576
            },
            {
              version: 2,
              uploadedAt: '2024-07-26T10:00:00Z',
              uploadedBy: '인사팀',
              changes: '복리후생 항목 추가',
              size: 1024000
            }
          ]
        },
        {
          id: '4',
          name: '신입사원 교육과정.pptx',
          type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          size: 10485760, // 10MB
          category: 'education',
          uploadedAt: '2024-07-20T11:00:00Z',
          uploadedBy: '교육담당자',
          lastModified: '2024-07-20T11:00:00Z',
          version: 1,
          permissions: 'read',
          isStarred: true,
          sharedWith: ['작업자', '현장관리자'],
          site_id: 'site3',
          site_name: '대구 상가 리모델링',
          versionHistory: [
            {
              version: 1,
              uploadedAt: '2024-07-20T11:00:00Z',
              uploadedBy: '교육담당자',
              changes: '2024년 교육과정 제작',
              size: 10485760
            }
          ]
        },
        {
          id: '5',
          name: '현장 안전점검표_인천공장.xlsx',
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          size: 2097152, // 2MB
          category: 'safety',
          uploadedAt: '2024-07-15T08:00:00Z',
          uploadedBy: '현장안전관리자',
          lastModified: '2024-07-15T08:00:00Z',
          version: 1,
          permissions: 'read',
          isStarred: false,
          sharedWith: ['현장관리자'],
          site_id: 'site4',
          site_name: '인천 공장 신축',
          versionHistory: [
            {
              version: 1,
              uploadedAt: '2024-07-15T08:00:00Z',
              uploadedBy: '현장안전관리자',
              changes: '인천공장 전용 안전점검표',
              size: 2097152
            }
          ]
        }
      ]

      // Filter documents based on user role permissions
      const accessibleDocuments = mockDocuments.filter(doc => {
        const category = categories.find(cat => cat.id === doc.category)
        return category?.permissions.view.includes(profile.role) || false
      })

      setDocuments(accessibleDocuments)
      
      // Update category counts
      const updatedCategories = categories.map(category => ({
        ...category,
        count: accessibleDocuments.filter(doc => doc.category === category.id).length
      }))
      setCategories(updatedCategories)
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadActivityLog = async () => {
    try {
      // Mock activity log data
      const mockActivity: ActivityItem[] = [
        {
          id: '1',
          type: 'upload',
          documentName: '안전관리지침_2024.pdf',
          userName: '안전관리자',
          timestamp: '2024-08-01T09:00:00Z',
          details: '새 버전 업로드 (v2)'
        },
        {
          id: '2',
          type: 'download',
          documentName: '콘크리트 시공기준_KCS.pdf',
          userName: profile.full_name,
          timestamp: '2024-07-31T14:30:00Z',
          details: '문서 다운로드'
        },
        {
          id: '3',
          type: 'share',
          documentName: '인사규정_개정판.docx',
          userName: '인사팀',
          timestamp: '2024-07-28T15:30:00Z',
          details: '전체 사용자와 공유'
        },
        {
          id: '4',
          type: 'update',
          documentName: '신입사원 교육과정.pptx',
          userName: '교육담당자',
          timestamp: '2024-07-20T11:00:00Z',
          details: '즐겨찾기에 추가'
        }
      ]
      setActivityLog(mockActivity)
    } catch (error) {
      console.error('Error loading activity log:', error)
    }
  }

  const filteredAndSortedDocuments = documents
    .filter(doc => {
      const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory
      const matchesSite = selectedSite === 'all' || doc.site_id === selectedSite || doc.site_id === 'all'
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesCategory && matchesSite && matchesSearch
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'date':
          comparison = new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime()
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFileIcon = (type: string) => {
    if (type === 'markup-document') return FileText
    if (type.startsWith('image/')) return Image
    if (type.includes('pdf')) return FileText
    if (type.includes('word')) return FileText
    if (type.includes('excel')) return FileText
    return File
  }

  const getFileTypeDisplay = (type: string) => {
    if (type === 'markup-document') return '도면'
    if (type.includes('pdf')) return 'PDF'
    if (type.includes('word') || type.includes('presentation')) return 'DOC'
    if (type.includes('excel')) return 'XLS'
    if (type.startsWith('image/')) return 'IMG'
    return 'FILE'
  }
  
  const getFileTypeColor = (type: string) => {
    if (type === 'markup-document') return 'bg-purple-100 text-purple-700 border-purple-200'
    if (type.includes('pdf')) return 'bg-red-100 text-red-700 border-red-200'
    if (type.includes('word') || type.includes('presentation')) return 'bg-blue-100 text-blue-700 border-blue-200'
    if (type.includes('excel')) return 'bg-green-100 text-green-700 border-green-200'
    if (type.startsWith('image/')) return 'bg-orange-100 text-orange-700 border-orange-200'
    return 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload': return Upload
      case 'update': return Settings
      case 'share': return Share2
      case 'download': return Download
      case 'delete': return AlertCircle
      default: return Activity
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'upload': return 'text-green-600'
      case 'update': return 'text-blue-600'
      case 'share': return 'text-purple-600'
      case 'download': return 'text-orange-600'
      case 'delete': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const toggleStar = (documentId: string) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, isStarred: !doc.isStarred }
          : doc
      )
    )
  }

  const handleViewDocument = (document: SharedDocument) => {
    if (document.type === 'markup-document') {
      router.push(`/dashboard/markup?open=${document.id}`)
    } else if (document.url) {
      window.open(document.url, '_blank')
    }
  }

  const handleDownloadDocument = async (document: SharedDocument) => {
    try {
      if (document.type === 'markup-document') {
        alert('마킹 도면 다운로드 기능은 준비 중입니다.')
        return
      }

      if (document.url) {
        const link = window.document.createElement('a')
        link.href = document.url
        link.download = document.name
        link.style.display = 'none'
        window.document.body.appendChild(link)
        link.click()
        window.document.body.removeChild(link)
      } else {
        alert('다운로드할 수 있는 파일이 없습니다.')
      }
    } catch (error) {
      console.error('Download failed:', error)
      alert('다운로드 중 오류가 발생했습니다.')
    }
  }

  const deleteDocument = async (documentId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    
    setDocuments(prev => prev.filter(d => d.id !== documentId))
  }

  const handleShareDocument = (document: SharedDocument) => {
    setDocumentToShare(document)
    setShareDialogOpen(true)
  }

  const generateShareUrl = (document: SharedDocument) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/dashboard/documents/shared/${document.id}?token=${generateShareToken(document.id)}`
  }

  const generateShareToken = (documentId: string) => {
    // Generate a simple share token (in production, this should be more secure)
    return btoa(`${documentId}-${Date.now()}`).substring(0, 16)
  }

  const canUpload = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category?.permissions.upload.includes(profile.role) || false
  }

  const getPermissionBadge = (permission: string) => {
    switch (permission) {
      case 'read':
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">읽기</span>
      case 'write':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">편집</span>
      case 'admin':
        return <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">관리</span>
      default:
        return null
    }
  }

  // File upload constants and handlers
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const MAX_FILE_SIZE_MB = 10
  const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return '지원하지 않는 파일 형식입니다.'
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `파일 크기가 ${MAX_FILE_SIZE_MB}MB를 초과합니다.`
    }
    return null
  }

  const uploadFile = async (file: File, category: string = 'misc') => {
    const validation = validateFile(file)
    if (validation) {
      setUploadProgress(prev => [...prev, {
        fileName: file.name,
        progress: 0,
        status: 'error',
        error: validation
      }])
      return
    }

    const progressItem = {
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    }
    
    setUploadProgress(prev => [...prev, progressItem])

    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        setUploadProgress(prev => 
          prev.map(item => 
            item.fileName === file.name 
              ? { ...item, progress }
              : item
          )
        )
      }

      // Mock successful upload
      const newDocument: SharedDocument = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        size: file.size,
        category: category,
        uploadedAt: new Date().toISOString(),
        uploadedBy: profile.full_name,
        lastModified: new Date().toISOString(),
        version: 1,
        permissions: 'admin',
        isStarred: false,
        sharedWith: ['전체 사용자'],
        versionHistory: [{
          version: 1,
          uploadedAt: new Date().toISOString(),
          uploadedBy: profile.full_name,
          changes: '초기 업로드',
          size: file.size
        }]
      }

      setDocuments(prev => [newDocument, ...prev])

      setUploadProgress(prev => 
        prev.map(item => 
          item.fileName === file.name 
            ? { ...item, progress: 100, status: 'completed' }
            : item
        )
      )

      // Remove completed upload after 3 seconds
      setTimeout(() => {
        setUploadProgress(prev => prev.filter(item => item.fileName !== file.name))
      }, 3000)

    } catch (error) {
      setUploadProgress(prev => 
        prev.map(item => 
          item.fileName === file.name 
            ? { ...item, status: 'error', error: '업로드 실패' }
            : item
        )
      )
    }
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return
    
    setUploading(true)
    Array.from(files).forEach(file => {
      uploadFile(file, selectedCategory === 'all' ? 'misc' : selectedCategory)
    })
    setUploading(false)
  }


  const isBlueprint = (document: SharedDocument) => {
    const blueprintExtensions = ['.dwg', '.dxf', '.pdf']
    const extension = document.name.toLowerCase().substr(document.name.lastIndexOf('.'))
    return document.category === 'drawings' || blueprintExtensions.includes(extension)
  }

  // 문서 선택 토글
  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    )
  }

  // 선택된 문서 공유 함수
  const handleShare = (method: 'sms' | 'email' | 'kakao' | 'link') => {
    if (selectedDocuments.length === 0) {
      alert('공유할 문서를 선택해주세요.')
      return
    }

    const selectedDocs = documents.filter(doc => selectedDocuments.includes(doc.id))
    const shareText = `선택한 문서 ${selectedDocs.length}개:\n${selectedDocs.map(doc => doc.name).join('\n')}`

    switch (method) {
      case 'sms':
        window.location.href = `sms:?body=${encodeURIComponent(shareText)}`
        break
      case 'email':
        window.location.href = `mailto:?subject=문서 공유&body=${encodeURIComponent(shareText)}`
        break
      case 'kakao':
        // 카카오톡 공유 API 연동 필요
        alert('카카오톡 공유 기능은 준비 중입니다.')
        break
      case 'link':
        // 공유 링크 생성 로직
        navigator.clipboard.writeText(shareText)
        alert('링크가 클립보드에 복사되었습니다.')
        break
    }
    setShowShareModal(false)
    setIsSelectionMode(false)
    setSelectedDocuments([])
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-sm text-gray-500 dark:text-gray-400">공유문서를 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header - Compact Design */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-medium text-gray-700 dark:text-gray-300">공유문서함</h2>
            {isSelectionMode && (
              <span className="text-xs text-blue-600 dark:text-blue-400">
                {selectedDocuments.length}개 선택됨
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isSelectionMode ? (
              <>
                <button
                  onClick={() => {
                    setIsSelectionMode(false)
                    setSelectedDocuments([])
                  }}
                  className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  취소
                </button>
                <button
                  onClick={() => setShowShareModal(true)}
                  disabled={selectedDocuments.length === 0}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-medium rounded-md transition-colors"
                >
                  <Share2 className="h-3 w-3" />
                  공유
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsSelectionMode(true)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md"
                >
                  <CheckCircle className="h-3 w-3" />
                  선택
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors touch-manipulation"
                >
                  <Upload className="h-3 w-3" />
                  업로드
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search and Filters - Compact Design */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1.5 h-3 w-3 text-gray-400" />
            <input
              type="text"
              placeholder="파일명 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {/* 현장 필터 */}
            <Select value={selectedSite} onValueChange={setSelectedSite}>
              <SelectTrigger className="w-[100px] h-7 px-2 py-1 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                <SelectValue placeholder="현장" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
                {sites.map(site => (
                  <SelectItem 
                    key={site.id} 
                    value={site.id}
                    className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:text-blue-600 dark:focus:text-blue-400 cursor-pointer"
                  >
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
              <button
                onClick={() => setSortBy('date')}
                className={`px-2 py-1 text-xs font-medium transition-colors ${
                  sortBy === 'date' 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                날짜
              </button>
              <button
                onClick={() => setSortBy('name')}
                className={`px-2 py-1 text-xs font-medium transition-colors ${
                  sortBy === 'name' 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                이름
              </button>
            </div>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-1 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              title={sortOrder === 'asc' ? '오름차순' : '내림차순'}
            >
              <ChevronUp className={`h-3 w-3 transition-transform text-gray-700 dark:text-gray-300 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
            </button>
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
                title="리스트 보기"
              >
                <List className="h-3 w-3" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
                title="그리드 보기"
              >
                <Grid className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        {/* Upload Progress - Compact */}
        {uploadProgress.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mb-3">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">업로드 진행</h4>
            <div className="space-y-1">
              {uploadProgress.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1 mr-2">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {item.fileName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {item.status === 'completed' ? '완료' : 
                         item.status === 'error' ? '실패' : 
                         `${item.progress}%`}
                      </span>
                    </div>
                    {item.status === 'uploading' && (
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-0.5">
                        <div
                          className="bg-blue-500 h-0.5 rounded-full transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                    {item.error && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{item.error}</p>
                    )}
                  </div>
                  {item.status === 'completed' && <CheckCircle className="h-3 w-3 text-green-500" />}
                  {item.status === 'error' && <X className="h-3 w-3 text-red-500" />}
                </div>
              ))}
            </div>
          </div>
        )}

          {/* Documents Grid/List - Compact */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {filteredAndSortedDocuments.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Folder className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">문서가 없습니다</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm ? '검색 조건에 맞는 문서가 없습니다.' : '아직 공유된 문서가 없습니다.'}
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                {filteredAndSortedDocuments.map((document: any) => {
                  return (
                    <div
                      key={document.id}
                      className={`relative border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
                        isSelectionMode && selectedDocuments.includes(document.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600'
                      }`}
                      onClick={() => isSelectionMode && toggleDocumentSelection(document.id)}
                    >
                      {/* Selection Checkbox */}
                      {isSelectionMode && (
                        <div className="absolute top-2 left-2">
                          <input
                            type="checkbox"
                            checked={selectedDocuments.includes(document.id)}
                            onChange={() => toggleDocumentSelection(document.id)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                      
                      <div className="flex flex-col items-center text-center">
                        {/* File Type Badge */}
                        <div className="mb-3">
                          <span className={`inline-block px-1.5 py-0.5 text-xs font-medium rounded-md ${getFileTypeColor(document.type)}`}>
                            {getFileTypeDisplay(document.type)}
                          </span>
                        </div>
                        
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-2">
                          {document.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {formatFileSize(document.size)}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                          {formatDate(document.lastModified)}
                        </p>
                        
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleViewDocument(document)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="보기"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadDocument(document)}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="다운로드"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleShareDocument(document)}
                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                            title="공유하기"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteDocument(document.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAndSortedDocuments.map((document: any) => {
                  return (
                    <div
                      key={document.id}
                      className={`bg-white dark:bg-gray-800 border rounded-lg p-3 hover:shadow-md transition-all duration-200 cursor-pointer ${
                        isSelectionMode && selectedDocuments.includes(document.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                      }`}
                      onClick={() => isSelectionMode && toggleDocumentSelection(document.id)}
                    >
                      <div className="flex items-center gap-3">
                        {/* Selection Checkbox */}
                        {isSelectionMode && (
                          <div className="flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={selectedDocuments.includes(document.id)}
                              onChange={() => toggleDocumentSelection(document.id)}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        )}
                        
                        {/* Badge Only */}
                        <div className="flex-shrink-0">
                          <span className={`inline-block px-1.5 py-0.5 text-xs font-medium rounded-md ${getFileTypeColor(document.type)}`}>
                            {getFileTypeDisplay(document.type)}
                          </span>
                        </div>
                        
                        {/* File Info - Simplified Layout */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate mb-1">
                                {document.name}
                              </h4>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(document.lastModified).toLocaleDateString('ko-KR', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                            </div>
                            
                            {/* Action Buttons - Compact */}
                            <div className="flex items-center gap-1 ml-3">
                              <button
                                onClick={() => handleViewDocument(document)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="보기"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDownloadDocument(document)}
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                title="다운로드"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleShareDocument(document)}
                                className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                                title="공유하기"
                              >
                                <Share2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => deleteDocument(document.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="삭제"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
      </div>

      {/* Version History Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  버전 기록 - {selectedDocument.name}
                </h3>
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {selectedDocument.versionHistory.map((version: any) => (
                  <div
                    key={version.version}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          버전 {version.version}
                        </span>
                        {version.version === selectedDocument.version && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">현재</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {version.changes}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>{formatDate(version.uploadedAt)}</span>
                        <span>{version.uploadedBy}</span>
                        <span>{formatFileSize(version.size)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-green-600 transition-colors">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ALLOWED_FILE_TYPES.join(',')}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowShareModal(false)}
            />

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    문서 공유하기
                  </h3>
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  선택한 {selectedDocuments.length}개의 문서를 공유합니다
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleShare('sms')}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <MessageSquare className="h-6 w-6 mb-2 text-gray-600 dark:text-gray-300" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">문자</span>
                  </button>

                  <button
                    onClick={() => handleShare('email')}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Mail className="h-6 w-6 mb-2 text-gray-600 dark:text-gray-300" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">이메일</span>
                  </button>

                  <button
                    onClick={() => handleShare('kakao')}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <MessageSquare className="h-6 w-6 mb-2 text-yellow-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">카카오톡</span>
                  </button>

                  <button
                    onClick={() => handleShare('link')}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Link2 className="h-6 w-6 mb-2 text-gray-600 dark:text-gray-300" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">링크 복사</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Individual Document Share Dialog */}
      {shareDialogOpen && documentToShare && (
        <ShareDialog
          isOpen={shareDialogOpen}
          onClose={() => {
            setShareDialogOpen(false)
            setDocumentToShare(null)
          }}
          document={documentToShare}
          shareUrl={generateShareUrl(documentToShare)}
        />
      )}
    </div>
  )
}