'use client'


interface SiteSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectSite: (siteId: string) => void
  currentSiteId?: string
}

const RECENT_SITES_KEY = 'recent-sites'
const RECENT_SITES_LIMIT = 5

export default function SiteSearchModal({
  isOpen,
  onClose,
  onSelectSite,
  currentSiteId
}: SiteSearchModalProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SiteSearchResult[]>([])
  const [recentSites, setRecentSites] = useState<SiteSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Load recent sites from localStorage
  useEffect(() => {
    if (isOpen) {
      loadRecentSites()
      // Focus search input when modal opens
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const loadRecentSites = async () => {
    try {
      const stored = localStorage.getItem(RECENT_SITES_KEY)
      if (stored) {
        const recentIds = JSON.parse(stored) as string[]
        
        // Fetch site details for recent IDs
        const { data, error } = await supabase
          .from('sites')
          .select(`
            id,
            name,
            full_address:site_addresses(full_address),
            construction_start_date,
            construction_end_date,
            is_active,
            organization_id
          `)
          .in('id', recentIds)
          .order('created_at', { ascending: false })

        if (error) throw error

        const formattedSites = data?.map((site: unknown) => ({
          id: (site as unknown).id,
          name: (site as unknown).name,
          address: (site as unknown).full_address?.[0]?.full_address || '주소 정보 없음',
          construction_period: {
            start_date: new Date((site as unknown).construction_start_date),
            end_date: new Date((site as unknown).construction_end_date)
          },
          progress_percentage: calculateProgress(
            (site as unknown).construction_start_date, 
            (site as unknown).construction_end_date
          ),
          participant_count: 0, // TODO: Get actual count
          is_active: (site as unknown).is_active
        })) || []

        // Sort by the order in recentIds to maintain recency
        const sortedSites = recentIds
          .map(id => formattedSites.find((site: unknown) => site.id === id))
          .filter(Boolean) as SiteSearchResult[]

        setRecentSites(sortedSites.slice(0, RECENT_SITES_LIMIT))
      }
    } catch (err) {
      console.error('Error loading recent sites:', err)
    }
  }

  // Debounced search function
  const performSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([])
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Perform fuzzy search on site names
        const { data, error } = await supabase
          .from('sites')
          .select(`
            id,
            name,
            full_address:site_addresses(full_address),
            construction_start_date,
            construction_end_date,
            is_active,
            organization_id,
            construction_manager_name
          `)
          .ilike('name', `%${query}%`)
          .eq('is_active', true)
          .order('name')
          .limit(20)

        if (error) throw error

        const formattedResults = data?.map((site: unknown) => ({
          id: (site as unknown).id,
          name: (site as unknown).name,
          address: (site as unknown).full_address?.[0]?.full_address || '주소 정보 없음',
          construction_period: {
            start_date: new Date((site as unknown).construction_start_date),
            end_date: new Date((site as unknown).construction_end_date)
          },
          progress_percentage: calculateProgress(
            (site as unknown).construction_start_date, 
            (site as unknown).construction_end_date
          ),
          participant_count: 0, // TODO: Get actual count
          is_active: (site as unknown).is_active
        })) || []

        setSearchResults(formattedResults)
      } catch (err) {
        console.error('Search error:', err)
        setError('검색 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }, 300),
    [supabase]
  )

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    performSearch(query)
  }

  // Calculate construction progress
  const calculateProgress = (startDate: string, endDate: string): number => {
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    const now = new Date().getTime()

    if (now < start) return 0
    if (now > end) return 100

    const total = end - start
    const elapsed = now - start
    return Math.round((elapsed / total) * 100)
  }

  // Handle site selection
  const handleSelectSite = (site: SiteSearchResult) => {
    // Add to recent sites
    const stored = localStorage.getItem(RECENT_SITES_KEY)
    const recentIds = stored ? JSON.parse(stored) as string[] : []
    
    // Remove if already exists and add to front
    const updatedIds = [
      site.id,
      ...recentIds.filter(id => id !== site.id)
    ].slice(0, RECENT_SITES_LIMIT)
    
    localStorage.setItem(RECENT_SITES_KEY, JSON.stringify(updatedIds))
    
    // Call parent handler
    onSelectSite(site.id)
  }

  // Clear search
  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    searchInputRef.current?.focus()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className={`sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${
            touchMode === 'glove' ? 'p-6' : touchMode === 'precision' ? 'p-3' : 'p-4'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`${getFullTypographyClass('heading', 'xl', isLargeFont)} font-semibold text-gray-900 dark:text-gray-100`}>
                현장 검색
              </h2>
              <button
                onClick={onClose}
                className={`${
                  touchMode === 'glove' ? 'p-3' : touchMode === 'precision' ? 'p-1.5' : 'p-2'
                } hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors`}
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="현장명으로 검색..."
                className={`w-full pl-10 pr-10 ${
                  touchMode === 'glove' ? 'py-4 text-lg' : touchMode === 'precision' ? 'py-2 text-sm' : 'py-3 text-base'
                } bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 140px)' }}>
            {/* Loading State */}
            {loading && (
              <div className="p-8 text-center">
                <div className="inline-flex items-center gap-2 text-gray-500">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-500" />
                  <span className={getFullTypographyClass('body', 'base', isLargeFont)}>검색 중...</span>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className={`${
                touchMode === 'glove' ? 'p-6 m-6' : touchMode === 'precision' ? 'p-3 m-3' : 'p-4 m-4'
              } bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg`}>
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-red-800 dark:text-red-200`}>{error}</p>
              </div>
            )}

            {/* Recent Sites */}
            {!searchQuery && recentSites.length > 0 && (
              <div className={touchMode === 'glove' ? 'p-6' : touchMode === 'precision' ? 'p-3' : 'p-4'}>
                <h3 className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2`}>
                  <Clock className="h-4 w-4" />
                  최근 방문한 현장
                </h3>
                <div className="space-y-2">
                  {recentSites.map((site: unknown) => (
                    <SiteCard
                      key={site.id}
                      site={site}
                      onSelect={() => handleSelectSite(site)}
                      isCurrentSite={site.id === currentSiteId}
                      isLargeFont={isLargeFont}
                      touchMode={touchMode}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchQuery && !loading && searchResults.length > 0 && (
              <div className={touchMode === 'glove' ? 'p-6' : touchMode === 'precision' ? 'p-3' : 'p-4'}>
                <h3 className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-gray-700 dark:text-gray-300 mb-3`}>
                  검색 결과 ({searchResults.length}개)
                </h3>
                <div className="space-y-2">
                  {searchResults.map((site: unknown) => (
                    <SiteCard
                      key={site.id}
                      site={site}
                      onSelect={() => handleSelectSite(site)}
                      isCurrentSite={site.id === currentSiteId}
                      isLargeFont={isLargeFont}
                      touchMode={touchMode}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {searchQuery && !loading && searchResults.length === 0 && (
              <div className="p-8 text-center">
                <p className={`${getFullTypographyClass('body', 'base', isLargeFont)} text-gray-500 dark:text-gray-400`}>
                  &quot;{searchQuery}&quot;에 대한 검색 결과가 없습니다.
                </p>
              </div>
            )}

            {/* Empty State */}
            {!searchQuery && recentSites.length === 0 && !loading && (
              <div className="p-8 text-center">
                <Building2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className={`${getFullTypographyClass('body', 'base', isLargeFont)} text-gray-500 dark:text-gray-400`}>
                  현장을 검색해주세요
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Site Card Component
interface SiteCardProps {
  site: SiteSearchResult
  onSelect: () => void
  isCurrentSite?: boolean
  isLargeFont: boolean
  touchMode: string
}

function SiteCard({ site, onSelect, isCurrentSite, isLargeFont, touchMode }: SiteCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    }).format(date)
  }

  return (
    <button
      onClick={onSelect}
      disabled={isCurrentSite}
      className={`w-full text-left ${
        touchMode === 'glove' ? 'p-6' : touchMode === 'precision' ? 'p-3' : 'p-4'
      } rounded-lg border transition-all ${
        isCurrentSite
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 cursor-default'
          : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`${getFullTypographyClass('body', 'base', isLargeFont)} font-medium text-gray-900 dark:text-gray-100`}>
              {site.name}
            </h4>
            {isCurrentSite && (
              <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded`}>
                현재 현장
              </span>
            )}
          </div>
          <div className={`flex items-center gap-1 ${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 dark:text-gray-400 mb-2`}>
            <MapPin className="h-3 w-3" />
            <span>{site.address}</span>
          </div>
          <div className={`flex items-center gap-4 ${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500 dark:text-gray-400`}>
            <span>
              {formatDate(site.construction_period.start_date)} ~ {formatDate(site.construction_period.end_date)}
            </span>
            <span>진행률 {site.progress_percentage}%</span>
          </div>
        </div>
        {!isCurrentSite && (
          <ChevronRight className="h-5 w-5 text-gray-400 mt-1" />
        )}
      </div>
    </button>
  )
}