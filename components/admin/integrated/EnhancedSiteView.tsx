'use client'


interface Site {
  id: string
  name: string
  address: string
  status: string
  manager_name?: string
  start_date?: string
  end_date?: string
  construction_manager_name?: string
  safety_manager_name?: string
}

interface SiteWithStats extends Site {
  daily_reports_count?: number
  documents_count?: number
  partners_count?: number
  workers_count?: number
  recent_activity?: string
}

export default function EnhancedSiteView() {
  const [sites, setSites] = useState<SiteWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSite, setSelectedSite] = useState<string | null>(null)
  const [siteDetails, setSiteDetails] = useState<unknown>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchEnhancedSites()
  }, [])

  useEffect(() => {
    if (selectedSite) {
      fetchSiteDetails(selectedSite)
    }
  }, [selectedSite])

  const fetchEnhancedSites = async () => {
    try {
      setLoading(true)
      
      // Fetch sites with statistics
      const [sitesRes, reportsRes, docsRes] = await Promise.all([
        fetch('/api/sites'),
        fetch('/api/admin/daily-reports'),
        fetch('/api/admin/documents/integrated')
      ])

      const sitesData = await sitesRes.json()
      const reportsData = await reportsRes.json()
      const docsData = await docsRes.json()

      if (sitesData.success) {
        const sites = sitesData.data.filter((site: Site) => site.id !== 'all')
        const reports = reportsData.success ? reportsData.data : []
        
        // Enhance sites with statistics
        const enhancedSites = sites.map((site: Site) => {
          const siteReports = reports.filter((r: unknown) => r.site_id === site.id)
          const siteDocs = docsData.data?.filter((d: unknown) => d.site_id === site.id) || []
          
          return {
            ...site,
            daily_reports_count: siteReports.length,
            documents_count: siteDocs.length,
            partners_count: 0, // Will be fetched separately
            workers_count: 0, // Will be fetched separately
            recent_activity: siteReports[0]?.created_at
          }
        })
        
        setSites(enhancedSites)
      }
    } catch (error) {
      console.error('Error fetching enhanced sites:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSiteDetails = async (siteId: string) => {
    try {
      const response = await fetch(`/api/admin/sites/${siteId}/integrated`)
      if (response.ok) {
        const data = await response.json()
        setSiteDetails(data)
      }
    } catch (error) {
      console.error('Error fetching site details:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { text: '진행중', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300', icon: CheckCircle },
      planning: { text: '계획중', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300', icon: Clock },
      completed: { text: '완료', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300', icon: CheckCircle },
      suspended: { text: '중단', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300', icon: AlertCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </span>
    )
  }

  const filteredSites = sites.filter(site => {
    const matchesSearch = site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         site.address.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || site.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">현장 통합 관리</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            전체 {filteredSites.length}개 현장
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="현장 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full sm:w-64 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="all">전체 상태</option>
            <option value="active">진행중</option>
            <option value="planning">계획중</option>
            <option value="completed">완료</option>
            <option value="suspended">중단</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
              }`}
            >
              그리드
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-b border-r ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
              }`}
            >
              리스트
            </button>
          </div>

          {/* Add Site Link */}
          <Link
            href="/dashboard/admin/sites/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            현장 추가
          </Link>
        </div>
      </div>

      {/* Site Cards/List */}
      {filteredSites.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || statusFilter !== 'all' ? '검색 결과가 없습니다' : '등록된 현장이 없습니다'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSites.map((site) => (
            <div
              key={site.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedSite(site.id === selectedSite ? null : site.id)}
            >
              {/* Card Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {site.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {site.address}
                        </p>
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(site.status)}
                </div>
              </div>

              {/* Card Stats */}
              <div className="p-6 grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">작업일지</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {site.daily_reports_count || 0}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">문서</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {site.documents_count || 0}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">파트너사</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {site.partners_count || 0}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">작업자</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {site.workers_count || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {site.recent_activity && (
                      <>최근 활동: {format(new Date(site.recent_activity), 'MM월 dd일', { locale: ko })}</>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/admin/sites/${site.id}?from=integrated`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      상세보기
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedSite === site.id && siteDetails && (
                <div className="px-6 py-4 bg-blue-50 dark:bg-blue-900/10 border-t-2 border-blue-500">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">건설관리자</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {site.construction_manager_name || '미등록'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">안전관리자</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {site.safety_manager_name || '미등록'}
                        </p>
                      </div>
                    </div>
                    {site.start_date && (
                      <div className="text-sm">
                        <p className="text-gray-500 dark:text-gray-400">공사기간</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {format(new Date(site.start_date), 'yyyy.MM.dd', { locale: ko })} ~ 
                          {site.end_date ? format(new Date(site.end_date), 'yyyy.MM.dd', { locale: ko }) : '진행중'}
                        </p>
                      </div>
                    )}
                    <div className="pt-3 flex gap-2">
                      <Link
                        href={`/dashboard/admin/sites/${site.id}?from=integrated`}
                        className="flex-1 text-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                      >
                        현장 상세 관리
                      </Link>
                      <Link
                        href={`/dashboard/admin/sites/${site.id}/edit?from=integrated`}
                        className="flex-1 text-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
                      >
                        정보 수정
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredSites.map((site) => (
              <li key={site.id}>
                <div className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {site.name}
                          </p>
                          {getStatusBadge(site.status)}
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <MapPin className="h-4 w-4 mr-1" />
                            {site.address}
                          </div>
                          {site.start_date && (
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <Calendar className="h-4 w-4 mr-1" />
                              {format(new Date(site.start_date), 'yyyy.MM.dd', { locale: ko })}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-6 mt-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            작업일지: <span className="font-medium text-gray-900 dark:text-gray-100">{site.daily_reports_count || 0}</span>
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            문서: <span className="font-medium text-gray-900 dark:text-gray-100">{site.documents_count || 0}</span>
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            파트너사: <span className="font-medium text-gray-900 dark:text-gray-100">{site.partners_count || 0}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/dashboard/admin/sites/${site.id}?from=integrated`}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        상세
                      </Link>
                      <Link
                        href={`/dashboard/admin/sites/${site.id}/edit?from=integrated`}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        편집
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}