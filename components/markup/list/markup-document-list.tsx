'use client'

import { useState, useEffect } from 'react'
import { MarkupDocument } from '@/types'
import { 
  FileText, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Share2, 
  Calendar,
  User,
  Building2,
  Eye,
  List,
  Grid,
  CheckCircle,
  X,
  Mail,
  MessageSquare,
  Link2,
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/custom-select'
import ShareDialog from '@/components/documents/share-dialog'

interface MarkupDocumentListProps {
  onCreateNew: () => void
  onOpenDocument: (document: MarkupDocument) => void
  onEditDocument: (document: MarkupDocument) => void
}

interface DocumentsResponse {
  success: boolean
  data: MarkupDocument[]
  error?: string
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function MarkupDocumentList({ 
  onCreateNew, 
  onOpenDocument,
  onEditDocument
}: MarkupDocumentListProps) {
  const [documents, setDocuments] = useState<MarkupDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [documentToShare, setDocumentToShare] = useState<MarkupDocument | null>(null)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null)

  // 현장 목록 상태
  const [sites, setSites] = useState([
    { id: 'all', name: '전체 현장' }
  ])

  const fetchSites = async () => {
    try {
      const response = await fetch('/api/sites')
      const result = await response.json()
      
      if (result.success && result.data) {
        const siteOptions = [
          { id: 'all', name: '전체 현장' },
          ...result.data.map((site: any) => ({
            id: site.id,
            name: site.name
          }))
        ]
        setSites(siteOptions)
      }
    } catch (err) {
      console.error('Error fetching sites:', err)
    }
  }

  const fetchDocuments = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        admin: 'true', // 관리자 모드로 모든 문서 조회
        ...(searchQuery && { search: searchQuery }),
        ...(selectedSite !== 'all' && { site: selectedSite })
        // Note: location parameter removed as location field no longer exists
      })

      const response = await fetch(`/api/markup-documents?${params}`)
      const result: DocumentsResponse = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch documents')
      }

      if (result.success) {
        setDocuments(result.data)
        setTotalPages(result.pagination.totalPages)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching documents:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSites()
    fetchDocuments()
  }, [currentPage, searchQuery, selectedSite])

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1) // Reset to first page on search
  }

  const handleSiteChange = (siteId: string) => {
    setSelectedSite(siteId)
    setCurrentPage(1) // Reset to first page on site filter change
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm('이 마킹 도면을 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/markup-documents/${documentId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete document')
      }

      // 목록 새로고침
      fetchDocuments()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred while deleting')
    }
  }

  const handleShareDocument = (document: MarkupDocument) => {
    setDocumentToShare(document)
    setShareDialogOpen(true)
  }

  const generateShareUrl = (document: MarkupDocument) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/dashboard/markup/shared/${document.id}?token=${generateShareToken(document.id)}`
  }

  const generateShareToken = (documentId: string) => {
    // Generate a simple share token (in production, this should be more secure)
    return btoa(`${documentId}-${Date.now()}`).substring(0, 16)
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
      alert('공유할 도면을 선택해주세요.')
      return
    }

    const selectedDocs = documents.filter(doc => selectedDocuments.includes(doc.id))
    const shareText = `선택한 도면 ${selectedDocs.length}개:\n${selectedDocs.map(doc => doc.title).join('\n')}`

    switch (method) {
      case 'sms':
        window.location.href = `sms:?body=${encodeURIComponent(shareText)}`
        break
      case 'email':
        window.location.href = `mailto:?subject=도면 공유&body=${encodeURIComponent(shareText)}`
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

  return (
    <div className="space-y-4">
      {/* Header - Compact Design */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-medium text-gray-700 dark:text-gray-300">도면문서함</h2>
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
                  onClick={onCreateNew}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors touch-manipulation"
                >
                  <Plus className="h-3 w-3" />
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
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {/* Site Filter */}
            <Select value={selectedSite} onValueChange={handleSiteChange}>
              <SelectTrigger className="w-[100px] h-7 px-2 py-1 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                <SelectValue placeholder="현장" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
                {sites.map((site) => (
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
        {error && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-700 p-6 mb-4 shadow-sm">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  {error.includes('fetch') || error.includes('network') ? (
                    <WifiOff className="h-5 w-5 text-red-600 dark:text-red-400" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                  데이터를 불러올 수 없습니다
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                  {error.includes('fetch') || error.includes('network') 
                    ? '네트워크 연결을 확인하고 다시 시도해주세요.'
                    : '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button 
                    onClick={fetchDocuments}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? '재시도 중...' : '다시 시도'}
                  </button>
                  <button 
                    onClick={() => setError(null)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                    닫기
                  </button>
                </div>
              </div>
            </div>
            
            {/* 추가 정보 */}
            <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-700">
              <details className="group">
                <summary className="cursor-pointer text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 select-none">
                  기술적 세부사항 보기
                </summary>
                <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <code className="text-xs text-red-800 dark:text-red-200 font-mono break-all">
                    {error}
                  </code>
                </div>
              </details>
            </div>
          </div>
        )}

        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* 데스크톱 로딩 테이블 */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">미리보기</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">제목</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">생성일</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">마킹수</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-3">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 모바일 로딩 리스트 */}
            <div className="md:hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border-b border-gray-200 dark:border-gray-600 last:border-b-0 p-3 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
                      <div className="grid grid-cols-3 gap-1">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                {searchQuery ? '검색 결과가 없습니다' : '저장된 마킹 도면이 없습니다'}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchQuery 
                  ? '다른 검색어로 시도해보세요' 
                  : '새로운 도면을 업로드하고 마킹을 시작해보세요'
                }
              </p>
              {!searchQuery && (
                <button 
                  onClick={onCreateNew}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors mx-auto"
                >
                  <Plus className="h-3 w-3" />
                  첫 번째 도면 업로드하기
                </button>
              )}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
              {documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className={`relative border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
                    isSelectionMode && selectedDocuments.includes(doc.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600'
                  }`}
                  onClick={() => isSelectionMode && toggleDocumentSelection(doc.id)}
                >
                  {/* Selection Checkbox */}
                  {isSelectionMode && (
                    <div className="absolute top-2 left-2">
                      <input
                        type="checkbox"
                        checked={selectedDocuments.includes(doc.id)}
                        onChange={() => toggleDocumentSelection(doc.id)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                  
                  <div className="flex flex-col items-center text-center">
                    {/* File Type Badge */}
                    <div className="mb-3">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center overflow-hidden">
                        {doc.preview_image_url ? (
                          <img 
                            src={doc.preview_image_url} 
                            alt={doc.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FileText className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                        )}
                      </div>
                    </div>
                    
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-2">
                      {doc.title}
                    </h4>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                      {formatDate(doc.created_at)}
                    </p>
                    
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setLoadingDocId(doc.id)
                          onOpenDocument(doc)
                        }}
                        disabled={loadingDocId === doc.id}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="미리보기"
                      >
                        {loadingDocId === doc.id ? (
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </button>
                      <button
                        onClick={() => onEditDocument(doc)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="편집"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleShareDocument(doc)}
                        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                        title="공유하기"
                      >
                        <Share2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* 리스트 뷰 - 모든 화면 크기에서 카드 스타일 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="space-y-2 p-4">
                {documents.map((doc: any) => {
                  const getFileTypeDisplay = () => '도면'
                  const getFileTypeColor = () => 'bg-purple-100 text-purple-700 border-purple-200'

                  return (
                    <div
                      key={doc.id}
                      className={`bg-white dark:bg-gray-800 border rounded-lg p-3 hover:shadow-md transition-all duration-200 cursor-pointer ${
                        isSelectionMode && selectedDocuments.includes(doc.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                      }`}
                      onClick={() => isSelectionMode && toggleDocumentSelection(doc.id)}
                    >
                      <div className="flex items-center gap-3">
                        {/* Selection Checkbox */}
                        {isSelectionMode && (
                          <div className="flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={selectedDocuments.includes(doc.id)}
                              onChange={() => toggleDocumentSelection(doc.id)}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        )}
                        
                        {/* Badge Only */}
                        <div className="flex-shrink-0">
                          <span className={`inline-block px-1.5 py-0.5 text-xs font-medium rounded-md ${getFileTypeColor()}`}>
                            {getFileTypeDisplay()}
                          </span>
                        </div>
                        
                        {/* File Info - Simplified Layout */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate mb-1">
                                {doc.title}
                              </h4>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(doc.created_at).toLocaleDateString('ko-KR', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                            </div>
                            
                            {/* Action Buttons - Compact */}
                            <div className="flex items-center gap-1 ml-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setLoadingDocId(doc.id)
                                  onOpenDocument(doc)
                                }}
                                disabled={loadingDocId === doc.id}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="미리보기"
                              >
                                {loadingDocId === doc.id ? (
                                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                              </button>
                              <button
                                onClick={() => onEditDocument(doc)}
                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                                title="편집"
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleShareDocument(doc)}
                                className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
                                title="공유하기"
                              >
                                <Share2 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDelete(doc.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                title="삭제"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  이전
                </button>
                <span className="px-2 py-1 text-sm text-gray-600 dark:text-gray-400">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>

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
                    도면 공유하기
                  </h3>
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  선택한 {selectedDocuments.length}개의 도면을 공유합니다
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