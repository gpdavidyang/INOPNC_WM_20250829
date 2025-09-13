'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  Upload, 
  Filter, 
  Download, 
  Share2, 
  Trash2, 
  Archive, 
  RefreshCw,
  Grid,
  List,
  Eye,
  Edit,
  FileText,
  Image,
  File
} from 'lucide-react'
import { useUnifiedDocuments, type UnifiedDocument, type DocumentFilters } from '@/hooks/use-unified-documents'
import { formatFileSize, formatDate } from '@/lib/utils'

interface UnifiedDocumentManagerProps {
  defaultCategory?: string
  siteId?: string
  viewMode?: 'sidebar' | 'unified' | 'admin'
  allowUpload?: boolean
  allowBulkActions?: boolean
  showCategories?: boolean
}

export default function UnifiedDocumentManager({
  defaultCategory,
  siteId,
  viewMode = 'unified',
  allowUpload = true,
  allowBulkActions = true,
  showCategories = true
}: UnifiedDocumentManagerProps) {
  const [filters, setFilters] = useState<DocumentFilters>({
    categoryType: defaultCategory,
    siteId,
    status: 'active',
    page: 1,
    limit: 20,
    sortBy: 'created_at',
    sortOrder: 'desc'
  })
  
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('list')
  const [searchQuery, setSearchQuery] = useState('')

  const {
    documents,
    categories,
    pagination,
    statistics,
    loading,
    uploading,
    error,
    fetchDocuments,
    fetchCategories,
    uploadDocument,
    updateDocument,
    deleteDocument,
    bulkAction,
    getDocumentsByCategory,
    searchDocuments,
    clearError
  } = useUnifiedDocuments(filters)

  // 카테고리별 문서 그룹화
  const documentsByCategory = useMemo(() => {
    if (!showCategories) return { [defaultCategory || 'all']: documents }
    
    return categories.reduce((acc, category) => {
      acc[category.category_type] = getDocumentsByCategory(category.category_type)
      return acc
    }, {} as Record<string, UnifiedDocument[]>)
  }, [documents, categories, showCategories, defaultCategory, getDocumentsByCategory])

  // 필터 변경 핸들러
  const handleFilterChange = (newFilters: Partial<DocumentFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 }
    setFilters(updatedFilters)
    fetchDocuments(updatedFilters)
  }

  // 검색 핸들러
  const handleSearch = async () => {
    handleFilterChange({ search: searchQuery })
  }

  // 파일 업로드 핸들러
  const handleFileUpload = async (file: File, metadata: Partial<UnifiedDocument>) => {
    const result = await uploadDocument(file, {
      ...metadata,
      category_type: filters.categoryType || defaultCategory || 'personal',
      site_id: siteId
    })
    
    if (result) {
      // 업로드 성공 후 목록 새로고침
      await fetchDocuments(filters)
    }
  }

  // 대량 작업 핸들러
  const handleBulkAction = async (action: string, updateData?: any) => {
    if (selectedDocuments.length === 0) return

    const success = await bulkAction(action as any, selectedDocuments, updateData)
    if (success) {
      setSelectedDocuments([])
    }
  }

  // 문서 선택 토글
  const toggleDocumentSelection = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    )
  }

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedDocuments.length === documents.length) {
      setSelectedDocuments([])
    } else {
      setSelectedDocuments(documents.map(doc => doc.id))
    }
  }

  // 파일 아이콘 결정
  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <File className="h-4 w-4" />
    
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />
    if (mimeType === 'application/pdf') return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  // 카테고리 색상 매핑
  const getCategoryColor = (categoryType: string) => {
    const category = categories.find(c => c.category_type === categoryType)
    return category?.color || 'gray'
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">통합 문서 관리</h1>
          <p className="text-muted-foreground">
            모든 문서함을 통합하여 관리할 수 있습니다.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 뷰 레이아웃 토글 */}
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewLayout === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewLayout('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewLayout === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewLayout('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
          
          <Button onClick={() => fetchDocuments(filters)} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{statistics.total_documents}</div>
              <p className="text-xs text-muted-foreground">전체 문서</p>
            </CardContent>
          </Card>
          
          {Object.entries(statistics.by_category).slice(0, 3).map(([category, count]) => {
            const categoryInfo = categories.find(c => c.category_type === category)
            return (
              <Card key={category}>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{count}</div>
                  <p className="text-xs text-muted-foreground">
                    {categoryInfo?.display_name_ko || category}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* 필터 및 검색 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* 검색 */}
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="문서 제목, 설명, 파일명으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} variant="outline" size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            {/* 카테고리 필터 */}
            {showCategories && (
              <Select
                value={filters.categoryType || 'all'}
                onValueChange={(value) => handleFilterChange({ categoryType: value === 'all' ? undefined : value })}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 카테고리</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.category_type} value={category.category_type}>
                      {category.display_name_ko}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {/* 상태 필터 */}
            <Select
              value={filters.status || 'active'}
              onValueChange={(value) => handleFilterChange({ status: value })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">활성</SelectItem>
                <SelectItem value="archived">보관됨</SelectItem>
                <SelectItem value="deleted">삭제됨</SelectItem>
              </SelectContent>
            </Select>
            
            {/* 정렬 */}
            <Select
              value={`${filters.sortBy}_${filters.sortOrder}`}
              onValueChange={(value) => {
                const [sortBy, sortOrder] = value.split('_')
                handleFilterChange({ sortBy: sortBy as any, sortOrder: sortOrder as any })
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at_desc">최신순</SelectItem>
                <SelectItem value="created_at_asc">오래된순</SelectItem>
                <SelectItem value="title_asc">제목순</SelectItem>
                <SelectItem value="file_size_desc">크기순</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 대량 작업 바 */}
      {allowBulkActions && selectedDocuments.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">
                {selectedDocuments.length}개 문서 선택됨
              </span>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleBulkAction('archive')}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  보관
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  삭제
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedDocuments([])}
                >
                  선택 해제
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 문서 목록 */}
      {showCategories ? (
        /* 카테고리별 탭 뷰 */
        <Tabs value={filters.categoryType || 'all'} onValueChange={(value) => handleFilterChange({ categoryType: value === 'all' ? undefined : value })}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">전체</TabsTrigger>
            {categories.slice(0, 5).map((category) => (
              <TabsTrigger key={category.category_type} value={category.category_type}>
                {category.display_name_ko}
                {category.stats && category.stats.active > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {category.stats.active}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <DocumentList 
              documents={documents}
              viewLayout={viewLayout}
              selectedDocuments={selectedDocuments}
              onToggleSelection={toggleDocumentSelection}
              onSelectAll={toggleSelectAll}
              onUpdate={updateDocument}
              onDelete={deleteDocument}
              categories={categories}
              loading={loading}
            />
          </TabsContent>

          {categories.map((category) => (
            <TabsContent key={category.category_type} value={category.category_type} className="space-y-4">
              <DocumentList 
                documents={getDocumentsByCategory(category.category_type)}
                viewLayout={viewLayout}
                selectedDocuments={selectedDocuments}
                onToggleSelection={toggleDocumentSelection}
                onSelectAll={toggleSelectAll}
                onUpdate={updateDocument}
                onDelete={deleteDocument}
                categories={categories}
                loading={loading}
              />
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        /* 단일 리스트 뷰 */
        <DocumentList 
          documents={documents}
          viewLayout={viewLayout}
          selectedDocuments={selectedDocuments}
          onToggleSelection={toggleDocumentSelection}
          onSelectAll={toggleSelectAll}
          onUpdate={updateDocument}
          onDelete={deleteDocument}
          categories={categories}
          loading={loading}
        />
      )}

      {/* 페이지네이션 */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => handleFilterChange({ page: pagination.page - 1 })}
          >
            이전
          </Button>
          
          <span className="text-sm">
            {pagination.page} / {pagination.totalPages} 페이지
          </span>
          
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => handleFilterChange({ page: pagination.page + 1 })}
          >
            다음
          </Button>
        </div>
      )}

      {/* 에러 표시 */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-red-600">{error}</span>
              <Button variant="ghost" size="sm" onClick={clearError}>
                닫기
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// 문서 목록 컴포넌트
interface DocumentListProps {
  documents: UnifiedDocument[]
  viewLayout: 'grid' | 'list'
  selectedDocuments: string[]
  onToggleSelection: (id: string) => void
  onSelectAll: () => void
  onUpdate: (id: string, updates: Partial<UnifiedDocument>) => Promise<UnifiedDocument | null>
  onDelete: (id: string, hardDelete?: boolean) => Promise<boolean>
  categories: unknown[]
  loading: boolean
}

function DocumentList({ 
  documents, 
  viewLayout, 
  selectedDocuments, 
  onToggleSelection, 
  onSelectAll, 
  onUpdate, 
  onDelete,
  categories,
  loading 
}: DocumentListProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>문서를 불러오는 중...</p>
        </CardContent>
      </Card>
    )
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">문서가 없습니다.</p>
        </CardContent>
      </Card>
    )
  }

  if (viewLayout === 'grid') {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {documents.map((document) => (
          <DocumentCard
            key={document.id}
            document={document}
            selected={selectedDocuments.includes(document.id)}
            onToggleSelection={onToggleSelection}
            onUpdate={onUpdate}
            onDelete={onDelete}
            categories={categories}
          />
        ))}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">문서 목록</CardTitle>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedDocuments.length === documents.length}
              onChange={onSelectAll}
              className="rounded"
            />
            <span className="text-sm text-muted-foreground">전체 선택</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {documents.map((document) => (
            <DocumentRow
              key={document.id}
              document={document}
              selected={selectedDocuments.includes(document.id)}
              onToggleSelection={onToggleSelection}
              onUpdate={onUpdate}
              onDelete={onDelete}
              categories={categories}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// 문서 카드 컴포넌트 (그리드 뷰용)
interface DocumentCardProps {
  document: UnifiedDocument
  selected: boolean
  onToggleSelection: (id: string) => void
  onUpdate: (id: string, updates: Partial<UnifiedDocument>) => Promise<UnifiedDocument | null>
  onDelete: (id: string, hardDelete?: boolean) => Promise<boolean>
  categories: unknown[]
}

function DocumentCard({ document, selected, onToggleSelection, onUpdate, onDelete, categories }: DocumentCardProps) {
  const category = categories.find(c => c.category_type === document.category_type)
  
  return (
    <Card className={`cursor-pointer transition-all hover:shadow-md ${selected ? 'ring-2 ring-blue-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelection(document.id)}
            onClick={(e) => e.stopPropagation()}
            className="rounded"
          />
          <div className="flex items-center gap-2">
            {document.mime_type?.startsWith('image/') ? <Image className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium text-sm line-clamp-2">{document.title}</h3>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" style={{ backgroundColor: category?.color }}>
              {category?.display_name_ko || document.category_type}
            </Badge>
            {document.sub_category && (
              <Badge variant="outline" className="text-xs">
                {document.sub_category}
              </Badge>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p>{formatFileSize(document.file_size || 0)}</p>
            <p>{formatDate(document.created_at)}</p>
            {document.uploader && (
              <p>업로드: {document.uploader.full_name}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-3">
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Eye className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Download className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Share2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// 문서 행 컴포넌트 (리스트 뷰용)
function DocumentRow({ document, selected, onToggleSelection, onUpdate, onDelete, categories }: DocumentCardProps) {
  const category = categories.find(c => c.category_type === document.category_type)
  
  return (
    <div className={`flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 ${selected ? 'bg-blue-50 border-blue-300' : ''}`}>
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggleSelection(document.id)}
        className="rounded"
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          {document.mime_type?.startsWith('image/') ? <Image className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
          <span className="font-medium truncate">{document.title}</span>
          
          <Badge variant="secondary" style={{ backgroundColor: category?.color }}>
            {category?.display_name_ko || document.category_type}
          </Badge>
          
          {document.sub_category && (
            <Badge variant="outline" className="text-xs">
              {document.sub_category}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
          <span>{formatFileSize(document.file_size || 0)}</span>
          <span>{formatDate(document.created_at)}</span>
          {document.uploader && <span>업로드: {document.uploader.full_name}</span>}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <Download className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <Share2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}