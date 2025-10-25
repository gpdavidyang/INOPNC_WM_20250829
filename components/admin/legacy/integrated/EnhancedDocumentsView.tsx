'use client'

interface Document {
  id: string
  category_type: string
  title: string
  file_name: string
  original_filename?: string
  file_url: string
  description?: string
  site_id?: string
  site?: {
    id: string
    name: string
    address?: string
  }
  uploaded_by: string
  uploader?: {
    id: string
    full_name: string
    role: string
  }
  created_at: string
  updated_at?: string
  file_size?: number
  mime_type?: string
  status?: string
  is_public?: boolean
  tags?: string[]
}

interface Site {
  id: string
  name: string
}

interface DocumentStats {
  total: number
  by_category: Record<string, number>
  by_type: Record<string, number>
  by_site: Record<string, number>
}

export default function EnhancedDocumentsView() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [statistics, setStatistics] = useState<DocumentStats | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [activeCategory, selectedSite, selectedType])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch sites for filtering
      const sitesRes = await fetch('/api/sites')
      if (sitesRes.ok) {
        const sitesData = await sitesRes.json()
        if (sitesData.success) {
          setSites(sitesData.data.filter((s: Site) => s.id !== 'all'))
        }
      }

      await fetchDocuments()
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDocuments = async () => {
    try {
      const params = new URLSearchParams()

      // Use unified API with proper parameters
      if (selectedSite !== 'all') params.append('site_id', selectedSite)
      if (selectedType !== 'all') params.append('status', selectedType)

      const url = '/api/unified-documents?' + params.toString()
      console.log('Fetching documents with URL:', url)

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()

        // Use documents array from API response
        const documentsArray = data.data || data.documents || []

        console.log('EnhancedDocumentsView - API Response:', data)
        console.log('EnhancedDocumentsView - Documents Array Length:', documentsArray.length)
        console.log('EnhancedDocumentsView - Documents Sample:', documentsArray.slice(0, 3))
        console.log('EnhancedDocumentsView - Statistics:', data.statistics)
        console.log('EnhancedDocumentsView - Active Category:', activeCategory)
        console.log(
          'EnhancedDocumentsView - Documents by category breakdown:',
          documentsArray.reduce((acc, doc) => {
            const cat = doc.category_type || 'unknown'
            acc[cat] = (acc[cat] || 0) + 1
            return acc
          }, {})
        )

        setDocuments(documentsArray)

        // Use statistics from API response
        if (data.statistics) {
          setStatistics({
            total: data.statistics.total_documents || 0,
            by_category: data.statistics.by_category || {},
            by_type: data.statistics.by_status || {},
            by_site: {},
          })
        } else {
          // Calculate statistics if not provided
          const stats: DocumentStats = {
            total: documentsArray.length,
            by_category: {},
            by_type: {},
            by_site: {},
          }

          documentsArray.forEach((doc: Document) => {
            // By category
            const categoryType = doc.category_type || 'shared'
            stats.by_category[categoryType] = (stats.by_category[categoryType] || 0) + 1

            // By status
            if (doc.status) {
              stats.by_type[doc.status] = (stats.by_type[doc.status] || 0) + 1
            }

            // By site
            if (doc.site?.name) {
              stats.by_site[doc.site.name] = (stats.by_site[doc.site.name] || 0) + 1
            }
          })

          setStatistics(stats)
        }
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }

  const getCategoryIcon = (category: string) => {
    const icons = {
      shared: FileText,
      markup: Image,
      required: Shield,
      invoice: Package,
    }
    return icons[category as keyof typeof icons] || FileText
  }

  const getCategoryConfig = (category: string) => {
    const configs = {
      all: { name: '전체 문서', color: 'gray', icon: Folder },
      shared: { name: '공유문서함', color: 'blue', icon: FileText },
      markup: { name: '도면마킹문서함', color: 'purple', icon: Image },
      required: { name: '필수제출서류함', color: 'green', icon: Shield },
      required_user_docs: { name: '필수제출서류함', color: 'green', icon: Shield },
      invoice: { name: '기성청구문서함', color: 'orange', icon: Package },
      photo_grid: { name: '사진대지문서함', color: 'pink', icon: FileImage },
    }
    return configs[category as keyof typeof configs] || configs.all
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    const iconMap: Record<string, unknown> = {
      pdf: FileType,
      jpg: FileImage,
      jpeg: FileImage,
      png: FileImage,
      gif: FileImage,
      xls: FileSpreadsheet,
      xlsx: FileSpreadsheet,
      zip: FileArchive,
      rar: FileArchive,
    }
    return iconMap[ext || ''] || File
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const filteredDocuments = documents.filter(doc => {
    // Filter by category
    const matchesCategory =
      activeCategory === 'all' || (doc.category_type || 'shared') === activeCategory

    // Filter by search term
    const matchesSearch =
      searchTerm === '' ||
      doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesCategory && matchesSearch
  })

  // Log filtering results
  console.log('EnhancedDocumentsView - Filtering Results:', {
    totalDocuments: documents.length,
    activeCategory,
    filteredDocuments: filteredDocuments.length,
    filteredSample: filteredDocuments.slice(0, 3).map(doc => ({
      id: doc.id,
      fileName: doc.file_name,
      categoryType: doc.category_type,
      title: doc.title,
      siteId: doc.site_id,
      siteName: doc.site?.name,
    })),
  })

  const categories = [
    { id: 'all', ...getCategoryConfig('all') },
    { id: 'shared', ...getCategoryConfig('shared') },
    { id: 'markup', ...getCategoryConfig('markup') },
    { id: 'required', ...getCategoryConfig('required') },
    { id: 'invoice', ...getCategoryConfig('invoice') },
    { id: 'photo_grid', ...getCategoryConfig('photo_grid') },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-6">
          {categories.map(category => {
            const Icon = category.icon
            const count =
              category.id === 'all' ? statistics?.total : statistics?.by_category[category.id] || 0

            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeCategory === category.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {category.name}
                <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full text-xs">
                  {count}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="문서 검색..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-white text-gray-900 dark:text-gray-900"
            />
          </div>

          {/* Site Filter */}
          <CustomSelect value={selectedSite} onValueChange={setSelectedSite}>
            <CustomSelectTrigger className="w-48">
              <CustomSelectValue placeholder="전체 현장" />
            </CustomSelectTrigger>
            <CustomSelectContent>
              <CustomSelectItem value="all">전체 현장</CustomSelectItem>
              {sites.map(site => (
                <CustomSelectItem key={site.id} value={site.id}>
                  {site.name}
                </CustomSelectItem>
              ))}
            </CustomSelectContent>
          </CustomSelect>

          {/* Document Type Filter */}
          <CustomSelect value={selectedType} onValueChange={setSelectedType}>
            <CustomSelectTrigger className="w-48">
              <CustomSelectValue placeholder="전체 문서 유형" />
            </CustomSelectTrigger>
            <CustomSelectContent>
              <CustomSelectItem value="all">전체 문서 유형</CustomSelectItem>
              <CustomSelectItem value="contract">계약서</CustomSelectItem>
              <CustomSelectItem value="plan">도면</CustomSelectItem>
              <CustomSelectItem value="report">보고서</CustomSelectItem>
              <CustomSelectItem value="safety">안전서류</CustomSelectItem>
              <CustomSelectItem value="quality">품질서류</CustomSelectItem>
              <CustomSelectItem value="invoice">청구서</CustomSelectItem>
              <CustomSelectItem value="other">기타</CustomSelectItem>
            </CustomSelectContent>
          </CustomSelect>

          {/* View Mode Toggle */}
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm font-medium rounded-l-md border flex items-center justify-center ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-b border-r flex items-center justify-center ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Upload Button */}
          <Link
            href="/dashboard/admin/documents/upload"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium whitespace-nowrap"
          >
            문서 업로드
          </Link>
        </div>
      </div>

      {/* Statistics Summary */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">전체 문서</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {statistics.total}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">문서 유형</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Object.keys(statistics.by_type).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">관련 현장</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Object.keys(statistics.by_site).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">이번 달 업로드</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {
                documents.filter(d => new Date(d.created_at).getMonth() === new Date().getMonth())
                  .length
              }
            </p>
          </div>
        </div>
      )}

      {/* Documents Display */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || selectedSite !== 'all' || selectedType !== 'all'
              ? '검색 결과가 없습니다'
              : activeCategory === 'shared'
                ? '공유문서함에 등록된 문서가 없습니다'
                : activeCategory === 'markup'
                  ? '도면마킹문서함에 등록된 문서가 없습니다'
                  : activeCategory === 'required'
                    ? '필수제출서류함에 등록된 문서가 없습니다'
                    : activeCategory === 'invoice'
                      ? '기성청구문서함에 등록된 문서가 없습니다'
                      : activeCategory === 'photo_grid'
                        ? '사진대지문서함에 등록된 문서가 없습니다'
                        : '등록된 문서가 없습니다'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocuments.map(doc => {
            const FileIcon = getFileIcon(doc.file_name)
            const categoryConfig = getCategoryConfig(doc.category_type)

            return (
              <div
                key={doc.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <FileIcon className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-${categoryConfig.color}-100 text-${categoryConfig.color}-800 dark:bg-${categoryConfig.color}-900/20 dark:text-${categoryConfig.color}-300`}
                    >
                      {categoryConfig.name}
                    </span>
                  </div>

                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 truncate">
                    {doc.title}
                  </h4>

                  {doc.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                      {doc.description}
                    </p>
                  )}

                  <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                    {doc.site?.name && (
                      <div className="flex items-center">
                        <Building2 className="h-3 w-3 mr-1" />
                        {doc.site.name}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(doc.created_at), 'yyyy.MM.dd', { locale: ko })}
                    </div>
                    {doc.uploader?.full_name && (
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {doc.uploader.full_name}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {doc.category_type === 'photo_grid'
                        ? 'PDF 문서'
                        : formatFileSize(doc.file_size)}
                    </span>
                    <div className="flex gap-2">
                      {doc.category_type === 'photo_grid' ? (
                        // Photo grid (legacy) → open photosheet live preview if mapping exists
                        <>
                          <button
                            onClick={() => {
                              let meta: any = doc.metadata
                              if (typeof meta === 'string') {
                                try {
                                  meta = JSON.parse(meta)
                                } catch {
                                  meta = {}
                                }
                              }
                              const sheetId = meta?.photosheet_id as string | undefined
                              if (sheetId) {
                                window.open(
                                  `/dashboard/admin/tools/photo-grid/preview/live?sheet_id=${encodeURIComponent(sheetId)}`,
                                  '_blank'
                                )
                              } else {
                                alert(
                                  '레거시 사진대지 문서는 새 미리보기를 지원하지 않습니다. 마이그레이션 후 이용해 주세요.'
                                )
                              }
                            }}
                            className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 rounded"
                            title="미리보기"
                          >
                            보기
                          </button>
                          <button
                            onClick={() => {
                              let meta: any = doc.metadata
                              if (typeof meta === 'string') {
                                try {
                                  meta = JSON.parse(meta)
                                } catch {
                                  meta = {}
                                }
                              }
                              const sheetId = meta?.photosheet_id as string | undefined
                              if (sheetId) {
                                window.open(
                                  `/dashboard/admin/tools/photo-grid/preview/live?auto=print&sheet_id=${encodeURIComponent(sheetId)}`,
                                  '_blank'
                                )
                              } else {
                                alert(
                                  '레거시 사진대지 문서는 직접 다운로드를 지원하지 않습니다. 마이그레이션 후 이용해 주세요.'
                                )
                              }
                            }}
                            className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800 rounded inline-block ml-2"
                            title="인쇄"
                          >
                            인쇄
                          </button>
                        </>
                      ) : (
                        // Default handling for other document types
                        <>
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 rounded inline-block"
                          >
                            보기
                          </a>
                          <a
                            href={doc.file_url}
                            download
                            className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800 rounded inline-block ml-2"
                          >
                            다운로드
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Table View - matching sidebar document management style */
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              전체 {filteredDocuments.length}개의 공유 문서
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {filteredDocuments.length > 0 ? '1 / 0 페이지' : '공유 문서가 없습니다'}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    문서 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    현장
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    등록자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    파일 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    생성일
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDocuments.map(doc => {
                  const FileIcon = getFileIcon(doc.file_name)
                  const categoryConfig = getCategoryConfig(doc.category_type)

                  return (
                    <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 bg-gray-100 dark:bg-gray-600 rounded flex items-center justify-center">
                              <FileIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {doc.title}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {doc.description || doc.file_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {doc.site?.name || '-'}
                        </div>
                        {doc.site?.address && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {doc.site.address}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {doc.uploader?.full_name || '알 수 없음'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {doc.uploader?.role || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {doc.file_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {doc.category_type === 'photo_grid'
                            ? 'PDF 문서'
                            : formatFileSize(doc.file_size)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(doc.created_at), 'yyyy.MM.dd', { locale: ko })}
                        <div className="text-xs">
                          {format(new Date(doc.created_at), 'HH:mm', { locale: ko })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1">
                          {doc.category_type === 'photo_grid' ? (
                            // Photo grid (legacy) → open photosheet live preview if mapping exists
                            <>
                              <button
                                onClick={() => {
                                  let meta: any = doc.metadata
                                  if (typeof meta === 'string') {
                                    try {
                                      meta = JSON.parse(meta)
                                    } catch {
                                      meta = {}
                                    }
                                  }
                                  const sheetId = meta?.photosheet_id as string | undefined
                                  if (sheetId) {
                                    window.open(
                                      `/dashboard/admin/tools/photo-grid/preview/live?sheet_id=${encodeURIComponent(sheetId)}`,
                                      '_blank'
                                    )
                                  } else {
                                    alert(
                                      '레거시 사진대지 문서는 새 미리보기를 지원하지 않습니다. 마이그레이션 후 이용해 주세요.'
                                    )
                                  }
                                }}
                                className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 rounded"
                                title="미리보기"
                              >
                                보기
                              </button>
                              <button
                                onClick={() => {
                                  let meta: any = doc.metadata
                                  if (typeof meta === 'string') {
                                    try {
                                      meta = JSON.parse(meta)
                                    } catch {
                                      meta = {}
                                    }
                                  }
                                  const sheetId = meta?.photosheet_id as string | undefined
                                  if (sheetId) {
                                    window.open(
                                      `/dashboard/admin/tools/photo-grid/preview/live?auto=print&sheet_id=${encodeURIComponent(sheetId)}`,
                                      '_blank'
                                    )
                                  } else {
                                    alert(
                                      '레거시 사진대지 문서는 직접 다운로드를 지원하지 않습니다. 마이그레이션 후 이용해 주세요.'
                                    )
                                  }
                                }}
                                className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800 rounded inline-block ml-2"
                                title="인쇄"
                              >
                                인쇄
                              </button>
                              <button
                                className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 rounded ml-2"
                                title="삭제"
                              >
                                삭제
                              </button>
                            </>
                          ) : (
                            // Default handling for other document types
                            <>
                              <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 rounded"
                                title="보기"
                              >
                                보기
                              </a>
                              <a
                                href={doc.file_url}
                                download
                                className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800 rounded inline-block ml-2"
                                title="다운로드"
                              >
                                다운로드
                              </a>
                              <button
                                className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 rounded ml-2"
                                title="삭제"
                              >
                                삭제
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
