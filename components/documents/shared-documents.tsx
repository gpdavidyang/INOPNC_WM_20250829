'use client'


interface SharedDocumentsProps {
  profile: unknown
  initialSearch?: string
}

interface SharedDocument {
  id: string
  category: string
  name: string
  size: number
  uploadDate: string
  lastModified: string
  uploadedBy: string
  fileType: string
  url?: string
  accessLevel: 'public' | 'site' | 'organization' | 'role'
  site?: { id: string; name: string }
  organization?: { id: string; name: string }
}

const sharedCategories = [
  {
    id: 'site-docs',
    name: '현장 공통 문서',
    icon: Building2,
    color: 'bg-blue-100 text-blue-700',
    description: '현장 도면, 작업 지침서, 공사 계획서',
    accessLevel: 'site'
  },
  {
    id: 'safety-docs',
    name: '안전관리 문서',
    icon: Shield,
    color: 'bg-red-100 text-red-700',
    description: '안전 규정, MSDS, 위험성 평가서',
    accessLevel: 'public'
  },
  {
    id: 'technical-specs',
    name: '기술 사양서',
    icon: FileSpreadsheet,
    color: 'bg-purple-100 text-purple-700',
    description: '자재 사양서, 시공 상세도, 품질 기준서',
    accessLevel: 'site'
  },
  {
    id: 'company-notices',
    name: '회사 공지사항',
    icon: AlertCircle,
    color: 'bg-yellow-100 text-yellow-700',
    description: '인사 공지, 규정 변경, 행사 안내',
    accessLevel: 'organization'
  },
  {
    id: 'forms-templates',
    name: '양식/템플릿',
    icon: ClipboardList,
    color: 'bg-green-100 text-green-700',
    description: '업무 양식, 보고서 템플릿, 신청서 양식',
    accessLevel: 'public'
  },
  {
    id: 'education-materials',
    name: '교육 자료',
    icon: HardHat,
    color: 'bg-indigo-100 text-indigo-700',
    description: '안전교육, 기술교육, 신규자 OJT',
    accessLevel: 'organization'
  }
]

export function SharedDocuments({ profile, initialSearch }: SharedDocumentsProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  
  console.log('SharedDocuments - initialSearch:', initialSearch)
  console.log('SharedDocuments - auto-selected category:', initialSearch === '공도면' ? 'site-docs' : null)
  
  // Auto-select appropriate category based on initial search
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    initialSearch === '공도면' ? 'site-docs' : null
  )
  const [documents, setDocuments] = useState<SharedDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState(initialSearch || '')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [sortBy, setSortBy] = useState('date')
  const [viewMode, setViewMode] = useState('list')

  useEffect(() => {
    if (selectedCategory) {
      loadDocuments()
    }
  }, [selectedCategory, filterRole])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const result = await getSharedDocuments({
        category: selectedCategory!,
        userId: profile?.id,
        siteId: profile?.site_id,
        organizationId: profile?.organization_id,
        role: profile?.role
      })
      
      if (result.success && result.data) {
        setDocuments(result.data)
      }
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const FILE_TYPES: Record<string, unknown> = {
    pdf: { icon: FileText, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
    doc: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    docx: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    xls: { icon: FileSpreadsheet, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    xlsx: { icon: FileSpreadsheet, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    jpg: { icon: FileImage, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    jpeg: { icon: FileImage, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    png: { icon: FileImage, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    zip: { icon: FileArchive, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    default: { icon: File, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900/20' }
  }

  const getFileTypeConfig = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || ''
    return FILE_TYPES[ext as keyof typeof FILE_TYPES] || FILE_TYPES.default
  }

  const getAccessBadge = (accessLevel: string) => {
    switch (accessLevel) {
      case 'public':
        return <Badge variant="secondary">전체 공개</Badge>
      case 'site':
        return <Badge variant="secondary">현장 공유</Badge>
      case 'organization':
        return <Badge variant="warning">회사 내부</Badge>
      case 'role':
        return <Badge variant="default">역할 제한</Badge>
      default:
        return null
    }
  }

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedCategoryInfo = sharedCategories.find(cat => cat.id === selectedCategory)

  // Filter categories based on user access
  const accessibleCategories = sharedCategories.filter(category => {
    if (category.accessLevel === 'public') return true
    if (category.accessLevel === 'site' && profile?.site_id) return true
    if (category.accessLevel === 'organization' && profile?.organization_id) return true
    if (category.accessLevel === 'role' && profile?.role && ['admin', 'site_manager'].includes(profile.role)) return true
    return false
  })

  if (!selectedCategory) {
    // Mobile-Optimized Category Selection View
    return (
      <div className="space-y-2">
        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              공유문서함
            </h2>
            <Badge variant="secondary" className="text-xs">
              {profile?.role === 'admin' ? '관리자' : profile?.role === 'site_manager' ? '현장소장' : '작업자'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {accessibleCategories.map((category: unknown) => {
            const Icon = category.icon
            return (
              <Card
                key={category.id}
                className="p-3 cursor-pointer hover:shadow-md transition-all touch-manipulation min-h-[100px]"
                onClick={() => setSelectedCategory(category.id)}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className={cn("p-3 rounded-xl", category.color)}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      {category.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {category.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  // Mobile-Optimized Document List View
  return (
    <div className="space-y-2">
      {/* Mobile-Optimized Header */}
      <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="h-12 px-3 min-w-[48px]"
            >
              ← 뒤로
            </Button>
            {selectedCategoryInfo && (
              <>
                <div className={cn("p-2 rounded-lg", selectedCategoryInfo.color)}>
                  <selectedCategoryInfo.icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {selectedCategoryInfo.name}
                  </h2>
                  <span className="text-xs text-gray-500">
                    {filteredDocuments.length}개 문서
                  </span>
                </div>
              </>
            )}
          </div>
          
          {/* Touch-Optimized View Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded transition-colors min-w-[48px] h-10",
                viewMode === 'list'
                  ? "bg-white dark:bg-gray-600 text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <List className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded transition-colors min-w-[48px] h-10",
                viewMode === 'grid'
                  ? "bg-white dark:bg-gray-600 text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Grid3x3 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Search and Filter Controls */}
      <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border space-y-3">
        {/* Search Input - Full Width on Mobile */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="파일명으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 text-sm bg-gray-50 dark:bg-gray-700/50"
          />
        </div>
        
        {/* Filter Controls Row */}
        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <CustomSelect value={sortBy} onValueChange={setSortBy}>
            <CustomSelectTrigger className={cn(
              "flex-1",
              touchMode === 'glove' && "min-h-[60px] text-base",
              touchMode === 'precision' && "min-h-[44px] text-sm",
              touchMode !== 'precision' && touchMode !== 'glove' && "min-h-[40px] text-sm"
            )}>
              <CustomSelectValue placeholder="정렬 방식" />
            </CustomSelectTrigger>
            <CustomSelectContent>
              <CustomSelectItem value="date">날짜순</CustomSelectItem>
              <CustomSelectItem value="name">이름순</CustomSelectItem>
              <CustomSelectItem value="size">크기순</CustomSelectItem>
            </CustomSelectContent>
          </CustomSelect>
          
          <Button variant="outline" size="sm" className="h-10 px-3 min-w-[80px]">
            <Filter className="h-4 w-4 mr-1" />
            필터
          </Button>
        </div>
      </div>

      {/* Document List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">
          문서를 불러오는 중...
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card className="p-12 text-center">
          <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm ? '검색 결과가 없습니다.' : '이 카테고리에 공유된 문서가 없습니다.'}
          </p>
        </Card>
      ) : viewMode === 'list' ? (
        /* Mobile-Optimized List View */
        <div className="bg-white dark:bg-gray-800 rounded-lg border divide-y">
          {filteredDocuments.map((doc: unknown) => {
            const fileConfig = getFileTypeConfig(doc.name)
            const FileIcon = fileConfig.icon
            
            return (
              <div
                key={doc.id}
                className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors min-h-[60px]"
              >
                {/* File Icon with Type-based Color */}
                <div className={cn("mr-3 p-2 rounded-lg", fileConfig.bg)}>
                  <FileIcon className={cn("h-5 w-5", fileConfig.color)} />
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {doc.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {formatFileSize(doc.size)}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(doc.uploadDate), 'MM월 dd일', { locale: ko })}
                    </span>
                    <div className="hidden sm:flex items-center">
                      <span className="text-xs text-gray-400 mx-2">•</span>
                      <span className="text-xs text-gray-500">
                        {doc.uploadedBy}
                      </span>
                    </div>
                  </div>
                  {/* Mobile Access Badge */}
                  <div className="mt-1 sm:hidden">
                    {getAccessBadge(doc.accessLevel)}
                  </div>
                </div>

                {/* Desktop Access Badge */}
                <div className="hidden sm:block mr-3">
                  {getAccessBadge(doc.accessLevel)}
                </div>

                {/* Touch-Optimized Quick Actions */}
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-12 w-12 min-w-[48px]">
                    <Eye className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-12 w-12 min-w-[48px]">
                    <Download className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Mobile-Optimized Grid View */
        <div className="grid grid-cols-2 gap-2">
          {filteredDocuments.map((doc: unknown) => {
            const fileConfig = getFileTypeConfig(doc.name)
            const FileIcon = fileConfig.icon
            
            return (
              <Card
                key={doc.id}
                className="p-3 hover:shadow-md transition-all cursor-pointer touch-manipulation min-h-[140px]"
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className={cn("p-2 rounded-lg", fileConfig.bg)}>
                    <FileIcon className={cn("h-6 w-6", fileConfig.color)} />
                  </div>
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                    {doc.name}
                  </p>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">
                      {formatFileSize(doc.size)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(doc.uploadDate), 'MM/dd', { locale: ko })}
                    </p>
                    <div className="mt-1">
                      {getAccessBadge(doc.accessLevel)}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}