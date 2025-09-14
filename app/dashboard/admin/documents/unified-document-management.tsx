'use client'

import type { Profile } from '@/types'

interface UnifiedDocumentManagementProps {
  profile: Profile
}

// Document categories configuration
const DOCUMENT_CATEGORIES = [
  { 
    id: 'all', 
    label: '전체 문서', 
    icon: FolderOpen, 
    color: 'gray',
    description: '모든 문서 유형 표시'
  },
  { 
    id: 'personal', 
    label: '개인 문서함', 
    icon: FileText, 
    color: 'blue',
    description: '사용자 개인 문서'
  },
  { 
    id: 'shared', 
    label: '공유 문서함', 
    icon: Share2, 
    color: 'green',
    description: '조직 내 공유 문서'
  },
  { 
    id: 'markup', 
    label: '도면 마킹', 
    icon: Edit3, 
    color: 'purple',
    description: '마킹된 도면 문서'
  },
  { 
    id: 'photo_reports', 
    label: '사진대지', 
    icon: Camera, 
    color: 'orange',
    description: '일일 작업 사진 보고서'
  },
  { 
    id: 'site_documents', 
    label: '현장 문서', 
    icon: Image, 
    color: 'teal',
    description: 'PTW, 공사도면 등'
  },
  { 
    id: 'correction_requests', 
    label: '시정청구함', 
    icon: AlertCircle, 
    color: 'red',
    description: '시정 요청 관련 문서'
  }
]

interface DocumentStats {
  totalDocuments: number
  totalSize: string
  documentsThisMonth: number
  recentUploads: number
  categoryBreakdown: Record<string, number>
}

interface UnifiedDocument {
  id: string
  title: string
  description?: string
  category: string
  documentType: string
  fileName: string
  fileSize: number
  fileUrl: string
  mimeType: string
  owner: {
    id: string
    name: string
    email: string
  }
  site?: {
    id: string
    name: string
  }
  status: 'active' | 'archived' | 'deleted'
  visibility: 'private' | 'shared' | 'public'
  createdAt: string
  updatedAt: string
  viewCount: number
  downloadCount: number
  tags?: string[]
  folder_path?: string
}

export function UnifiedDocumentManagement({ profile }: UnifiedDocumentManagementProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const supabase = createClient()
  
  // State management
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [documents, setDocuments] = useState<UnifiedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [stats, setStats] = useState<DocumentStats>({
    totalDocuments: 0,
    totalSize: '0 MB',
    documentsThisMonth: 0,
    recentUploads: 0,
    categoryBreakdown: {}
  })

  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    visibility: 'all',
    dateRange: 'all',
    siteId: 'all',
    fileType: 'all'
  })

  // Transform DocumentWithApproval to UnifiedDocument
  const transformDocument = (doc: DocumentWithApproval): UnifiedDocument => {
    return {
      id: doc.id,
      title: doc.title || doc.file_name,
      description: doc.description || undefined,
      category: getCategoryFromPath(doc.folder_path || ''),
      documentType: doc.document_type || 'document',
      fileName: doc.file_name,
      fileSize: doc.file_size || 0,
      fileUrl: doc.file_url,
      mimeType: doc.mime_type || 'application/octet-stream',
      owner: {
        id: doc.owner_id || '',
        name: doc.owner?.full_name || 'Unknown',
        email: (doc.owner as unknown)?.email || ''
      },
      site: doc.site ? {
        id: doc.site_id!,
        name: doc.site.name
      } : undefined,
      status: 'active',
      visibility: doc.is_public ? 'public' : doc.folder_path === '/shared' ? 'shared' : 'private',
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
      viewCount: (doc as unknown).view_count || 0,
      downloadCount: (doc as unknown).download_count || 0,
      tags: (doc as unknown).tags,
      folder_path: doc.folder_path || undefined
    }
  }

  // Get category from folder path
  const getCategoryFromPath = (folderPath: string): string => {
    if (folderPath.includes('/shared')) return 'shared'
    if (folderPath.includes('/markup')) return 'markup'
    if (folderPath.includes('/photo')) return 'photo_reports'
    if (folderPath.includes('/site')) return 'site_documents'
    if (folderPath.includes('/correction')) return 'correction_requests'
    return 'personal'
  }

  // Load documents based on category and filters
  const loadDocuments = useCallback(async () => {
    setLoading(true)
    try {
      let result
      
      if (selectedCategory === 'all') {
        result = await getAllUnifiedDocuments()
      } else if (selectedCategory === 'shared') {
        result = await getSharedDocuments()
      } else {
        // For other categories, get all documents and filter by category
        result = await getAllUnifiedDocuments()
      }

      if (!result.success || !result.data) {
        console.error('Error loading documents:', result.error)
        setDocuments([])
        return
      }

      let allDocuments = result.data.map(transformDocument)

      // Apply category filter (except for 'all' and 'shared' which are handled above)
      if (selectedCategory !== 'all' && selectedCategory !== 'shared') {
        allDocuments = allDocuments.filter(doc => doc.category === selectedCategory)
      }
      
      // Apply search filter
      if (searchTerm) {
        allDocuments = allDocuments.filter(doc =>
          doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      setDocuments(allDocuments)
      
      // Calculate stats based on all documents (not filtered)
      const allDocsResult = selectedCategory !== 'all' ? await getAllUnifiedDocuments() : result
      if (allDocsResult.success && allDocsResult.data) {
        const allDocsTransformed = allDocsResult.data.map(transformDocument)
        
        setStats({
          totalDocuments: allDocsTransformed.length,
          totalSize: formatFileSize(allDocsTransformed.reduce((sum, doc) => sum + doc.fileSize, 0)),
          documentsThisMonth: allDocsTransformed.filter(doc => {
            const docDate = new Date(doc.createdAt)
            const now = new Date()
            return docDate.getMonth() === now.getMonth() && docDate.getFullYear() === now.getFullYear()
          }).length,
          recentUploads: allDocsTransformed.filter(doc => {
            const docDate = new Date(doc.createdAt)
            const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
            return docDate > dayAgo
          }).length,
          categoryBreakdown: allDocsTransformed.reduce((acc, doc) => {
            acc[doc.category] = (acc[doc.category] || 0) + 1
            return acc
          }, {} as Record<string, number>)
        })
      }
      
    } catch (error) {
      console.error('Error loading documents:', error)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, searchTerm, filters])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  // Helper functions
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
  }

  const getCategoryIcon = (category: string) => {
    const cat = DOCUMENT_CATEGORIES.find(c => c.id === category)
    return cat ? cat.icon : FileText
  }

  const getCategoryColor = (category: string) => {
    const cat = DOCUMENT_CATEGORIES.find(c => c.id === category)
    return cat ? cat.color : 'gray'
  }

  const handleBulkDelete = async () => {
    if (!confirm(`선택한 ${selectedDocuments.length}개의 문서를 삭제하시겠습니까?`)) return
    
    // Implement bulk delete
    console.log('Deleting documents:', selectedDocuments)
    setSelectedDocuments([])
    await loadDocuments()
  }

  const handleBulkDownload = () => {
    // Implement bulk download
    console.log('Downloading documents:', selectedDocuments)
  }

  const handleBulkMove = () => {
    // Implement bulk move
    console.log('Moving documents:', selectedDocuments)
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`${
          touchMode === 'glove' ? 'p-5' : touchMode === 'precision' ? 'p-3' : 'p-4'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500`}>
                전체 문서
              </p>
              <p className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold`}>
                {stats.totalDocuments.toLocaleString()}개
              </p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        
        <Card className={`${
          touchMode === 'glove' ? 'p-5' : touchMode === 'precision' ? 'p-3' : 'p-4'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500`}>
                저장 용량
              </p>
              <p className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold`}>
                {stats.totalSize}
              </p>
            </div>
            <HardDrive className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        
        <Card className={`${
          touchMode === 'glove' ? 'p-5' : touchMode === 'precision' ? 'p-3' : 'p-4'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500`}>
                이번 달 업로드
              </p>
              <p className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold`}>
                {stats.documentsThisMonth}개
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
        
        <Card className={`${
          touchMode === 'glove' ? 'p-5' : touchMode === 'precision' ? 'p-3' : 'p-4'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500`}>
                최근 24시간
              </p>
              <p className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold`}>
                {stats.recentUploads}개
              </p>
            </div>
            <Clock className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Category Tabs */}
      <Card className={`${
        touchMode === 'glove' ? 'p-5' : touchMode === 'precision' ? 'p-3' : 'p-4'
      }`}>
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <div className="flex items-center justify-between mb-4">
            <TabsList className="flex-wrap h-auto p-1 gap-1">
              {DOCUMENT_CATEGORIES.map((category) => {
                const Icon = category.icon
                const count = category.id === 'all' 
                  ? stats.totalDocuments 
                  : stats.categoryBreakdown[category.id] || 0
                
                return (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className={`flex items-center gap-2 ${
                      touchMode === 'glove' ? 'px-4 py-3' : touchMode === 'precision' ? 'px-2 py-1' : 'px-3 py-2'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className={getFullTypographyClass('body', 'sm', isLargeFont)}>
                      {category.label}
                    </span>
                    <Badge variant="secondary" className="ml-1">
                      {count}
                    </Badge>
                  </TabsTrigger>
                )
              })}
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="compact"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className={`${
                  touchMode === 'glove' ? 'p-3' : touchMode === 'precision' ? 'p-1.5' : 'p-2'
                }`}
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="outline"
                size="compact"
                onClick={() => setShowFilters(!showFilters)}
                className={`${
                  touchMode === 'glove' ? 'px-4 py-3' : touchMode === 'precision' ? 'px-2 py-1' : 'px-3 py-2'
                }`}
              >
                <Filter className="h-4 w-4 mr-2" />
                필터
              </Button>
              
              <Button
                variant="outline"
                size="compact"
                onClick={loadDocuments}
                className={`${
                  touchMode === 'glove' ? 'p-3' : touchMode === 'precision' ? 'p-1.5' : 'p-2'
                }`}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="문서 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 pr-4 ${
                  touchMode === 'glove' ? 'py-3' : touchMode === 'precision' ? 'py-1.5' : 'py-2'
                } w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
              />
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className={`${
                    touchMode === 'glove' ? 'py-3' : touchMode === 'precision' ? 'py-1.5' : 'py-2'
                  } px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700`}
                >
                  <option value="all">모든 상태</option>
                  <option value="active">활성</option>
                  <option value="archived">보관</option>
                  <option value="deleted">삭제됨</option>
                </select>
                
                <select
                  value={filters.visibility}
                  onChange={(e) => setFilters({ ...filters, visibility: e.target.value })}
                  className={`${
                    touchMode === 'glove' ? 'py-3' : touchMode === 'precision' ? 'py-1.5' : 'py-2'
                  } px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700`}
                >
                  <option value="all">모든 공개범위</option>
                  <option value="private">비공개</option>
                  <option value="shared">공유</option>
                  <option value="public">공개</option>
                </select>
                
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                  className={`${
                    touchMode === 'glove' ? 'py-3' : touchMode === 'precision' ? 'py-1.5' : 'py-2'
                  } px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700`}
                >
                  <option value="all">전체 기간</option>
                  <option value="today">오늘</option>
                  <option value="week">이번 주</option>
                  <option value="month">이번 달</option>
                  <option value="year">올해</option>
                </select>
                
                <select
                  value={filters.fileType}
                  onChange={(e) => setFilters({ ...filters, fileType: e.target.value })}
                  className={`${
                    touchMode === 'glove' ? 'py-3' : touchMode === 'precision' ? 'py-1.5' : 'py-2'
                  } px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700`}
                >
                  <option value="all">모든 파일 형식</option>
                  <option value="pdf">PDF</option>
                  <option value="image">이미지</option>
                  <option value="document">문서</option>
                  <option value="spreadsheet">스프레드시트</option>
                </select>
                
                <Button
                  onClick={() => setFilters({
                    status: 'all',
                    visibility: 'all',
                    dateRange: 'all',
                    siteId: 'all',
                    fileType: 'all'
                  })}
                  variant="outline"
                  className={`${
                    touchMode === 'glove' ? 'py-3' : touchMode === 'precision' ? 'py-1.5' : 'py-2'
                  }`}
                >
                  필터 초기화
                </Button>
              </div>
            </div>
          )}

          {/* Bulk Actions Bar */}
          {selectedDocuments.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-between">
              <span className={getFullTypographyClass('body', 'sm', isLargeFont)}>
                {selectedDocuments.length}개 문서 선택됨
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="compact"
                  variant="outline"
                  onClick={handleBulkDownload}
                  className={`${
                    touchMode === 'glove' ? 'px-4 py-2' : touchMode === 'precision' ? 'px-2 py-1' : 'px-3 py-1.5'
                  }`}
                >
                  <Download className="h-4 w-4 mr-1" />
                  다운로드
                </Button>
                <Button
                  size="compact"
                  variant="outline"
                  onClick={handleBulkMove}
                  className={`${
                    touchMode === 'glove' ? 'px-4 py-2' : touchMode === 'precision' ? 'px-2 py-1' : 'px-3 py-1.5'
                  }`}
                >
                  <FolderPlus className="h-4 w-4 mr-1" />
                  이동
                </Button>
                <Button
                  size="compact"
                  variant="outline"
                  onClick={handleBulkDelete}
                  className={`${
                    touchMode === 'glove' ? 'px-4 py-2' : touchMode === 'precision' ? 'px-2 py-1' : 'px-3 py-1.5'
                  } text-red-600 hover:bg-red-50`}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  삭제
                </Button>
                <Button
                  size="compact"
                  variant="ghost"
                  onClick={() => setSelectedDocuments([])}
                  className={`${
                    touchMode === 'glove' ? 'px-4 py-2' : touchMode === 'precision' ? 'px-2 py-1' : 'px-3 py-1.5'
                  }`}
                >
                  선택 취소
                </Button>
              </div>
            </div>
          )}

          {/* Documents List/Grid */}
          {DOCUMENT_CATEGORIES.map((category) => (
            <TabsContent key={category.id} value={category.id} className="mt-0">
              {category.id === 'shared' ? (
                <div className="mt-6">
                  <UnifiedSharedDocumentsList />
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className={`${getFullTypographyClass('body', 'base', isLargeFont)} text-gray-500`}>
                    {category.id === 'all' ? '문서가 없습니다' : `${category.label} 문서가 없습니다`}
                  </p>
                  <p className={`${getFullTypographyClass('caption', 'sm', isLargeFont)} text-gray-400 mt-2`}>
                    {category.description}
                  </p>
                </div>
              ) : viewMode === 'list' ? (
                <div className="space-y-2">
                  {documents.map((doc) => {
                    const Icon = getCategoryIcon(doc.category)
                    const isSelected = selectedDocuments.includes(doc.id)
                    
                    return (
                      <div
                        key={doc.id}
                        className={`flex items-center gap-4 p-3 rounded-lg border ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                        } transition-colors`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDocuments([...selectedDocuments, doc.id])
                            } else {
                              setSelectedDocuments(selectedDocuments.filter(id => id !== doc.id))
                            }
                          }}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300"
                        />
                        
                        <Icon className={`h-8 w-8 text-${getCategoryColor(doc.category)}-500 flex-shrink-0`} />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className={`${getFullTypographyClass('body', 'base', isLargeFont)} font-medium truncate`}>
                              {doc.title}
                            </h3>
                            {doc.visibility === 'shared' && (
                              <Badge variant="secondary" className="text-xs">
                                <Share2 className="h-3 w-3 mr-1" />
                                공유
                              </Badge>
                            )}
                            {doc.folder_path && (
                              <Badge variant="outline" className="text-xs">
                                {doc.folder_path}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                            <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}>
                              {doc.fileName}
                            </span>
                            <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}>
                              {formatFileSize(doc.fileSize)}
                            </span>
                            {doc.site && (
                              <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}>
                                {doc.site.name}
                              </span>
                            )}
                            <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}>
                              {format(new Date(doc.createdAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex items-center gap-1 text-gray-500">
                            <Eye className="h-4 w-4" />
                            <span className={getFullTypographyClass('caption', 'xs', isLargeFont)}>
                              {doc.viewCount}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-500">
                            <Download className="h-4 w-4" />
                            <span className={getFullTypographyClass('caption', 'xs', isLargeFont)}>
                              {doc.downloadCount}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="compact"
                            className={`${
                              touchMode === 'glove' ? 'p-2' : touchMode === 'precision' ? 'p-1' : 'p-1.5'
                            }`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {documents.map((doc) => {
                    const Icon = getCategoryIcon(doc.category)
                    const isSelected = selectedDocuments.includes(doc.id)
                    
                    return (
                      <Card
                        key={doc.id}
                        className={`${
                          touchMode === 'glove' ? 'p-5' : touchMode === 'precision' ? 'p-3' : 'p-4'
                        } ${
                          isSelected 
                            ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'hover:shadow-lg'
                        } transition-all cursor-pointer`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <Icon className={`h-10 w-10 text-${getCategoryColor(doc.category)}-500`} />
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDocuments([...selectedDocuments, doc.id])
                              } else {
                                setSelectedDocuments(selectedDocuments.filter(id => id !== doc.id))
                              }
                            }}
                            className="h-4 w-4 text-blue-600 rounded border-gray-300"
                          />
                        </div>
                        
                        <h3 className={`${getFullTypographyClass('body', 'base', isLargeFont)} font-medium mb-1 line-clamp-2`}>
                          {doc.title}
                        </h3>
                        
                        {doc.description && (
                          <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500 mb-2 line-clamp-2`}>
                            {doc.description}
                          </p>
                        )}
                        
                        <div className="space-y-1 mb-3">
                          <div className="flex items-center justify-between">
                            <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}>
                              크기
                            </span>
                            <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} font-medium`}>
                              {formatFileSize(doc.fileSize)}
                            </span>
                          </div>
                          {doc.site && (
                            <div className="flex items-center justify-between">
                              <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}>
                                현장
                              </span>
                              <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} font-medium`}>
                                {doc.site.name}
                              </span>
                            </div>
                          )}
                          {doc.folder_path && (
                            <div className="flex items-center justify-between">
                              <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}>
                                경로
                              </span>
                              <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} font-medium`}>
                                {doc.folder_path}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            <Eye className="h-3 w-3 text-gray-400" />
                            <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}>
                              {doc.viewCount}
                            </span>
                            <Download className="h-3 w-3 text-gray-400 ml-2" />
                            <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}>
                              {doc.downloadCount}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="compact"
                            className="h-7 w-7 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </Card>

      {/* Admin Actions */}
      <Card className={`${
        touchMode === 'glove' ? 'p-5' : touchMode === 'precision' ? 'p-3' : 'p-4'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-semibold flex items-center gap-2`}>
            <Shield className="h-5 w-5" />
            시스템 관리 기능
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className={`${
              touchMode === 'glove' ? 'py-4' : touchMode === 'precision' ? 'py-2' : 'py-3'
            } flex flex-col items-center gap-2`}
          >
            <Archive className="h-5 w-5" />
            <span className={getFullTypographyClass('body', 'sm', isLargeFont)}>
              삭제된 문서 정리
            </span>
          </Button>
          
          <Button
            variant="outline"
            className={`${
              touchMode === 'glove' ? 'py-4' : touchMode === 'precision' ? 'py-2' : 'py-3'
            } flex flex-col items-center gap-2`}
          >
            <Search className="h-5 w-5" />
            <span className={getFullTypographyClass('body', 'sm', isLargeFont)}>
              검색 인덱스 재구축
            </span>
          </Button>
          
          <Button
            variant="outline"
            className={`${
              touchMode === 'glove' ? 'py-4' : touchMode === 'precision' ? 'py-2' : 'py-3'
            } flex flex-col items-center gap-2`}
          >
            <FileSpreadsheet className="h-5 w-5" />
            <span className={getFullTypographyClass('body', 'sm', isLargeFont)}>
              사용 현황 리포트
            </span>
          </Button>
          
          <Button
            variant="outline"
            className={`${
              touchMode === 'glove' ? 'py-4' : touchMode === 'precision' ? 'py-2' : 'py-3'
            } flex flex-col items-center gap-2`}
          >
            <Settings className="h-5 w-5" />
            <span className={getFullTypographyClass('body', 'sm', isLargeFont)}>
              권한 감사
            </span>
          </Button>
        </div>
      </Card>
    </div>
  )
}