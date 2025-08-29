'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { 
  Upload, Download, Eye, Share2, Trash2,
  Search, Grid, List, ChevronUp, CheckCircle,
  X, Mail, MessageSquare, Link2
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/custom-select'

interface PartnerDocumentsTabProps {
  profile: Profile
  sites: any[]
}

interface Document {
  id: string
  name: string
  type: string // Changed to string to match various file types
  size: number // Changed to number for bytes
  lastModified: string // Changed from uploadDate to match Site Manager
  uploadedBy?: string
  site?: string
  site_id?: string
  document_type?: string // Add document_type from database
}

export default function PartnerDocumentsTab({ profile, sites }: PartnerDocumentsTabProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'shared' | 'billing'>('personal')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const supabase = createClient()
  
  // State for sites
  const [userSites, setUserSites] = useState<any[]>([])

  // Fetch user's sites
  const fetchUserSites = async () => {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching sites:', error)
        return
      }

      setUserSites(data || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  // Fetch documents from database
  const fetchDocuments = async () => {
    try {
      // For customer_manager role, fetch documents from their sites
      // For other roles, fetch their own documents
      let query = supabase
        .from('documents')
        .select(`
          *,
          sites!documents_site_id_fkey(name)
        `)
      
      // Customer managers and partners only see their own documents
      // They don't need to see all documents from their sites
      query = query.eq('owner_id', profile.id)
      
      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching documents:', error)
        return
      }

      console.log('📄 User role:', profile.role)
      console.log('📄 Raw documents from DB:', data?.length || 0, 'documents')
      if (data && data.length > 0) {
        console.log('📄 Sample document:', data[0])
      }

      // Transform database documents to component format
      const transformedDocs = data.map(doc => ({
        id: doc.id,
        name: doc.title || doc.file_name, // Use title or file_name
        type: doc.document_type || getFileTypeFromMimeType(doc.mime_type || ''), // Use document_type from DB
        size: doc.file_size || 0,
        lastModified: new Date(doc.created_at).toLocaleDateString('ko-KR'),
        site: doc.sites?.name || '',
        site_id: doc.site_id,
        document_type: doc.document_type, // Add document_type field
        uploadedBy: doc.owner_id === profile.id ? profile.full_name || profile.email : '타사용자'
      }))

      console.log('📄 Transformed documents:', transformedDocs.length, 'documents')
      console.log('📄 Document types found:', [...new Set(transformedDocs.map(d => d.document_type))])
      
      setDocuments(transformedDocs)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const getFileTypeFromMimeType = (mimeType: string) => {
    if (mimeType.includes('pdf')) return 'pdf'
    if (mimeType.includes('word')) return 'word'
    if (mimeType.includes('excel')) return 'excel'
    if (mimeType.includes('image')) return 'image'
    return 'file'
  }

  useEffect(() => {
    fetchDocuments()
    fetchUserSites()
  }, [profile.id])

  // Mock documents with updated structure to match Site Manager
  const personalDocuments: Document[] = [
    { id: '1', name: '작업계획서_2024.pdf', type: 'application/pdf', size: 2411520, lastModified: '2024-03-18T09:00:00Z' },
    { id: '2', name: '개인메모_현장정리.docx', type: 'application/word', size: 159744, lastModified: '2024-03-17T14:30:00Z' },
    { id: '3', name: '참고자료_안전교육.pdf', type: 'application/pdf', size: 4404224, lastModified: '2024-03-15T11:00:00Z' }
  ]

  const sharedDocuments: Document[] = [
    { id: '4', name: '안전관리계획서_v2.pdf', type: 'application/pdf', size: 3250176, lastModified: '2024-03-18T10:00:00Z', uploadedBy: '김관리', site: '강남 A현장' },
    { id: '5', name: '작업지시서_0318.pdf', type: 'application/pdf', size: 913408, lastModified: '2024-03-17T15:00:00Z', uploadedBy: '이소장', site: '송파 B현장' },
    { id: '6', name: '품질검사보고서.xlsx', type: 'application/excel', size: 1572864, lastModified: '2024-03-16T09:30:00Z', uploadedBy: '박품질', site: '강남 A현장' }
  ]

  const billingDocuments: Document[] = [
    { id: '7', name: '견적서_강남A현장_202403.pdf', type: 'application/pdf', size: 2936012, lastModified: '2024-03-18T08:00:00Z', site: '강남 A현장' },
    { id: '8', name: '계약서_송파B현장.pdf', type: 'application/pdf', size: 5452595, lastModified: '2024-03-15T16:00:00Z', site: '송파 B현장' },
    { id: '9', name: '시공계획서_강남A.pdf', type: 'application/pdf', size: 9122611, lastModified: '2024-03-10T10:00:00Z', site: '강남 A현장' },
    { id: '10', name: '전자세금계산서_202403.pdf', type: 'application/pdf', size: 433152, lastModified: '2024-03-18T13:00:00Z', site: '강남 A현장' },
    { id: '11', name: '사진대지문서_3월.pdf', type: 'application/pdf', size: 12897280, lastModified: '2024-03-17T17:00:00Z', site: '송파 B현장' },
    { id: '12', name: '작업완료확인서_3월2주.pdf', type: 'application/pdf', size: 1153434, lastModified: '2024-03-14T14:00:00Z', site: '강남 A현장' },
    { id: '13', name: '진행도면_v3.pdf', type: 'markup-document', size: 6815744, lastModified: '2024-03-12T11:00:00Z', site: '서초 C현장' }
  ]

  // Helper functions matching Site Manager
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

  // Get filtered documents for display
  const getFilteredDocuments = () => {
    let docs: Document[] = []
    
    // Use real documents from database and filter by tab type
    if (activeTab === 'personal') {
      docs = documents.filter(doc => 
        doc.document_type === 'personal'
      )
    } else if (activeTab === 'shared') {
      docs = documents.filter(doc => 
        doc.document_type === 'shared'
      )
    } else if (activeTab === 'billing') {
      docs = documents.filter(doc => 
        doc.document_type === 'certificate'
      )
    }

    // Filter by site (for shared and billing tabs)
    if (selectedSite !== 'all' && activeTab !== 'personal') {
      docs = docs.filter(doc => doc.site_id === selectedSite)
    }

    // Filter by search term
    if (searchTerm) {
      docs = docs.filter(doc => 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Sort documents
    docs.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.lastModified).getTime()
        const dateB = new Date(b.lastModified).getTime()
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
      } else {
        return sortOrder === 'desc' 
          ? b.name.localeCompare(a.name)
          : a.name.localeCompare(b.name)
      }
    })

    return docs
  }

  const handleViewDocument = (document: Document) => {
    setPreviewDocument(document)
    setShowPreviewModal(true)
  }

  const handleDownloadDocument = async (document: Document) => {
    try {
      // Create a temporary URL for the file (mock implementation)
      // In real implementation, this would be the actual file URL from your server
      const mockFileContent = `Mock content for ${document.name}`
      const blob = new Blob([mockFileContent], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      
      // Create temporary download link
      const link = document.createElement('a')
      link.href = url
      link.download = document.name
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      // Show success message
      alert(`${document.name} 다운로드가 시작되었습니다.`)
    } catch (error) {
      console.error('Download failed:', error)
      alert('다운로드 중 오류가 발생했습니다.')
    }
  }

  const deleteDocument = async (documentId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    
    try {
      // Remove from current documents list
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
      
      // Remove from selected documents if it was selected
      setSelectedDocuments(prev => prev.filter(id => id !== documentId))
      
      // Show success message
      alert('문서가 성공적으로 삭제되었습니다.')
    } catch (error) {
      console.error('Delete failed:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    )
  }

  const handleSelectAll = () => {
    if (selectedDocuments.length === documents.length) {
      setSelectedDocuments([])
    } else {
      setSelectedDocuments(documents.map(doc => doc.id))
    }
  }

  const handleShare = (method: 'sms' | 'email' | 'kakao' | 'link') => {
    if (selectedDocuments.length === 0) {
      alert('공유할 문서를 선택해주세요.')
      return
    }

    const selectedDocs = displayDocuments.filter(doc => selectedDocuments.includes(doc.id))
    const shareText = `선택한 문서 ${selectedDocs.length}개:\n${selectedDocs.map(doc => doc.name).join('\n')}`

    try {
      switch (method) {
        case 'sms':
          window.location.href = `sms:?body=${encodeURIComponent(shareText)}`
          break
        case 'email':
          window.location.href = `mailto:?subject=문서 공유&body=${encodeURIComponent(shareText)}`
          break
        case 'kakao':
          alert('카카오톡 공유 기능은 준비 중입니다.')
          break
        case 'link':
          navigator.clipboard.writeText(shareText)
          alert('링크가 클립보드에 복사되었습니다.')
          break
      }
      // Show success message for methods other than link (which has its own message)
      if (method !== 'link' && method !== 'kakao') {
        alert(`${selectedDocs.length}개 문서를 ${method === 'sms' ? '문자' : '이메일'}로 공유합니다.`)
      }
    } catch (error) {
      console.error('Share failed:', error)
      alert('공유 중 오류가 발생했습니다.')
    }
    
    setShowShareModal(false)
    setIsSelectionMode(false)
    setSelectedDocuments([])
  }

  // Get the filtered documents list for rendering
  const displayDocuments = getFilteredDocuments()

  // File upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    try {
      const uploadedFiles: Document[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Validate file size (max 100MB)
        if (file.size > 100 * 1024 * 1024) {
          alert(`${file.name}: 파일 크기가 100MB를 초과합니다.`)
          continue
        }

        // Create new document object
        const newDocument: Document = {
          id: `upload_${Date.now()}_${i}`,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          lastModified: new Date().toISOString(),
          uploadedBy: profile?.name || '나',
          site: activeTab === 'personal' ? undefined : sites.find(s => s.name === selectedSite)?.name || '내 현장'
        }

        uploadedFiles.push(newDocument)
      }

      if (uploadedFiles.length > 0) {
        // Add uploaded files to the appropriate document list
        switch (activeTab) {
          case 'personal':
            personalDocuments.unshift(...uploadedFiles)
            break
          case 'shared':
            sharedDocuments.unshift(...uploadedFiles)
            break
          case 'billing':
            billingDocuments.unshift(...uploadedFiles)
            break
        }

        // Update current documents view
        setDocuments(prev => [...uploadedFiles, ...prev])
        
        // Show success message
        alert(`${uploadedFiles.length}개 파일이 성공적으로 업로드되었습니다.`)
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    // Create a synthetic event for handleFileUpload
    const syntheticEvent = {
      target: { files: files as any }
    } as React.ChangeEvent<HTMLInputElement>

    await handleFileUpload(syntheticEvent)
  }

  return (
    <div className="space-y-4">
      {/* Tab Selection - Button style matching Site Manager */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('personal')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'personal' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          내문서함
        </button>
        <button
          onClick={() => setActiveTab('shared')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'shared' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          공유문서함
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'billing' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          기성청구함
        </button>
      </div>

      {/* Header - Compact Design matching Site Manager */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {activeTab === 'personal' ? '내문서함' : activeTab === 'shared' ? '공유문서함' : '기성청구함'}
            </h2>
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
                  disabled={isUploading}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-xs font-medium rounded-md transition-colors touch-manipulation"
                >
                  <Upload className={`h-3 w-3 ${isUploading ? 'animate-spin' : ''}`} />
                  {isUploading ? '업로드중...' : '업로드'}
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
            {/* Site Filter */}
            {activeTab !== 'personal' && (
              <Select value={selectedSite} onValueChange={setSelectedSite}>
                <SelectTrigger className="w-[100px] h-7 px-2 py-1 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                  <SelectValue placeholder="현장" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
                  <SelectItem 
                    value="all"
                    className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:text-blue-600 dark:focus:text-blue-400 cursor-pointer"
                  >
                    전체 현장
                  </SelectItem>
                  {userSites.map(site => (
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
            )}
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
        {/* Documents Grid/List - Compact matching Site Manager */}
        <div 
          className={`relative bg-white dark:bg-gray-800 rounded-lg border overflow-hidden transition-colors ${
            isDragActive 
              ? 'border-blue-400 border-2 border-dashed bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-200 dark:border-gray-700'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Drag Active Overlay */}
          {isDragActive && (
            <div className="absolute inset-0 z-10 bg-blue-50 dark:bg-blue-900/30 border-2 border-dashed border-blue-400 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-blue-500" />
                <p className="mt-2 text-lg font-medium text-blue-700 dark:text-blue-300">
                  파일을 여기에 놓으세요
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  여러 파일을 동시에 업로드할 수 있습니다
                </p>
              </div>
            </div>
          )}

          {displayDocuments.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">문서가 없습니다</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm ? '검색 조건에 맞는 문서가 없습니다.' : '아직 문서가 없습니다.'}
              </p>
              <div className="mt-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
                >
                  <Upload className={`h-4 w-4 ${isUploading ? 'animate-spin' : ''}`} />
                  {isUploading ? '업로드중...' : '파일 업로드'}
                </button>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  파일을 드래그하여 놓거나 클릭하여 업로드하세요
                </p>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
              {displayDocuments.map((document) => {
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
                          onClick={() => {
                            setSelectedDocuments([document.id])
                            setShowShareModal(true)
                          }}
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
              {displayDocuments.map((document) => {
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
                              onClick={() => {
                                setSelectedDocuments([document.id])
                                setShowShareModal(true)
                              }}
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

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.hwp"
        onChange={handleFileUpload}
        className="hidden"
        disabled={isUploading}
      />

      {/* Document Preview Modal */}
      {showPreviewModal && previewDocument && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
              onClick={() => setShowPreviewModal(false)}
            />

            {/* Modal panel */}
            <div className="inline-block align-middle bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-4xl sm:w-full max-h-[90vh]">
              <div className="bg-white dark:bg-gray-800">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getFileTypeColor(previewDocument.type)}`}>
                      {getFileTypeDisplay(previewDocument.type)}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {previewDocument.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadDocument(previewDocument)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="다운로드"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setShowPreviewModal(false)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[calc(90vh-100px)] overflow-y-auto">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg h-96 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-white dark:bg-gray-600 rounded-lg flex items-center justify-center">
                        {previewDocument.type.includes('pdf') ? (
                          <Download className="h-8 w-8 text-red-500" />
                        ) : previewDocument.type.includes('image') ? (
                          <Eye className="h-8 w-8 text-blue-500" />
                        ) : (
                          <Download className="h-8 w-8 text-gray-500" />
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">문서 미리보기</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        파일 크기: {formatFileSize(previewDocument.size)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        마지막 수정: {formatDate(previewDocument.lastModified)}
                      </p>
                      {previewDocument.site && (
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                          {previewDocument.site}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal - Fixed z-index issue */}
      {showShareModal && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowShareModal(false)}
            />

            {/* Modal panel - Positioned above bottom navigation */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full mb-16 sm:mb-0">
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
    </div>
  )
}