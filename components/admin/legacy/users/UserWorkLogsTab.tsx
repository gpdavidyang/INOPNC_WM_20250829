'use client'


interface UserWorkLogsTabProps {
  userId: string
  userName: string
}

interface DailyReport {
  id: string
  work_date: string
  site_id: string
  site_name: string
  process_type: string
  component_name?: string
  total_workers: number
  npc1000_used: number
  issues: string
  status: 'draft' | 'submitted'
  created_at: string
  updated_at: string
}

export default function UserWorkLogsTab({ userId, userName }: UserWorkLogsTabProps) {
  const [reports, setReports] = useState<DailyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'submitted'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchDailyReports()
  }, [userId])

  const fetchDailyReports = async () => {
    try {
      setLoading(true)
      
      const { data: reportsData, error: reportsError } = await supabase
        .from('daily_reports')
        .select(`
          id,
          work_date,
          site_id,
          process_type,
          component_name,
          total_workers,
          npc1000_used,
          issues,
          status,
          created_at,
          updated_at,
          sites (
            name
          )
        `)
        .eq('created_by', userId)
        .order('work_date', { ascending: false })
        .limit(50)

      if (reportsError) {
        console.error('Error fetching daily reports:', reportsError)
        return
      }

      const formattedReports = reportsData?.map(report => ({
        id: report.id,
        work_date: report.work_date,
        site_id: report.site_id,
        site_name: report.sites?.name || '',
        process_type: report.process_type,
        component_name: report.component_name,
        total_workers: report.total_workers,
        npc1000_used: report.npc1000_used,
        issues: report.issues,
        status: report.status,
        created_at: report.created_at,
        updated_at: report.updated_at
      })) || []

      setReports(formattedReports)
    } catch (error) {
      console.error('Error fetching daily reports:', error)
    } finally {
      setLoading(false)
    }
  }


  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { text: '임시저장', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300' },
      submitted: { text: '제출완료', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.site_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.process_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.component_name && report.component_name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">전체 작업일지</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {reports.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">제출완료</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {reports.filter(r => r.status === 'submitted').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <FileText className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">임시저장</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {reports.filter(r => r.status === 'draft').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">총 사용량</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {reports.reduce((sum, r) => sum + r.npc1000_used, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative">
            <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="현장명, 공정 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full sm:w-80 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              필터
              <ChevronDown className="ml-1 h-4 w-4" />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  상태
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as unknown)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="all">전체</option>
                  <option value="submitted">제출완료</option>
                  <option value="draft">임시저장</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Work Logs List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            작업일지 목록 ({filteredReports.length}건)
          </h3>
        </div>

        {filteredReports.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              작업일지가 없습니다
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {userName}님이 작성한 작업일지가 없습니다.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    작업일
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    현장명
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    공정
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    작업인원
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    사용량
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    작성일
                  </th>
                  <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {format(new Date(report.work_date), 'yyyy.MM.dd', { locale: ko })}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {report.site_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {report.process_type}
                        </p>
                        {report.component_name && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {report.component_name}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {report.total_workers}명
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <Package className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {report.npc1000_used}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(report.created_at), 'MM.dd HH:mm', { locale: ko })}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/dashboard/admin/daily-reports/${report.id}`}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        상세보기
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}