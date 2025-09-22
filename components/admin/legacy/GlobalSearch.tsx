'use client'


interface SearchResult {
  id: string
  type: 'user' | 'site' | 'document' | 'report' | 'material'
  title: string
  subtitle?: string
  description?: string
  url: string
  metadata?: unknown
}

interface RecentSearch {
  query: string
  timestamp: Date
}

export default function GlobalSearch() {
  const router = useRouter()
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([])
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [showResults, setShowResults] = useState(false)
  
  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('admin_recent_searches')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setRecentSearches(parsed.map((s: unknown) => ({
          ...s,
          timestamp: new Date(s.timestamp)
        })))
      } catch (e) {
        console.error('Failed to parse recent searches:', e)
      }
    }
  }, [])
  
  // Save recent search
  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return
    
    const newSearch: RecentSearch = {
      query: query.trim(),
      timestamp: new Date()
    }
    
    const updated = [
      newSearch,
      ...recentSearches.filter(s => s.query !== query).slice(0, 4)
    ]
    
    setRecentSearches(updated)
    localStorage.setItem('admin_recent_searches', JSON.stringify(updated))
  }
  
  // Perform search
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([])
      setShowResults(false)
      return
    }
    
    setSearching(true)
    setShowResults(true)
    
    try {
      // TODO: Replace with actual API calls
      // For now, using mock data
      const mockResults: SearchResult[] = []
      
      // Search users
      if (activeFilter === 'all' || activeFilter === 'users') {
        mockResults.push(
          {
            id: '1',
            type: 'user',
            title: '김철수',
            subtitle: 'worker@inopnc.com',
            description: '서울현장 작업자',
            url: '/dashboard/admin/users?id=1'
          },
          {
            id: '2',
            type: 'user',
            title: '이영희',
            subtitle: 'manager@inopnc.com',
            description: '부산현장 관리자',
            url: '/dashboard/admin/users?id=2'
          }
        )
      }
      
      // Search sites
      if (activeFilter === 'all' || activeFilter === 'sites') {
        mockResults.push(
          {
            id: '3',
            type: 'site',
            title: '서울 강남 현장',
            subtitle: '강남구 삼성동',
            description: '활성 현장 - 작업자 25명',
            url: '/dashboard/admin/sites?id=3'
          }
        )
      }
      
      // Search documents
      if (activeFilter === 'all' || activeFilter === 'documents') {
        mockResults.push(
          {
            id: '4',
            type: 'document',
            title: '안전 관리 지침서',
            subtitle: '2025-08-01 업로드',
            description: 'PDF - 2.5MB',
            url: '/dashboard/admin/shared-documents?id=4'
          }
        )
      }
      
      // Search reports
      if (activeFilter === 'all' || activeFilter === 'reports') {
        mockResults.push(
          {
            id: '5',
            type: 'report',
            title: '일일 작업 보고서',
            subtitle: '2025-08-03',
            description: '서울 강남 현장 - 승인됨',
            url: '/dashboard/daily-reports?id=5'
          }
        )
      }
      
      // Filter by search query
      const filtered = mockResults.filter(result => 
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.subtitle?.toLowerCase().includes(query.toLowerCase()) ||
        result.description?.toLowerCase().includes(query.toLowerCase())
      )
      
      setResults(filtered)
      
      // Save to recent searches
      saveRecentSearch(query)
      
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setSearching(false)
    }
  }
  
  // Handle search input change with debounce
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // Set new timeout
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value)
    }, 300)
  }
  
  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(searchQuery)
  }
  
  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    router.push(result.url)
    setIsOpen(false)
    setSearchQuery('')
    setResults([])
    setShowResults(false)
  }
  
  // Handle recent search click
  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query)
    performSearch(query)
  }
  
  // Get icon for result type
  const getResultIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Users className="h-4 w-4" />
      case 'site':
        return <Building2 className="h-4 w-4" />
      case 'document':
        return <FileText className="h-4 w-4" />
      case 'report':
        return <Activity className="h-4 w-4" />
      default:
        return <Search className="h-4 w-4" />
    }
  }
  
  // Get badge color for result type
  const getResultBadgeClass = (type: string) => {
    switch (type) {
      case 'user':
        return 'bg-blue-100 text-blue-800'
      case 'site':
        return 'bg-green-100 text-green-800'
      case 'document':
        return 'bg-yellow-100 text-yellow-800'
      case 'report':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
        setTimeout(() => searchInputRef.current?.focus(), 100)
      }
      
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setSearchQuery('')
        setResults([])
        setShowResults(false)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])
  
  return (
    <>
      {/* Search Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setIsOpen(true)
          setTimeout(() => searchInputRef.current?.focus(), 100)
        }}
        className={`${
          touchMode === 'glove' ? 'h-12 px-4' : touchMode === 'precision' ? 'h-8 px-2' : 'h-10 px-3'
        } flex items-center gap-2`}
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">검색</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
          <span>⌘</span>K
        </kbd>
      </Button>
      
      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-32">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => {
              setIsOpen(false)
              setSearchQuery('')
              setResults([])
              setShowResults(false)
            }}
          />
          
          {/* Search Container */}
          <div className="relative w-full max-w-2xl mx-4 z-10">
            <Card className="shadow-xl">
              {/* Search Input */}
              <form onSubmit={handleSearchSubmit} className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="사용자, 현장, 문서, 보고서 검색..."
                    className="pl-10 pr-10 h-12 text-lg"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('')
                        setResults([])
                        setShowResults(false)
                        searchInputRef.current?.focus()
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
                
                {/* Filters */}
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setActiveFilter('all')}
                    className={`px-3 py-1 rounded-full text-sm ${
                      activeFilter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    전체
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('users')}
                    className={`px-3 py-1 rounded-full text-sm ${
                      activeFilter === 'users'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    사용자
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('sites')}
                    className={`px-3 py-1 rounded-full text-sm ${
                      activeFilter === 'sites'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    현장
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('documents')}
                    className={`px-3 py-1 rounded-full text-sm ${
                      activeFilter === 'documents'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    문서
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('reports')}
                    className={`px-3 py-1 rounded-full text-sm ${
                      activeFilter === 'reports'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    보고서
                  </button>
                </div>
              </form>
              
              {/* Results or Recent Searches */}
              <div className="max-h-96 overflow-y-auto">
                {searching ? (
                  <div className="p-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-500">검색 중...</p>
                  </div>
                ) : showResults ? (
                  results.length > 0 ? (
                    <div className="divide-y">
                      {results.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result)}
                          className="w-full px-4 py-3 hover:bg-gray-50 text-left flex items-start gap-3"
                        >
                          <div className={`p-2 rounded-lg ${getResultBadgeClass(result.type)}`}>
                            {getResultIcon(result.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className={`${getFullTypographyClass('body', 'base', isLargeFont)} font-medium`}>
                                {result.title}
                              </h4>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getResultBadgeClass(result.type)}`}>
                                {result.type === 'user' && '사용자'}
                                {result.type === 'site' && '현장'}
                                {result.type === 'document' && '문서'}
                                {result.type === 'report' && '보고서'}
                              </span>
                            </div>
                            {result.subtitle && (
                              <p className={`${getFullTypographyClass('caption', 'sm', isLargeFont)} text-gray-600`}>
                                {result.subtitle}
                              </p>
                            )}
                            {result.description && (
                              <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500 mt-1`}>
                                {result.description}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <Search className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                      <p>검색 결과가 없습니다</p>
                    </div>
                  )
                ) : (
                  <div className="p-4">
                    {recentSearches.length > 0 && (
                      <>
                        <h3 className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-gray-700 mb-2 flex items-center gap-2`}>
                          <Clock className="h-4 w-4" />
                          최근 검색
                        </h3>
                        <div className="space-y-1">
                          {recentSearches.map((search, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleRecentSearchClick(search.query)}
                              className="w-full px-3 py-2 rounded hover:bg-gray-100 text-left flex items-center gap-2"
                            >
                              <Search className="h-4 w-4 text-gray-400" />
                              <span className={getFullTypographyClass('body', 'sm', isLargeFont)}>
                                {search.query}
                              </span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                    
                    <div className="mt-4">
                      <h3 className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-gray-700 mb-2 flex items-center gap-2`}>
                        <TrendingUp className="h-4 w-4" />
                        인기 검색어
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {['서울 현장', '안전 관리', '일일 보고서', '김철수', '급여 관리'].map((keyword) => (
                          <button
                            key={keyword}
                            onClick={() => handleRecentSearchClick(keyword)}
                            className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-sm"
                          >
                            {keyword}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="p-3 border-t bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white rounded border">↑↓</kbd>
                    탐색
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white rounded border">Enter</kbd>
                    선택
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white rounded border">Esc</kbd>
                    닫기
                  </span>
                </div>
                <span className="text-gray-400">
                  Powered by PostgreSQL
                </span>
              </div>
            </Card>
          </div>
        </div>
      )}
    </>
  )
}