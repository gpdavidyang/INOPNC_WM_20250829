'use client'

import { useState, useEffect, useRef } from 'react'
import { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import FileUploadComponent, { UploadMetadata, UploadResult } from '@/components/documents/common/FileUploadComponent'
import DocumentCard from '@/components/documents/common/DocumentCard'
import DocumentFilters from '@/components/documents/common/DocumentFilters'
import ShareDialog from '@/components/documents/share-dialog'
import {
  Upload, Folder, AlertCircle, Share2, X, ChevronUp, ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getFileTypeStyle, getStatusStyle } from '@/components/documents/design-tokens'

interface SharedDocument {
  id: string
  title: string
  name?: string
  file_name: string
  file_url: string
  url?: string
  file_size: number
  size?: number
  mime_type: string
  type?: string
  document_type: string
  category?: string
  description?: string
  owner_id: string
  owner?: {
    full_name: string
    email: string
  }
  uploadedBy?: string
  site_id?: string
  site?: string | {
    name: string
  }
  siteAddress?: string
  is_public: boolean
  created_at: string
  uploadedAt?: string
  updated_at: string
  status?: 'completed' | 'pending' | 'processing' | 'review'
  submissionStatus?: 'not_submitted' | 'submitted' | 'approved' | 'rejected'
}

interface SharedDocumentsTabProps {
  profile: Profile
  initialCategory?: string
  initialSearch?: string
}

export default function SharedDocumentsTabUpdated({ 
  profile, 
  initialCategory = 'all',
  initialSearch = ''
}: SharedDocumentsTabProps) {
  const [documents, setDocuments] = useState<SharedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [sites, setSites] = useState<Array<{id: string, name: string}>>([])
  const [showUpload, setShowUpload] = useState(false)
  const [isUploadExpanded, setIsUploadExpanded] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [documentToShare, setDocumentToShare] = useState<SharedDocument | null>(null)
  
  const supabase = createClient()

  // Categories for DocumentFilters - matching Personal Documents Tab
  const categories = [
    { id: 'all', label: '전체' },
    { id: 'drawings', label: '도면' },
    { id: 'manuals', label: '매뉴얼' },
    { id: 'safety', label: '안전관리' },
    { id: 'training', label: '교육자료' },
    { id: 'reports', label: '보고서' },
    { id: 'construction-docs', label: '시공문서' },
    { id: 'photos', label: '사진' },
    { id: 'other', label: '기타' }
  ]

  // Sort options for DocumentFilters - matching Personal Documents Tab
  const sortOptions = [
    { value: 'date-desc', label: '최신순' },
    { value: 'date-asc', label: '오래된순' },
    { value: 'name-asc', label: '이름순 (가-하)' },
    { value: 'name-desc', label: '이름순 (하-가)' }
  ]

  // Load sites on mount
  useEffect(() => {
    fetchSites()
  }, [])

  // Load documents when filters change
  useEffect(() => {
    fetchDocuments()
  }, [selectedCategory, selectedSite, searchTerm])

  const fetchSites = async () => {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      if (error) throw error

      setSites([
        { id: 'all', name: '전체 현장' },
        ...(data || [])
      ])
    } catch (error) {
      console.error('Error fetching sites:', error)
    }
  }

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('documents')
        .select(`
          *,
          owner:owner_id (
            id,
            full_name,
            email
          ),
          site:site_id (
            id,
            name
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      // Category filter
      if (selectedCategory !== 'all') {
        query = query.eq('document_type', selectedCategory)
      }

      // Site filter
      if (selectedSite !== 'all') {
        query = query.eq('site_id', selectedSite)
      }

      // Search filter
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,file_name.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) throw error

      // Transform data to match DocumentCard interface
      const transformedDocuments: SharedDocument[] = (data || []).map(doc => ({
        ...doc,
        name: doc.title || doc.file_name,
        size: doc.file_size,
        type: doc.mime_type,
        category: doc.document_type,
        uploadedAt: doc.created_at,
        uploadedBy: doc.owner?.full_name || 'Unknown',
        url: doc.file_url,
        status: 'completed' as const
      }))

      setDocuments(transformedDocuments)
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort documents
  const filteredAndSortedDocuments = documents
    .filter(doc => {
      const matchesCategory = selectedCategory === 'all' || doc.document_type === selectedCategory
      const matchesSearch = searchTerm === '' || 
        (doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         doc.file_name?.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesSite = selectedSite === 'all' || doc.site_id === selectedSite
      return matchesCategory && matchesSearch && matchesSite
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = (a.title || a.file_name).localeCompare(b.title || b.file_name)
          break
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  // Upload handler
  const handleFileUpload = async (file: File, metadata?: UploadMetadata): Promise<UploadResult> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', selectedCategory === 'all' ? 'other' : selectedCategory)
      formData.append('uploadedBy', profile.full_name)
      formData.append('documentType', selectedCategory === 'all' ? 'shared' : selectedCategory)
      formData.append('isPublic', 'true')
      formData.append('description', `공유문서: ${file.name}`)

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '업로드 실패')
      }

      const result = await response.json()
      
      // Refresh document list
      await fetchDocuments()
      
      return {
        success: true,
        data: result.data
      }
    } catch (error) {
      console.error('Upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '업로드 실패'
      }
    }
  }

  const handleViewDocument = (document: SharedDocument) => {
    if (document.file_url || document.url) {
      window.open(document.file_url || document.url, '_blank')
    } else {
      alert('문서 URL을 찾을 수 없습니다.')
    }
  }

  const handleDownloadDocument = async (document: SharedDocument) => {
    try {
      const url = document.file_url || document.url
      if (url) {
        const link = window.document.createElement('a')
        link.href = url
        link.download = document.title || document.file_name
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

  const handleShareDocument = (document: SharedDocument) => {
    setDocumentToShare(document)
    setShareDialogOpen(true)
  }

  const generateShareUrl = (document: SharedDocument) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/dashboard/documents/shared/${document.id}`
  }

  // Selection mode handlers
  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    )
  }

  const canUpload = profile.role === 'admin' || profile.role === 'system_admin' || profile.role === 'site_manager'

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-sm text-gray-500 dark:text-gray-400">공유문서를 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Modern DocumentFilters */}
      <Card>
        <CardContent className="p-6">
          <DocumentFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="공유문서 검색..."
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            sites={sites}
            selectedSite={selectedSite}
            onSiteChange={setSelectedSite}
            sortOptions={sortOptions}
            selectedSort={`${sortBy}-${sortOrder}`}
            onSortChange={(value) => {
              const [newSortBy, newSortOrder] = value.split('-')
              setSortBy(newSortBy as 'date' | 'name')
              setSortOrder(newSortOrder as 'asc' | 'desc')
            }}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            showUpload={canUpload}
            onUploadClick={() => setIsUploadExpanded(!isUploadExpanded)}
            uploadLoading={false}
            isSelectionMode={isSelectionMode}
            selectedCount={selectedDocuments.length}
            onToggleSelectionMode={() => {
              setIsSelectionMode(!isSelectionMode)
              if (isSelectionMode) {
                setSelectedDocuments([])
              }
            }}
            onClearSelection={() => setSelectedDocuments([])}
            additionalActions={
              isSelectionMode && selectedDocuments.length > 0 ? (
                <Button
                  onClick={() => {
                    // Handle bulk share action
                    alert(`${selectedDocuments.length}개 문서 공유 기능은 준비 중입니다.`)
                  }}
                  size="sm"
                  className="h-8"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  공유
                </Button>
              ) : null
            }
            compact={true}
          />
        </CardContent>
      </Card>

      {/* Upload Section */}
      {isUploadExpanded && canUpload && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  공유문서 업로드
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  업로드된 문서는 모든 사용자에게 공개됩니다
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsUploadExpanded(false)}
                title="접기"
              >
                <ChevronUp className="h-5 w-5" />
              </Button>
            </div>
            <FileUploadComponent
              onUpload={handleFileUpload}
              title="공유할 문서를 업로드하세요"
              description="PDF, 이미지, 문서 파일을 드래그하거나 클릭하여 업로드"
              documentType="shared"
              category={selectedCategory === 'all' ? 'other' : selectedCategory}
              isPublic={true}
              multiple={true}
              maxSize={50}
            />
          </CardContent>
        </Card>
      )}

      {/* Modern Document Grid/List using DocumentCard */}
      <Card>
        <CardContent className={viewMode === 'grid' ? 'p-6' : 'p-4'}>
          {filteredAndSortedDocuments.length === 0 ? (
            <div className="text-center py-16">
              <Folder className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                공유문서가 없습니다
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                {searchTerm 
                  ? '검색 조건에 맞는 공유문서가 없습니다. 다른 검색어를 시도해보세요.' 
                  : canUpload 
                    ? '첫 번째 공유문서를 업로드해보세요.'
                    : '관리자가 공유문서를 업로드할 때까지 기다려주세요.'
                }
              </p>
              {canUpload && !searchTerm && (
                <Button 
                  onClick={() => setIsUploadExpanded(true)}
                  className="mt-4"
                  size="lg"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  첫 공유문서 업로드하기
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAndSortedDocuments.map((document: any) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  viewMode="grid"
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedDocuments.includes(document.id)}
                  onSelect={toggleDocumentSelection}
                  onView={handleViewDocument}
                  onDownload={handleDownloadDocument}
                  onShare={handleShareDocument}
                  showOwner={true}
                  showSite={true}
                  showStatus={false}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedDocuments.map((document: any) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  viewMode="list"
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedDocuments.includes(document.id)}
                  onSelect={toggleDocumentSelection}
                  onView={handleViewDocument}
                  onDownload={handleDownloadDocument}
                  onShare={handleShareDocument}
                  showOwner={true}
                  showSite={true}
                  showStatus={false}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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