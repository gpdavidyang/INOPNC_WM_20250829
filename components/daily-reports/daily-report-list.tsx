'use client'


interface DailyReportListProps {
  sites: Site[]
  initialReports?: DailyReport[]
  currentUserRole?: string
}

export default function DailyReportList({ 
  sites, 
  initialReports = [],
  currentUserRole 
}: DailyReportListProps) {
  const router = useRouter()
  const [reports, setReports] = useState<DailyReport[]>(initialReports)
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  
  // Filters
  const [filters, setFilters] = useState({
    site_id: '',
    status: '' as DailyReportStatus | '',
    start_date: '',
    end_date: '',
    search: ''
  })
  
  // Pagination
  const [page, setPage] = useState(1)
  const limit = 20

  useEffect(() => {
    fetchReports()
  }, [filters, page])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const result = await getDailyReports({
        ...filters,
        status: filters.status || undefined,
        limit,
        offset: (page - 1) * limit
      })

      if (result.success && result.data) {
        setReports(result.data as DailyReport[])
        setTotalCount(result.count || 0)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value })
    setPage(1) // Reset to first page when filters change
  }

  const getStatusBadge = (status: DailyReportStatus) => {
    const statusConfig = {
      draft: { label: '임시저장', variant: 'secondary' as const, icon: Clock },
      submitted: { label: '제출됨', variant: 'outline' as const, icon: CheckCircle }
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const canCreateReport = ['worker', 'site_manager', 'admin', 'system_admin'].includes(currentUserRole || '')

  const totalPages = Math.ceil(totalCount / limit)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">작업일지 목록</h1>
        {canCreateReport && (
          <Button onClick={() => router.push('/dashboard/daily-reports/new')}>
            <Plus className="h-4 w-4 mr-2" />
            새 작업일지
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-xs font-medium">필터</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {/* 현장 선택 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">현장</label>
            <CustomSelect
              options={[
                { value: '', label: '전체 현장' },
                ...sites.map(site => ({
                  value: site.id,
                  label: site.name
                }))
              ]}
              value={filters.site_id}
              onChange={(value) => handleFilterChange('site_id', value)}
              placeholder="현장 선택"
              icon={<Building2 className="h-4 w-4" />}
            />
          </div>

          {/* 상태 선택 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">상태</label>
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-md">
              <button
                onClick={() => handleFilterChange('status', '')}
                className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                  filters.status === '' 
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => handleFilterChange('status', 'draft')}
                className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                  filters.status === 'draft' 
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                임시저장
              </button>
              <button
                onClick={() => handleFilterChange('status', 'submitted')}
                className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                  filters.status === 'submitted' 
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                제출됨
              </button>
            </div>
          </div>

          {/* 기간 선택 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">기간</label>
            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                className="text-xs h-8"
              />
              <span className="text-gray-400 text-xs">~</span>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                className="text-xs h-8"
              />
            </div>
          </div>

          {/* 검색 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">검색</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
              <Input
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="검색..."
                className="pl-8 text-sm h-8"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Reports List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
            <p className="mt-2 text-gray-500">로딩중...</p>
          </div>
        ) : reports.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-500">작업일지가 없습니다</p>
            {canCreateReport && (
              <Button 
                onClick={() => router.push('/dashboard/daily-reports/new')}
                className="mt-4"
              >
                첫 작업일지 작성하기
              </Button>
            )}
          </Card>
        ) : (
          reports.map(report => (
            <Card 
              key={report.id} 
              className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/dashboard/daily-reports/${report.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">
                      {(report as unknown).site?.name || '현장 정보 없음'}
                    </h3>
                    <span className="text-sm text-gray-500">
                      <Calendar className="inline h-3 w-3 mr-1" />
                      {new Date((report as unknown).report_date || report.work_date).toLocaleDateString('ko-KR')}
                    </span>
                    {getStatusBadge(report.status || 'draft')}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">작성자:</span>
                      <span className="ml-1 font-medium">
                        {(report as unknown).created_by_profile?.full_name || '-'}
                      </span>
                    </div>
                    {(report as unknown).weather && (
                      <div>
                        <span className="text-gray-500">날씨:</span>
                        <span className="ml-1">{(report as unknown).weather}</span>
                      </div>
                    )}
                    {((report as unknown).temperature_high || (report as unknown).temperature_low) && (
                      <div>
                        <span className="text-gray-500">기온:</span>
                        <span className="ml-1">
                          {(report as unknown).temperature_high}°C ~ {(report as unknown).temperature_low}°C
                        </span>
                      </div>
                    )}
                    {(report as unknown).approved_by_profile && (
                      <div>
                        <span className="text-gray-500">승인자:</span>
                        <span className="ml-1 font-medium">
                          {(report as unknown).approved_by_profile.full_name}
                        </span>
                      </div>
                    )}
                  </div>

                  {(report as unknown).notes && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {(report as unknown).notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="compact"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/dashboard/daily-reports/${report.id}`)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="compact"
                    onClick={(e) => {
                      e.stopPropagation()
                      // TODO: Implement download functionality
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="compact"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = page > 3 ? page - 2 + i : i + 1
              if (pageNum > totalPages) return null
              
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? 'primary' : 'outline'}
                  size="compact"
                  onClick={() => setPage(pageNum)}
                  className="w-10"
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="compact"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}