'use client'


interface DocumentsPageImprovedProps {
  profile: unknown
}

// Modern tab data structure
const DOCUMENT_TABS = [
  { id: 'my-documents', label: '내문서함', icon: FolderOpen, count: 3 },
  { id: 'shared', label: '공유문서함', icon: Share2, count: 0 },
  { id: 'markup', label: '도면마킹', icon: FileText, count: 1 }
]

// Filter options
const FILTER_OPTIONS = [
  { value: 'all', label: '전체 현장' },
  { value: 'recent', label: '최근 7일' },
  { value: 'this-month', label: '이번 달' }
]

// View modes
const VIEW_MODES = [
  { id: 'grid', icon: Grid3x3, label: '격자 보기' },
  { id: 'list', icon: List, label: '목록 보기' }
]

export function DocumentsPageImproved({ profile }: DocumentsPageImprovedProps) {
  const [activeTab, setActiveTab] = useState('my-documents')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterValue, setFilterValue] = useState('all')
  const [viewMode, setViewMode] = useState('list')
  const [selectedDocs, setSelectedDocs] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)

  // Sample documents data
  const documents = [
    {
      id: '1',
      name: '인전관리지침_2024.pdf',
      type: 'pdf',
      size: '8월 1일',
      date: '2024-08-01',
      status: 'completed'
    },
    {
      id: '2',
      name: '콘크리트 시공기준_KCS.pdf',
      type: 'pdf',
      size: '7월 30일',
      date: '2024-07-30',
      status: 'completed'
    },
    {
      id: '3',
      name: '인사규정_개정판.docx',
      type: 'doc',
      size: '7월 29일',
      date: '2024-07-29',
      status: 'processing'
    }
  ]

  const getFileIcon = (type: string) => {
    switch(type) {
      case 'pdf': return <FileText className="h-5 w-5 text-red-500" />
      case 'doc': 
      case 'docx': return <FileText className="h-5 w-5 text-blue-500" />
      case 'xls':
      case 'xlsx': return <FileSpreadsheet className="h-5 w-5 text-green-500" />
      case 'image': return <Image className="h-5 w-5 text-purple-500" />
      default: return <File className="h-5 w-5 text-gray-500" />
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    // Handle file upload
    const files = Array.from(e.dataTransfer.files)
    console.log('Dropped files:', files)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Compact Header Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3">
          {/* Modern Tab Navigation - Horizontal Pills Style */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700/50 rounded-full p-1">
              {DOCUMENT_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                    activeTab === tab.id
                      ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={cn(
                      "ml-1 px-2 py-0.5 text-xs rounded-full",
                      activeTab === tab.id
                        ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                        : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {selectedDocs.length > 0 ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDocs([])}
                    className="text-gray-600 dark:text-gray-400"
                  >
                    <X className="h-4 w-4 mr-1" />
                    선택 해제 ({selectedDocs.length})
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    다운로드
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    파일 업로드
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Compact Search and Filter Bar */}
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="파일명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 h-9 text-sm bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
              />
            </div>

            {/* Filter Dropdown */}
            <select
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="h-9 px-3 text-sm font-medium border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              {FILTER_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Quick Filters */}
            <div className="hidden sm:flex items-center gap-1">
              <Button
                variant={filterValue === 'recent' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-9 px-3 text-sm"
                onClick={() => setFilterValue('recent')}
              >
                날짜순
              </Button>
              <Button
                variant={filterValue === 'name' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-9 px-3 text-sm"
                onClick={() => setFilterValue('name')}
              >
                이름순
              </Button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
              {VIEW_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  className={cn(
                    "p-1.5 rounded transition-colors",
                    viewMode === mode.id
                      ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  )}
                  title={mode.label}
                >
                  <mode.icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4">
        {activeTab === 'my-documents' && documents.length === 0 ? (
          // Compact Upload Area - Only show when no documents
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative rounded-xl border-2 border-dashed transition-all duration-200",
              isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            )}
          >
            <div className="py-8 px-4 text-center">
              <Upload className={cn(
                "h-10 w-10 mx-auto mb-3 transition-colors",
                isDragging ? "text-blue-500" : "text-gray-400"
              )} />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                파일을 드래그하여 업로드하거나
              </p>
              <Button variant="link" className="text-blue-600 dark:text-blue-400 text-sm">
                파일 선택
              </Button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                PDF, DOC, XLS, JPG, PNG 파일 지원 (최대 10MB)
              </p>
            </div>
          </div>
        ) : (
          // Document List - Compact Design
          <div className="space-y-2">
            {/* Quick Stats Bar */}
            <div className="flex items-center justify-between px-2 py-1 text-sm text-gray-600 dark:text-gray-400">
              <span>전체 {documents.length}개 문서</span>
              <span>필수 제출 서류 (0/6개 완료)</span>
            </div>

            {/* Document Items */}
            {viewMode === 'list' ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedDocs.includes(doc.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDocs([...selectedDocs, doc.id])
                        } else {
                          setSelectedDocs(selectedDocs.filter(id => id !== doc.id))
                        }
                      }}
                      className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />

                    {/* File Icon */}
                    <div className="mr-3">
                      {getFileIcon(doc.type)}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {doc.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {doc.size}
                      </p>
                    </div>

                    {/* Status Badge */}
                    {doc.status === 'processing' && (
                      <span className="mx-3 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                        처리중
                      </span>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Grid View
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {documents.map((doc) => (
                  <Card
                    key={doc.id}
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-3">
                        {getFileIcon(doc.type)}
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">
                        {doc.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {doc.size}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Additional Tabs Content */}
        {activeTab === 'shared' && (
          <div className="flex flex-col items-center justify-center py-16">
            <Share2 className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              공유된 문서가 없습니다
            </p>
          </div>
        )}

        {activeTab === 'markup' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <div className="mr-3">
                <FileText className="h-5 w-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  이제2
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  도면 • 8월 1일
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}