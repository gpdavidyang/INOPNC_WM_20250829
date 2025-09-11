'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import FileUploadComponent, { UploadMetadata, UploadResult } from '@/components/documents/common/FileUploadComponent'
import {
  Search,
  Filter,
  Download,
  Share2,
  Star,
  MoreVertical,
  FolderOpen,
  FileText,
  Image,
  File,
  Users,
  Building,
  Calendar,
  ChevronDown,
  Upload,
  Grid,
  List,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface SharedDocument {
  id: string
  title: string
  file_name: string
  file_url: string
  file_size: number
  mime_type: string
  document_type: string
  description?: string
  owner_id: string
  owner?: {
    full_name: string
    email: string
  }
  site_id?: string
  site?: {
    name: string
  }
  is_public: boolean
  created_at: string
  updated_at: string
}

interface SharedDocumentsTabProps {
  profile: Profile
  initialCategory?: string
  initialSearch?: string
}

// 카테고리 정의
const categories = [
  { id: 'all', label: '전체', icon: FolderOpen },
  { id: 'drawings', label: '도면', icon: FileText },
  { id: 'manuals', label: '매뉴얼', icon: FileText },
  { id: 'safety', label: '안전관리', icon: AlertCircle },
  { id: 'training', label: '교육자료', icon: Users },
  { id: 'reports', label: '보고서', icon: FileText },
  { id: 'other', label: '기타', icon: File }
]

// 파일 아이콘 결정
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return Image
  if (mimeType.includes('pdf')) return FileText
  return File
}

// 파일 크기 포맷
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [sites, setSites] = useState<Array<{id: string, name: string}>>([])
  const [showUpload, setShowUpload] = useState(false)
  
  const supabase = createClient()

  // 현장 목록 로드
  useEffect(() => {
    fetchSites()
  }, [])

  // 문서 목록 로드
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

      // 카테고리 필터
      if (selectedCategory !== 'all') {
        query = query.eq('document_type', selectedCategory)
      }

      // 현장 필터
      if (selectedSite !== 'all') {
        query = query.eq('site_id', selectedSite)
      }

      // 검색어 필터
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) throw error

      setDocuments(data || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  // 파일 업로드 핸들러
  const handleFileUpload = async (file: File, metadata?: UploadMetadata): Promise<UploadResult> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', selectedCategory === 'all' ? 'other' : selectedCategory)
      formData.append('uploadedBy', profile.full_name)
      formData.append('documentType', selectedCategory === 'all' ? 'shared' : selectedCategory)
      formData.append('isPublic', 'true') // 공유문서함은 항상 public
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
      
      // 문서 목록 새로고침
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

  // 문서 다운로드
  const handleDownload = async (document: SharedDocument) => {
    try {
      window.open(document.file_url, '_blank')
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  // 문서 공유
  const handleShare = async (document: SharedDocument) => {
    try {
      const shareUrl = `${window.location.origin}/documents/${document.id}`
      await navigator.clipboard.writeText(shareUrl)
      alert('링크가 클립보드에 복사되었습니다.')
    } catch (error) {
      console.error('Share error:', error)
    }
  }

  const canUpload = profile.role === 'admin' || profile.role === 'system_admin' || profile.role === 'site_manager'

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">공유문서함</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            모든 사용자와 공유되는 문서들입니다
          </p>
        </div>
        {canUpload && (
          <Button onClick={() => setShowUpload(!showUpload)}>
            <Upload className="h-4 w-4 mr-2" />
            문서 업로드
          </Button>
        )}
      </div>

      {/* 업로드 영역 */}
      {showUpload && canUpload && (
        <Card>
          <CardHeader>
            <CardTitle>공유문서 업로드</CardTitle>
            <CardDescription>
              업로드된 문서는 모든 사용자에게 공개됩니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploadComponent
              onUpload={handleFileUpload}
              title="공유할 문서를 업로드하세요"
              description="PDF, 이미지, 문서 파일을 드래그하거나 클릭하여 업로드"
              documentType="shared"
              category={selectedCategory === 'all' ? 'other' : selectedCategory}
              isPublic={true}
              multiple={true}
              maxSize={50} // 공유문서는 50MB까지 허용
            />
          </CardContent>
        </Card>
      )}

      {/* 필터 및 검색 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="문서 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="카테고리 선택" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedSite} onValueChange={setSelectedSite}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="현장 선택" />
          </SelectTrigger>
          <SelectContent>
            {sites.map(site => (
              <SelectItem key={site.id} value={site.id}>
                {site.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 문서 목록 */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : documents.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {searchTerm ? '검색 결과가 없습니다.' : '공유된 문서가 없습니다.'}
          </AlertDescription>
        </Alert>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {documents.map(doc => {
            const FileIcon = getFileIcon(doc.mime_type)
            return (
              <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <FileIcon className="h-8 w-8 text-blue-600" />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownload(doc)}>
                          <Download className="h-4 w-4 mr-2" />
                          다운로드
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare(doc)}>
                          <Share2 className="h-4 w-4 mr-2" />
                          공유
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <h3 className="font-medium text-sm mb-1 line-clamp-2" title={doc.title}>
                    {doc.title}
                  </h3>
                  
                  {doc.description && (
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                      {doc.description}
                    </p>
                  )}
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Users className="h-3 w-3" />
                      <span className="truncate">{doc.owner?.full_name || 'Unknown'}</span>
                    </div>
                    {doc.site && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Building className="h-3 w-3" />
                        <span className="truncate">{doc.site.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(doc.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3 pt-3 border-t">
                    <Badge variant="secondary" className="text-xs">
                      {categories.find(c => c.id === doc.document_type)?.label || '기타'}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {formatFileSize(doc.file_size)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map(doc => {
            const FileIcon = getFileIcon(doc.mime_type)
            return (
              <Card key={doc.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <FileIcon className="h-8 w-8 text-blue-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm mb-1 truncate">
                          {doc.title}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{doc.owner?.full_name || 'Unknown'}</span>
                          {doc.site && <span>{doc.site.name}</span>}
                          <span>{new Date(doc.created_at).toLocaleDateString('ko-KR')}</span>
                          <span>{formatFileSize(doc.file_size)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {categories.find(c => c.id === doc.document_type)?.label || '기타'}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownload(doc)}>
                            <Download className="h-4 w-4 mr-2" />
                            다운로드
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShare(doc)}>
                            <Share2 className="h-4 w-4 mr-2" />
                            공유
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}