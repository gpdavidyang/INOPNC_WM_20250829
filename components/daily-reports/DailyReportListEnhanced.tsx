'use client'

import { 
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import type { DailyReport, Site, Profile } from '@/types'
import { DailyReportDetailDialog } from './DailyReportDetailDialog'
import type { SearchOptions, SearchResult } from '@/lib/search/types'
import type { SortConfig } from '@/components/ui/sortable-table'

interface DailyReportListEnhancedProps {
  currentUser: Profile
  sites: Site[]
}

interface ReportStats {
  totalReports: number
  draftReports: number
  submittedReports: number
  approvedReports: number
  rejectedReports: number
  totalWorkers: number
  totalNPC1000Used: number
  averageWorkersPerDay: number
}

export function DailyReportListEnhanced({ currentUser, sites = [] }: DailyReportListEnhancedProps) {
  // console.log('DailyReportListEnhanced - sites received:', sites, 'length:', sites?.length)
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [reports, setReports] = useState<DailyReport[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date()
    const oneMonthAgo = new Date(today)
    oneMonthAgo.setMonth(today.getMonth() - 1)
    
    return {
      from: oneMonthAgo.toISOString().split('T')[0], // 1개월 전부터
      to: today.toISOString().split('T')[0] // 오늘까지
    }
  })
  const [stats, setStats] = useState<ReportStats>({
    totalReports: 0,
    draftReports: 0,
    submittedReports: 0,
    approvedReports: 0,
    rejectedReports: 0,
    totalWorkers: 0,
    totalNPC1000Used: 0,
    averageWorkersPerDay: 0
  })
  const [searchResult, setSearchResult] = useState<SearchResult<DailyReport> | undefined>()
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [showFilters, setShowFilters] = useState(true)
  
  // View mode state
  const [viewMode, setViewMode] = useViewMode('daily-reports', 'card')
  
  // Detail dialog state
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  // Get active filters for display
  const getActiveFilters = () => {
    const filters: { label: string; value: string; key: string }[] = []
    
    if (selectedSite !== 'all') {
      const site = sites?.find(s => s.id === selectedSite)
      filters.push({ 
        label: `현장: ${site?.name || '미지정'}`, 
        value: selectedSite, 
        key: 'site' 
      })
    }
    
    if (selectedStatus !== 'all') {
      const statusNames = {
        draft: '임시저장',
        submitted: '제출됨'
      }
      filters.push({ 
        label: `상태: ${statusNames[selectedStatus as keyof typeof statusNames]}`, 
        value: selectedStatus, 
        key: 'status' 
      })
    }
    
    if (searchTerm) {
      filters.push({ 
        label: `검색: ${searchTerm}`, 
        value: searchTerm, 
        key: 'search' 
      })
    }
    
    if (dateRange.from || dateRange.to) {
      let dateLabel = '기간: '
      if (dateRange.from && dateRange.to) {
        dateLabel += `${dateRange.from} ~ ${dateRange.to}`
      } else if (dateRange.from) {
        dateLabel += `${dateRange.from} 이후`
      } else if (dateRange.to) {
        dateLabel += `${dateRange.to} 이전`
      }
      filters.push({ 
        label: dateLabel, 
        value: `${dateRange.from}-${dateRange.to}`, 
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
      case 'status':
        setSelectedStatus('all')
        break
      case 'search':
        setSearchTerm('')
        break
      case 'date':
        setDateRange({ from: '', to: '' })
        break
    }
  }

  const handleViewDetail = useCallback((report: DailyReport) => {
    setSelectedReport(report)
    setShowDetailDialog(true)
  }, [])

  // Memoize the loadReports function to prevent infinite loops
  const loadReports = useCallback(async () => {
    setLoading(true)
    try {
      const filters: unknown = {}
      
      if (selectedSite !== 'all') {
        filters.site_id = selectedSite
      }
      
      if (selectedStatus !== 'all') {
        filters.status = selectedStatus
      }
      
      if (dateRange.from) {
        filters.start_date = dateRange.from
      }
      
      if (dateRange.to) {
        filters.end_date = dateRange.to
      }

      const result = await getDailyReports(filters)
      // console.log('getDailyReports filters:', filters)
      // console.log('getDailyReports result:', result)
      
      if (result.success && result.data) {
        const reportData = result.data as DailyReport[]
        // console.log('Setting reports:', reportData.length, 'items')
        // console.log('First report data:', reportData[0])
        // console.log('Sites available:', sites)
        setReports(reportData)

        // Calculate stats
        const statsData = reportData.reduce((acc: unknown, report: unknown) => {
          acc.totalReports++
          acc[`${report.status}Reports` as keyof ReportStats]++
          acc.totalWorkers += report.total_workers || 0
          acc.totalNPC1000Used += report.npc1000_used || 0
          return acc
        }, {
          totalReports: 0,
          draftReports: 0,
          submittedReports: 0,
          approvedReports: 0,
          rejectedReports: 0,
          totalWorkers: 0,
          totalNPC1000Used: 0,
          averageWorkersPerDay: 0
        } as ReportStats)

        statsData.averageWorkersPerDay = reportData.length > 0 
          ? Math.round(statsData.totalWorkers / statsData.totalReports) 
          : 0
        setStats(statsData)
      } else {
        showErrorNotification(result.error || '일일보고서를 불러오는데 실패했습니다.', 'loadReports')
        setReports([])
        setStats({
          totalReports: 0,
          draftReports: 0,
          submittedReports: 0,
          approvedReports: 0,
          rejectedReports: 0,
          totalWorkers: 0,
          totalNPC1000Used: 0,
          averageWorkersPerDay: 0
        })
      }
    } catch (error) {
      showErrorNotification(error, 'loadReports')
      setReports([])
      setStats({
        totalReports: 0,
        draftReports: 0,
        submittedReports: 0,
        approvedReports: 0,
        rejectedReports: 0,
        totalWorkers: 0,
        totalNPC1000Used: 0,
        averageWorkersPerDay: 0
      })
    } finally {
      setLoading(false)
    }
  }, [selectedSite, selectedStatus, dateRange])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const handleSearch = async (options: SearchOptions) => {
    setLoading(true)
    setIsSearchMode(true)
    try {
      const result = await searchDailyReports(options)
      
      if (result.success && result.data) {
        setSearchResult(result.data)
        setReports(result.data.items)
        
        // Calculate stats for search results
        const statsData = result.data.items.reduce((acc: unknown, report: unknown) => {
          acc.totalReports++
          acc[`${report.status}Reports` as keyof ReportStats]++
          acc.totalWorkers += report.total_workers || 0
          acc.totalNPC1000Used += report.npc1000_used || 0
          return acc
        }, {
          totalReports: 0,
          draftReports: 0,
          submittedReports: 0,
          approvedReports: 0,
          rejectedReports: 0,
          totalWorkers: 0,
          totalNPC1000Used: 0,
          averageWorkersPerDay: 0
        } as ReportStats)

        statsData.averageWorkersPerDay = result.data.items.length > 0 
          ? Math.round(statsData.totalWorkers / statsData.totalReports) 
          : 0
        setStats(statsData)
      } else {
        showErrorNotification(result.error || '검색 중 오류가 발생했습니다.', 'handleSearch')
        setSearchResult(undefined)
        setReports([])
      }
    } catch (error) {
      showErrorNotification(error, 'handleSearch')
      setSearchResult(undefined)
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  const handleQuickFilter = async (filterId: string) => {
    setLoading(true)
    setIsSearchMode(true)
    try {
      const result = await getQuickFilterResults(filterId, dailyReportSearchConfig.quickFilters)
      
      if (result.success && result.data) {
        setSearchResult(result.data)
        setReports(result.data.items)
        
        // Calculate stats for filtered results
        const statsData = result.data.items.reduce((acc: unknown, report: unknown) => {
          acc.totalReports++
          acc[`${report.status}Reports` as keyof ReportStats]++
          acc.totalWorkers += report.total_workers || 0
          acc.totalNPC1000Used += report.npc1000_used || 0
          return acc
        }, {
          totalReports: 0,
          draftReports: 0,
          submittedReports: 0,
          approvedReports: 0,
          rejectedReports: 0,
          totalWorkers: 0,
          totalNPC1000Used: 0,
          averageWorkersPerDay: 0
        } as ReportStats)

        statsData.averageWorkersPerDay = result.data.items.length > 0 
          ? Math.round(statsData.totalWorkers / statsData.totalReports) 
          : 0
        setStats(statsData)
      } else {
        showErrorNotification(result.error || '빠른 필터 적용 중 오류가 발생했습니다.', 'handleQuickFilter')
      }
    } catch (error) {
      showErrorNotification(error, 'handleQuickFilter')
    } finally {
      setLoading(false)
    }
  }

  // In search mode, use the reports as-is since filtering is done server-side
  // In normal mode, apply client-side filtering for the old search functionality  
  const filteredReports = isSearchMode ? reports : reports.filter(report => {
    const matchesSearch = 
      report.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.process_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.issues?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSite = selectedSite === 'all' || report.site_id === selectedSite
    const matchesStatus = selectedStatus === 'all' || report.status === selectedStatus
    
    return matchesSearch && matchesSite && matchesStatus
  })

  // Sorting state
  const { data: sortedReports, sortConfig, setSortConfig } = useSortableData(
    filteredReports,
    { key: 'report_date', direction: 'desc' }
  )

  // Table columns configuration
  const tableColumns = [
    {
      key: 'report_date',
      label: '작업일',
      sortable: true,
      width: '120px',
      render: (value: string) => (
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {format(new Date(value), 'MM/dd', { locale: ko })}
        </div>
      )
    },
    {
      key: 'site_id',
      label: '현장',
      sortable: true,
      render: (value: string, report: DailyReport) => {
        // report.site가 join으로 이미 포함되어 있음
        const siteName = (report as unknown).site?.name || sites?.find(s => s.id === value)?.name || '미지정'
        return (
          <div className="text-sm text-gray-900 dark:text-gray-100">
            {siteName}
          </div>
        )
      }
    },
    {
      key: 'status',
      label: '상태',
      sortable: true,
      width: '100px',
      align: 'center' as const,
      render: (value: string) => {
        const statusConfig = {
          draft: { label: '임시저장', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
          submitted: { label: '제출됨', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
          approved: { label: '승인됨', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
          rejected: { label: '반려됨', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' }
        }
        const config = statusConfig[value as keyof typeof statusConfig] || statusConfig.draft
        return (
          <Badge className={`text-xs px-2 py-1 ${config.color}`}>
            {config.label}
          </Badge>
        )
      }
    },
    {
      key: 'total_workers',
      label: '작업인원',
      sortable: true,
      width: '90px',
      align: 'center' as const,
      render: (value: number) => (
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {value || 0}명
        </div>
      )
    },
    {
      key: 'npc1000_used',
      label: '자재사용',
      sortable: true,
      width: '100px',
      align: 'center' as const,
      render: (value: number) => (
        <div className="text-sm text-gray-900 dark:text-gray-100">
          {value ? `${Math.round(value)}kg` : '-'}
        </div>
      )
    },
    {
      key: 'issues',
      label: '특이사항',
      render: (value: string) => (
        <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
          {value || '-'}
        </div>
      )
    },
    {
      key: 'actions',
      label: '작업',
      width: '120px',
      align: 'center' as const,
      render: (value: unknown, report: DailyReport) => {
        const canEdit = currentUser.id === report.created_by && report.status === 'draft'
        return (
          <div className="flex items-center justify-center gap-2">
            <Link href={`/dashboard/daily-reports/${report.id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
              >
                <FileText className="w-3 h-3 mr-1" />
                보기
              </Button>
            </Link>
            {canEdit && (
              <Link href={`/dashboard/daily-reports/${report.id}/edit`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  편집
                </Button>
              </Link>
            )}
          </div>
        )
      }
    }
  ]

  const canCreateReport = ['worker', 'site_manager', 'admin'].includes(currentUser.role)

  return (
    <div className="space-y-6">


      {/* Advanced Search Interface */}
      <SearchInterface
        fields={dailyReportSearchConfig.fields}
        quickFilters={dailyReportSearchConfig.quickFilters}
        onSearch={handleSearch}
        onQuickFilter={handleQuickFilter}
        searchResult={searchResult}
        loading={loading}
        sites={sites}
      />

      {/* Compact Filters - Mobile Optimized */}
      {!isSearchMode && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          {/* Filter Header with Active Filters */}
          <div className="p-3 pb-2 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <Filter className="w-4 h-4" />
                필터
                {!showFilters && getActiveFilters().length > 0 && (
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs px-1.5 py-0.5">
                    {getActiveFilters().length}
                  </Badge>
                )}
              </button>
              
              {/* Active Filters Display when collapsed */}
              {!showFilters && getActiveFilters().length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {getActiveFilters().map((filter, index) => (
                    <div
                      key={`${filter.key}-${index}`}
                      className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full text-xs border border-blue-200 dark:border-blue-700"
                    >
                      <span>{filter.label}</span>
                      <button
                        onClick={() => clearFilter(filter.key)}
                        className="hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {!showFilters && (
                <div className="flex gap-2 items-center">
                  <ViewToggle
                    mode={viewMode}
                    onModeChange={setViewMode}
                    size="sm"
                    availableModes={['card', 'list']}
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Filter Controls */}
          {showFilters && (
            <div className="p-3 space-y-2">
              {/* 현장선택 - 첫번째 */}
              <CustomSelect value={selectedSite} onValueChange={setSelectedSite}>
                <CustomSelectTrigger className={cn(
                  "w-full",
                  touchMode === 'glove' && "min-h-[60px] text-base",
                  touchMode === 'precision' && "min-h-[44px] text-sm",
                  touchMode !== 'precision' && touchMode !== 'glove' && "min-h-[40px] text-sm",
                  getFullTypographyClass('body', 'sm', isLargeFont)
                )}>
                  <CustomSelectValue placeholder="전체 현장" />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  <CustomSelectItem value="all">전체 현장</CustomSelectItem>
                  {sites && sites.length > 0 ? (
                    sites.map((site: unknown) => (
                      <CustomSelectItem key={site.id} value={site.id}>
                        {site.name}
                      </CustomSelectItem>
                    ))
                  ) : (
                    <CustomSelectItem value="loading" disabled>현장 데이터 로딩 중...</CustomSelectItem>
                  )}
                </CustomSelectContent>
              </CustomSelect>
              
              {/* 상태선택 - 두번째 */}
              <CustomSelect value={selectedStatus} onValueChange={setSelectedStatus}>
                <CustomSelectTrigger className={cn(
                  "w-full",
                  touchMode === 'glove' && "min-h-[60px] text-base",
                  touchMode === 'precision' && "min-h-[44px] text-sm",
                  touchMode !== 'precision' && touchMode !== 'glove' && "min-h-[40px] text-sm",
                  getFullTypographyClass('body', 'sm', isLargeFont)
                )}>
                  <CustomSelectValue placeholder="전체 상태" />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  <CustomSelectItem value="all">전체 상태</CustomSelectItem>
                  <CustomSelectItem value="draft">임시저장</CustomSelectItem>
                  <CustomSelectItem value="submitted">제출됨</CustomSelectItem>
                </CustomSelectContent>
              </CustomSelect>

              {/* 기간 선택 - 세번째 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>기간 선택</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                      className={cn(
                        "text-sm bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-lg",
                        touchMode === 'glove' && "min-h-[60px] text-base",
                        touchMode === 'precision' && "min-h-[44px] text-sm",
                        touchMode !== 'precision' && touchMode !== 'glove' && "min-h-[40px] text-sm"
                      )}
                      placeholder="시작일"
                    />
                  </div>
                  <div>
                    <Input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                      className={cn(
                        "text-sm bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-lg",
                        touchMode === 'glove' && "min-h-[60px] text-base",
                        touchMode === 'precision' && "min-h-[44px] text-sm",
                        touchMode !== 'precision' && touchMode !== 'glove' && "min-h-[40px] text-sm"
                      )}
                      placeholder="종료일"
                    />
                  </div>
                </div>
                
                {/* Quick Date Presets */}
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => {
                      const today = new Date()
                      const oneWeekAgo = new Date(today)
                      oneWeekAgo.setDate(today.getDate() - 7)
                      setDateRange({
                        from: oneWeekAgo.toISOString().split('T')[0],
                        to: today.toISOString().split('T')[0]
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
                        from: oneMonthAgo.toISOString().split('T')[0],
                        to: today.toISOString().split('T')[0]
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
                        from: startOfMonth.toISOString().split('T')[0],
                        to: today.toISOString().split('T')[0]
                      })
                    }}
                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                  >
                    이번달
                  </button>
                  <button
                    onClick={() => setDateRange({ from: '', to: '' })}
                    className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                  >
                    초기화
                  </button>
                </div>
              </div>

              {/* 검색어 입력 - 네번째 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="부재명, 공정, 특이사항으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-9 ${
                    touchMode === 'glove' ? 'h-14' : 
                    touchMode === 'precision' ? 'h-9' : 
                    'h-10'
                  } ${getFullTypographyClass('body', 'sm', isLargeFont)} bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-xl focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 dark:text-white`}
                />
              </div>


              {/* Action Buttons */}
              <div className="flex gap-2 justify-between">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="compact" 
                    onClick={loadReports} 
                    className="h-8 px-3 rounded-lg dark:border-gray-600 dark:text-gray-300"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    새로고침
                  </Button>
                  {canCreateReport && (
                    <Link href="/dashboard/daily-reports/new">
                      <Button 
                        variant="primary" 
                        size="compact" 
                        className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        새 작업일지
                      </Button>
                    </Link>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <ViewToggle
                    mode={viewMode}
                    onModeChange={setViewMode}
                    size="sm"
                    availableModes={['card', 'list']}
                  />
                  <ExportButton 
                    sites={sites}
                    className="h-8 px-3"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Compact Search Mode Actions */}
      {isSearchMode && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
          <div className="flex gap-2 justify-between items-center">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="compact" 
                onClick={() => {
                  setIsSearchMode(false)
                  setSearchResult(undefined)
                  loadReports()
                }}
                className="h-8 px-3 rounded-lg dark:border-gray-600 dark:text-gray-300"
              >
                <X className="w-3 h-3 mr-1" />
                검색 해제
              </Button>
              {canCreateReport && (
                <Link href="/dashboard/daily-reports/new">
                  <Button 
                    variant="primary" 
                    size="compact" 
                    className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    새 작업일지
                  </Button>
                </Link>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <ViewToggle
                mode={viewMode}
                onModeChange={setViewMode}
                size="sm"
                availableModes={['card', 'list']}
              />
              <ExportButton 
                sites={sites}
                className="h-8 px-3"
              />
            </div>
          </div>
        </div>
      )}

      {/* High-Density Report List */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`mt-3 text-gray-600 dark:text-gray-400 ${getFullTypographyClass('body', 'sm', isLargeFont)}`}>작업일지를 불러오는 중...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
          <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className={`text-gray-600 dark:text-gray-400 ${getFullTypographyClass('body', 'sm', isLargeFont)} mb-1`}>작업일지가 없습니다.</p>
          <p className={`text-gray-500 dark:text-gray-500 ${getFullTypographyClass('caption', 'xs', isLargeFont)} mb-3`}>새로운 작업일지를 작성해보세요.</p>
          {canCreateReport && (
            <Link href="/dashboard/daily-reports/new">
              <Button 
                variant="primary" 
                size={touchMode === 'glove' ? 'field' : touchMode === 'precision' ? 'compact' : 'standard'}
                touchMode={touchMode}
                className="px-4 rounded-xl"
              >
                작업일지 작성하기
              </Button>
            </Link>
          )}
        </div>
      ) : viewMode === 'card' ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {sortedReports.map((report: unknown) => {
              // report.site가 join으로 이미 포함되어 있음
              const site = report.site || sites?.find(s => s.id === report.site_id)
              const canEdit = currentUser.id === report.created_by && report.status === 'draft'
              
              return (
                <CompactReportCard
                  key={report.id}
                  report={report}
                  site={site}
                  canEdit={canEdit}
                  onViewDetail={() => handleViewDetail(report)}
                />
              )
            })}
          </div>
        </div>
      ) : (
        <ListView
          data={sortedReports}
          columns={tableColumns}
          sortConfig={sortConfig}
          onSort={setSortConfig}
          onRowClick={handleViewDetail}
          emptyMessage="작업일지가 없습니다"
          striped={true}
          hoverable={true}
          compact={false}
          className="bg-white dark:bg-gray-900"
          containerClassName="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        />
      )}

      {/* Detail Dialog */}
      <DailyReportDetailDialog
        report={selectedReport}
        site={selectedReport ? (selectedReport as unknown).site || sites?.find(s => s.id === selectedReport.site_id) : undefined}
        currentUser={currentUser}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />
    </div>
  )
}