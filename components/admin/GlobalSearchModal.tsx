'use client'


interface SearchResult {
  id: string
  type: 'user' | 'site' | 'document' | 'report' | 'material' | 'page' | 'action'
  title: string
  subtitle?: string
  description?: string
  url: string
  icon?: unknown
  badge?: string
  badgeColor?: string
  metadata?: unknown
}

interface RecentSearch {
  query: string
  timestamp: Date
  resultCount?: number
}

interface GlobalSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

// Quick actions for common admin tasks
const quickActions: SearchResult[] = [
  {
    id: 'quick-1',
    type: 'action',
    title: '새 사용자 추가',
    subtitle: '작업자 또는 관리자 계정 생성',
    url: '/dashboard/admin/users/new',
    icon: Users
  },
  {
    id: 'quick-2',
    type: 'action',
    title: '일일 보고서 확인',
    subtitle: '오늘의 작업일지 검토',
    url: '/dashboard/admin/daily-reports?date=today',
    icon: FileText
  },
  {
    id: 'quick-3',
    type: 'action',
    title: '현장 상태 모니터링',
    subtitle: '활성 현장 실시간 현황',
    url: '/dashboard/admin/sites?status=active',
    icon: Activity
  },
  {
    id: 'quick-4',
    type: 'action',
    title: '승인 대기 문서',
    subtitle: '검토가 필요한 문서 목록',
    url: '/dashboard/admin/approvals',
    icon: CheckCircle
  }
]

// Popular searches
const popularSearches = [
  '서울 현장',
  '안전 관리',
  '일일 보고서', 
  '급여 명세서',
  '신규 작업자',
  '자재 재고',
  '작업 승인',
  '월간 리포트'
]

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [activeCategory, setActiveCategory] = useState<'all' | 'quick' | 'recent'>('quick')

  // Load recent searches
  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('admin_recent_searches')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setRecentSearches(parsed.map((s: unknown) => ({
            ...s,
            timestamp: new Date(s.timestamp)
          })).slice(0, 5))
        } catch (e) {
          console.error('Failed to parse recent searches:', e)
        }
      }
      // Focus input when modal opens
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Save recent search
  const saveRecentSearch = useCallback((query: string, resultCount: number) => {
    if (!query.trim()) return
    
    const newSearch: RecentSearch = {
      query: query.trim(),
      timestamp: new Date(),
      resultCount
    }
    
    const updated = [
      newSearch,
      ...recentSearches.filter(s => s.query !== query).slice(0, 4)
    ]
    
    setRecentSearches(updated)
    localStorage.setItem('admin_recent_searches', JSON.stringify(updated))
  }, [recentSearches])

  // Perform search
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([])
      setActiveCategory('quick')
      return
    }

    setSearching(true)
    setActiveCategory('all')
    
    try {
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const mockResults: SearchResult[] = []
      const lowerQuery = query.toLowerCase()
      
      // Search pages/navigation
      if ('홈'.includes(lowerQuery) || 'home'.includes(lowerQuery)) {
        mockResults.push({
          id: 'nav-1',
          type: 'page',
          title: '관리자 홈',
          subtitle: '메인 대시보드',
          url: '/dashboard/admin',
          icon: Home
        })
      }
      
      if ('사용자'.includes(lowerQuery) || 'user'.includes(lowerQuery)) {
        mockResults.push({
          id: 'nav-2',
          type: 'page',
          title: '사용자 관리',
          subtitle: '계정 관리 페이지',
          url: '/dashboard/admin/users',
          icon: Users
        })
      }
      
      // Search users
      if ('김'.includes(lowerQuery) || '이'.includes(lowerQuery) || '박'.includes(lowerQuery)) {
        mockResults.push(
          {
            id: 'user-1',
            type: 'user',
            title: '김철수',
            subtitle: 'worker@inopnc.com',
            description: '서울 강남 현장 • 작업자',
            url: '/dashboard/admin/users/1',
            icon: Users,
            badge: '활성',
            badgeColor: 'green'
          },
          {
            id: 'user-2',
            type: 'user',
            title: '이영희',
            subtitle: 'manager@inopnc.com',
            description: '부산 해운대 현장 • 현장관리자',
            url: '/dashboard/admin/users/2',
            icon: Users,
            badge: '활성',
            badgeColor: 'green'
          }
        )
      }
      
      // Search sites
      if ('현장'.includes(lowerQuery) || '서울'.includes(lowerQuery) || '부산'.includes(lowerQuery)) {
        mockResults.push(
          {
            id: 'site-1',
            type: 'site',
            title: '서울 강남 A현장',
            subtitle: '강남구 삼성동 123-45',
            description: '작업자 25명 • 진행률 67%',
            url: '/dashboard/admin/sites/1',
            icon: Building2,
            badge: '진행중',
            badgeColor: 'blue'
          },
          {
            id: 'site-2',
            type: 'site',
            title: '부산 해운대 B현장',
            subtitle: '해운대구 우동 678-90',
            description: '작업자 18명 • 진행률 45%',
            url: '/dashboard/admin/sites/2',
            icon: Building2,
            badge: '진행중',
            badgeColor: 'blue'
          }
        )
      }
      
      // Search documents
      if ('문서'.includes(lowerQuery) || '안전'.includes(lowerQuery) || 'document'.includes(lowerQuery)) {
        mockResults.push({
          id: 'doc-1',
          type: 'document',
          title: '안전 관리 지침서 v2.1',
          subtitle: '2025-08-01 업데이트',
          description: 'PDF • 2.5MB • 조회수 156',
          url: '/dashboard/admin/documents/1',
          icon: FileText,
          badge: '승인됨',
          badgeColor: 'green'
        })
      }
      
      // Search reports
      if ('보고'.includes(lowerQuery) || '일일'.includes(lowerQuery) || 'report'.includes(lowerQuery)) {
        mockResults.push({
          id: 'report-1',
          type: 'report',
          title: '2025-08-22 일일 작업 보고서',
          subtitle: '서울 강남 A현장',
          description: '작성자: 김철수 • 승인 대기',
          url: '/dashboard/admin/daily-reports/1',
          icon: FileText,
          badge: '검토중',
          badgeColor: 'yellow'
        })
      }
      
      // Search materials
      if ('자재'.includes(lowerQuery) || 'npc'.includes(lowerQuery) || 'material'.includes(lowerQuery)) {
        mockResults.push({
          id: 'material-1',
          type: 'material',
          title: 'NPC-1000 500kg',
          subtitle: '고강도 콘크리트',
          description: '재고: 1,250 포 • 서울 창고',
          url: '/dashboard/admin/materials/1',
          icon: Package,
          badge: '재고있음',
          badgeColor: 'green'
        })
      }
      
      setResults(mockResults)
      
      if (mockResults.length > 0) {
        saveRecentSearch(query, mockResults.length)
      }
      
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setSearching(false)
      setSelectedIndex(-1)
    }
  }, [saveRecentSearch])

  // Handle search input with debounce
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value)
    }, 300)
  }, [performSearch])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const totalItems = searchQuery ? results.length : 
                        activeCategory === 'quick' ? quickActions.length :
                        activeCategory === 'recent' ? recentSearches.length : 0

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => (prev + 1) % Math.max(1, totalItems))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => prev <= 0 ? totalItems - 1 : prev - 1)
          break
        case 'Enter':
          e.preventDefault()
          if (selectedIndex >= 0) {
            const items = searchQuery ? results : 
                         activeCategory === 'quick' ? quickActions :
                         activeCategory === 'recent' ? recentSearches.map(s => ({
                           id: s.query,
                           type: 'action' as const,
                           title: s.query,
                           url: '#'
                         })) : []
            
            if (items[selectedIndex]) {
              if (activeCategory === 'recent' && !searchQuery) {
                handleSearchChange(recentSearches[selectedIndex].query)
              } else {
                handleResultClick(items[selectedIndex] as SearchResult)
              }
            }
          }
          break
        case 'Escape':
          e.preventDefault()
          if (searchQuery) {
            setSearchQuery('')
            setResults([])
            setActiveCategory('quick')
          } else {
            onClose()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, searchQuery, results, activeCategory, quickActions, recentSearches, onClose, handleSearchChange])

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    if (result.url && result.url !== '#') {
      router.push(result.url)
      onClose()
      setSearchQuery('')
      setResults([])
    }
  }

  // Get icon for result
  const getResultIcon = (result: SearchResult) => {
    if (result.icon) return <result.icon className="h-5 w-5" />
    
    switch (result.type) {
      case 'user': return <Users className="h-5 w-5" />
      case 'site': return <Building2 className="h-5 w-5" />
      case 'document': return <FileText className="h-5 w-5" />
      case 'report': return <Activity className="h-5 w-5" />
      case 'material': return <Package className="h-5 w-5" />
      case 'page': return <Home className="h-5 w-5" />
      default: return <Search className="h-5 w-5" />
    }
  }

  // Get badge color classes
  const getBadgeColorClass = (color?: string) => {
    switch (color) {
      case 'green': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'blue': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'yellow': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'red': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-start justify-center pt-[10vh] px-4">
        <div className="relative w-full max-w-3xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden">
          {/* Search Header */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center px-4 py-3">
              <Search className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="사용자, 현장, 문서, 보고서 검색..."
                className="flex-1 text-lg bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setResults([])
                    setActiveCategory('quick')
                    searchInputRef.current?.focus()
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              )}
              <button
                onClick={onClose}
                className="ml-2 px-3 py-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ESC
              </button>
            </div>
          </div>

          {/* Search Results */}
          <div ref={resultsRef} className="max-h-[60vh] overflow-y-auto">
            {searching ? (
              <div className="p-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                <p className="mt-3 text-gray-500 dark:text-gray-400">검색 중...</p>
              </div>
            ) : searchQuery && results.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-900 dark:text-gray-100 font-medium mb-1">
                  검색 결과가 없습니다
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  다른 검색어를 시도해보세요
                </p>
              </div>
            ) : searchQuery ? (
              <div className="py-2">
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                      selectedIndex === index ? 'bg-gray-50 dark:bg-gray-800/50' : ''
                    }`}
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      {getResultIcon(result)}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {result.title}
                        </span>
                        {result.badge && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getBadgeColorClass(result.badgeColor)}`}>
                            {result.badge}
                          </span>
                        )}
                      </div>
                      {result.subtitle && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {result.subtitle}
                        </p>
                      )}
                      {result.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {result.description}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0 mt-3" />
                  </button>
                ))}
              </div>
            ) : (
              <div>
                {/* Quick Actions */}
                {activeCategory === 'quick' && (
                  <div className="p-4">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                      빠른 실행
                    </h3>
                    <div className="space-y-1">
                      {quickActions.map((action, index) => (
                        <button
                          key={action.id}
                          onClick={() => handleResultClick(action)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={`w-full px-3 py-2 flex items-center gap-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                            selectedIndex === index ? 'bg-gray-100 dark:bg-gray-800' : ''
                          }`}
                        >
                          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            {getResultIcon(action)}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {action.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {action.subtitle}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      최근 검색
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => handleSearchChange(search.query)}
                          className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-2"
                        >
                          <Search className="h-3 w-3" />
                          {search.query}
                          {search.resultCount && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              ({search.resultCount})
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Searches */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    인기 검색어
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((keyword) => (
                      <button
                        key={keyword}
                        onClick={() => handleSearchChange(keyword)}
                        className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"
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
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">↑↓</kbd>
                탐색
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">Enter</kbd>
                선택
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">ESC</kbd>
                닫기
              </span>
            </div>
            <span>
              ⌘K 로 빠르게 열기
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}