'use client'


interface PartnerWorkLogsTabProps {
  profile: Profile
  sites: unknown[]
}

interface WorkLog {
  id: string
  date: string
  siteId: string
  siteName?: string
  mainWork: string
  status: 'submitted'
  author: string
  weather?: string
  totalWorkers: number
  npc1000Used?: number
  issues?: string
}

// Transform DailyReport to WorkLog interface for compatibility
const transformDailyReportToWorkLog = (report: DailyReport & { 
  site?: { id: string; name: string; organization_id: string }; 
  created_by_profile?: { id: string; full_name: string; email: string } 
}): WorkLog => ({
  id: report.id,
  date: report.work_date,
  siteId: report.site_id || '',
  siteName: report.site?.name,
  mainWork: `${report.member_name} - ${report.process_type}`,
  status: 'submitted',
  author: report.created_by_profile?.full_name || '미지정',
  totalWorkers: report.total_workers || 0,
  npc1000Used: report.npc1000_used || undefined,
  issues: report.issues || undefined
})

export default function PartnerWorkLogsTab({ profile, sites }: PartnerWorkLogsTabProps) {
  const router = useRouter()
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(true)

  const supabase = createClient()

  // Use the actual sites from props
  const availableSites = sites || []

  useEffect(() => {
    loadWorkLogs()
  }, [selectedSite, dateRange, searchTerm])

  const loadWorkLogs = async () => {
    try {
      setLoading(true)
      
      // Fetch real data from database using the partner-specific function
      const dailyReports = await getPartnerDailyReports(
        selectedSite === 'all' ? undefined : selectedSite,
        dateRange.start || undefined,
        dateRange.end || undefined,
        searchTerm || undefined
      )
      
      // Transform daily reports to work logs
      const workLogs = dailyReports.map(transformDailyReportToWorkLog)
      
      setWorkLogs(workLogs)
    } catch (error) {
      console.error('Error loading work logs:', error)
      // Set empty array on error
      setWorkLogs([])
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadWorkLogs()
  }

  const handleViewDetail = (log: WorkLog) => {
    router.push(`/partner/work-logs/${log.id}`)
  }


  // Work logs are already filtered by the database query
  const filteredWorkLogs = workLogs

  // Get active filters for display
  const getActiveFilters = () => {
    const filters: { label: string; value: string; key: string }[] = []
    
    if (selectedSite !== 'all') {
      const site = availableSites?.find(s => s.id === selectedSite)
      filters.push({ 
        label: `현장: ${site?.name || '미지정'}`, 
        value: selectedSite, 
        key: 'site' 
      })
    }
    
    
    if (searchTerm) {
      filters.push({ 
        label: `검색: ${searchTerm}`, 
        value: searchTerm, 
        key: 'search' 
      })
    }
    
    if (dateRange.start || dateRange.end) {
      let dateLabel = '기간: '
      if (dateRange.start && dateRange.end) {
        dateLabel += `${dateRange.start} ~ ${dateRange.end}`
      } else if (dateRange.start) {
        dateLabel += `${dateRange.start} 이후`
      } else if (dateRange.end) {
        dateLabel += `${dateRange.end} 이전`
      }
      filters.push({ 
        label: dateLabel, 
        value: `${dateRange.start}-${dateRange.end}`, 
        key: 'date' 
      })
    }
    
    return filters
  }

  const clearFilter = (key: string) => {
    switch (key) {
      case 'site':
        setSelectedSite('all')
        break
      case 'search':
        setSearchTerm('')
        break
      case 'date':
        setDateRange({ start: '', end: '' })
        break
    }
  }

  return (
    <div className="space-y-6 min-h-0 flex-1 flex flex-col">
      {/* Compact Filters - Mobile Optimized (Matching Site Manager's Design) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        {/* Filter Header */}
        <div className="p-3 pb-2 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <Filter className="w-4 h-4" />
              필터
              {!showFilters && getActiveFilters().length > 0 && (
                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs px-1.5 py-0.5 rounded-full">
                  {getActiveFilters().length}
                </span>
              )}
              {showFilters ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>
            
            {/* Active Filters Display when collapsed */}
            {!showFilters && getActiveFilters().length > 0 && (
              <div className="flex flex-wrap gap-1 max-w-md">
                {getActiveFilters().slice(0, 2).map((filter, index) => (
                  <div
                    key={`${filter.key}-${index}`}
                    className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full text-xs border border-blue-200 dark:border-blue-700"
                  >
                    <span className="truncate max-w-20">{filter.label}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        clearFilter(filter.key)
                      }}
                      className="hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {getActiveFilters().length > 2 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                    +{getActiveFilters().length - 2}개 더
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Active Filters Summary when collapsed */}
        {!showFilters && getActiveFilters().length > 0 && (
          <div className="px-3 py-2 bg-blue-50/50 dark:bg-blue-900/10 border-b border-gray-100 dark:border-gray-700">
            <div className="flex flex-wrap gap-1">
              {getActiveFilters().map((filter, index) => (
                <div
                  key={`summary-${filter.key}-${index}`}
                  className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full text-xs border border-blue-200 dark:border-blue-700"
                >
                  <span>{filter.label}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      clearFilter(filter.key)
                    }}
                    className="hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Filter Controls */}
        <div className={`overflow-hidden transition-all duration-200 ease-in-out ${
          showFilters ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="p-3 space-y-2">
            {/* 현장선택 - 첫번째 */}
            <CustomSelect value={selectedSite} onValueChange={setSelectedSite}>
              <CustomSelectTrigger className="w-full h-10">
                <CustomSelectValue placeholder="현장 선택" />
              </CustomSelectTrigger>
              <CustomSelectContent>
                <CustomSelectItem value="all">전체 현장</CustomSelectItem>
                {availableSites.map(site => (
                  <CustomSelectItem key={site.id} value={site.id}>
                    {site.name}
                  </CustomSelectItem>
                ))}
              </CustomSelectContent>
            </CustomSelect>
            
            {/* 기간 선택 - 두번째 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4" />
                <span>기간 선택</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="text-sm px-2 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                  placeholder="시작일"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="text-sm px-2 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                  placeholder="종료일"
                />
              </div>
              
              {/* Quick Date Presets */}
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => {
                    const today = new Date()
                    const oneWeekAgo = new Date(today)
                    oneWeekAgo.setDate(today.getDate() - 7)
                    setDateRange({
                      start: oneWeekAgo.toISOString().split('T')[0],
                      end: today.toISOString().split('T')[0]
                    })
                  }}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                >
                  최근 7일
                </button>
                <button
                  onClick={() => {
                    const today = new Date()
                    const oneMonthAgo = new Date(today)
                    oneMonthAgo.setMonth(today.getMonth() - 1)
                    setDateRange({
                      start: oneMonthAgo.toISOString().split('T')[0],
                      end: today.toISOString().split('T')[0]
                    })
                  }}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                >
                  최근 1개월
                </button>
                <button
                  onClick={() => {
                    const today = new Date()
                    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
                    setDateRange({
                      start: startOfMonth.toISOString().split('T')[0],
                      end: today.toISOString().split('T')[0]
                    })
                  }}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                >
                  이번달
                </button>
                <button
                  onClick={() => setDateRange({ start: '', end: '' })}
                  className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                >
                  초기화
                </button>
              </div>
            </div>

            {/* 검색어 입력 - 세번째 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="부재명, 공정, 특이사항으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-between">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <RefreshCw className="w-3 h-3" />
                새로고침
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* High-Density Report List (Matching Site Manager's Design) */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600 dark:text-gray-400 text-sm">작업일지를 불러오는 중...</p>
        </div>
      ) : filteredWorkLogs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
          <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">작업일지가 없습니다.</p>
          <p className="text-gray-500 dark:text-gray-500 text-xs">선택한 조건에 맞는 작업일지가 없습니다.</p>
        </div>
      ) : (
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="flex-1 divide-y divide-gray-100 dark:divide-gray-700 overflow-y-auto" style={{maxHeight: '500px'}}>
            {filteredWorkLogs.map((log) => {
              const statusConfig = {
                submitted: { label: '제출됨', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' }
              }
              const status = statusConfig.submitted
              const siteName = availableSites.find(s => s.id === log.siteId)?.name || log.siteName || '미지정'

              return (
                <div key={log.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                          {format(new Date(log.date), 'yyyy.MM.dd', { locale: ko })}
                        </p>
                        <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <Building2 className="w-3 h-3 mr-1" />
                          {siteName}
                        </span>
                        <span className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          {log.totalWorkers}명
                        </span>
                        {log.npc1000Used && (
                          <span className="flex items-center">
                            <Package className="w-3 h-3 mr-1" />
                            {Math.round(log.npc1000Used)}kg
                          </span>
                        )}
                      </div>
                      {log.mainWork && (
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {log.mainWork}
                        </p>
                      )}
                      {log.issues && (
                        <p className="mt-1 text-xs text-orange-600 dark:text-orange-400 line-clamp-1">
                          특이사항: {log.issues}
                        </p>
                      )}
                    </div>
                    <div className="ml-3 flex items-center gap-1">
                      <button
                        onClick={() => handleViewDetail(log)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 transition-colors"
                        title="상세보기"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}