'use client'


interface PartnerSitesClientProps {
  profile: Profile & { partner_companies?: unknown }
  sitePartnerships: unknown[]
  reportCountMap: Record<string, number>
  workerCountMap: Record<string, number>
}

export default function PartnerSitesClient({
  profile,
  sitePartnerships,
  reportCountMap,
  workerCountMap
}: PartnerSitesClientProps) {
  const { isLargeFont } = useFontSize()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all')

  const getTypographyClass = (type: string, size: string = 'base') => {
    return getFullTypographyClass(type, size, isLargeFont)
  }

  // Filter sites based on search and status
  const filteredSites = sitePartnerships.filter(sp => {
    const site = sp.sites
    if (!site) return false

    // Search filter
    const matchesSearch = searchTerm === '' || 
      site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.address?.toLowerCase().includes(searchTerm.toLowerCase())

    // Status filter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && site.status === 'active') ||
      (statusFilter === 'completed' && site.status === 'completed')

    return matchesSearch && matchesStatus
  })

  // Calculate statistics
  const totalSites = sitePartnerships.length
  const activeSites = sitePartnerships.filter(sp => sp.sites?.status === 'active').length
  const completedSites = sitePartnerships.filter(sp => sp.sites?.status === 'completed').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`${getTypographyClass('header', 'xl')} font-bold text-gray-900 dark:text-gray-100`}>
          참여 현장 관리
        </h1>
        <p className={`${getTypographyClass('body', 'base')} text-gray-600 dark:text-gray-400 mt-2`}>
          {profile.partner_companies?.company_name}에서 참여중인 모든 현장을 관리합니다
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getTypographyClass('caption', 'sm')} text-gray-500 dark:text-gray-400`}>
                전체 현장
              </p>
              <p className={`${getTypographyClass('header', 'lg')} font-bold text-gray-900 dark:text-gray-100 mt-1`}>
                {totalSites}
              </p>
            </div>
            <Building2 className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getTypographyClass('caption', 'sm')} text-gray-500 dark:text-gray-400`}>
                진행중
              </p>
              <p className={`${getTypographyClass('header', 'lg')} font-bold text-green-600 dark:text-green-400 mt-1`}>
                {activeSites}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getTypographyClass('caption', 'sm')} text-gray-500 dark:text-gray-400`}>
                완료됨
              </p>
              <p className={`${getTypographyClass('header', 'lg')} font-bold text-gray-600 dark:text-gray-400 mt-1`}>
                {completedSites}
              </p>
            </div>
            <Clock className="h-8 w-8 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="현장명 또는 주소로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg ${
                  getTypographyClass('body', 'sm')
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as unknown)}
              className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg ${
                getTypographyClass('body', 'sm')
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500`}
            >
              <option value="all">전체 현장</option>
              <option value="active">진행중</option>
              <option value="completed">완료됨</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sites List */}
      <div className="space-y-4">
        {filteredSites.length > 0 ? (
          filteredSites.map((sp) => {
            const site = sp.sites
            const reportCount = reportCountMap[sp.site_id] || 0
            const workerCount = workerCountMap[sp.site_id] || 0

            return (
              <div key={sp.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
                <Link href={`/partner/sites/${sp.site_id}`}>
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <Building2 className="h-6 w-6 text-blue-500 mt-1" />
                          <div className="flex-1">
                            <h3 className={`${getTypographyClass('header', 'md')} font-semibold text-gray-900 dark:text-gray-100`}>
                              {site.name}
                            </h3>
                            
                            <div className="flex items-center gap-2 mt-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <p className={`${getTypographyClass('body', 'sm')} text-gray-600 dark:text-gray-400`}>
                                {site.address}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 mt-3">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full ${
                                getTypographyClass('caption', 'xs')
                              } font-medium ${
                                site.status === 'active'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}>
                                {site.status === 'active' ? '진행중' : '완료'}
                              </span>

                              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                <Calendar className="h-4 w-4" />
                                <span className={getTypographyClass('caption', 'xs')}>
                                  참여일: {new Date(sp.assigned_date).toLocaleDateString('ko-KR')}
                                </span>
                              </div>

                              {sp.contract_value && (
                                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                  <span className={getTypographyClass('caption', 'xs')}>
                                    계약금액: {sp.contract_value.toLocaleString()}원
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-6 mt-4">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span className={`${getTypographyClass('caption', 'sm')} text-gray-600 dark:text-gray-400`}>
                                  작업인원: {workerCount}명
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-400" />
                                <span className={`${getTypographyClass('caption', 'sm')} text-gray-600 dark:text-gray-400`}>
                                  작업일지: {reportCount}건
                                </span>
                              </div>
                            </div>

                            {/* Site Manager Info */}
                            {site.profiles && (
                              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <p className={`${getTypographyClass('caption', 'xs')} text-gray-500 dark:text-gray-400 mb-1`}>
                                  현장 관리자
                                </p>
                                <p className={`${getTypographyClass('body', 'sm')} text-gray-700 dark:text-gray-300`}>
                                  {site.profiles.full_name} · {site.profiles.phone}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </Link>
              </div>
            )
          })
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <Building2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className={`${getTypographyClass('body', 'base')} text-gray-500 dark:text-gray-400`}>
              {searchTerm || statusFilter !== 'all' 
                ? '검색 조건에 맞는 현장이 없습니다'
                : '참여중인 현장이 없습니다'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}