'use client'


interface DailyReport {
  id: string
  work_date: string
  member_name: string
  process_type: string
  component_name?: string
  work_process?: string
  work_section?: string
  total_workers: number
  npc1000_incoming: number
  npc1000_used: number
  npc1000_remaining: number
  issues: string
  status: 'draft' | 'submitted'
  created_at: string
  updated_at: string
  created_by: string
  site_id: string
  profiles?: {
    full_name: string
    email: string
    phone?: string
    role?: string
  }
  worker_details_count?: number
  daily_documents_count?: number
}

interface SiteDailyReportsTabProps {
  siteId: string
  siteName: string
}

type SortField = 'work_date' | 'member_name' | 'total_workers' | 'status' | 'created_at'
type SortDirection = 'asc' | 'desc'

interface SortState {
  field: SortField
  direction: SortDirection
}

const statusLabels = {
  draft: '임시저장',
  submitted: '제출됨'
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800'
}

export default function SiteDailyReportsTab({ siteId, siteName }: SiteDailyReportsTabProps) {
  const [reports, setReports] = useState<DailyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'submitted' | 'draft'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  
  const [sortState, setSortState] = useState<SortState>({
    field: 'work_date',
    direction: 'desc'
  })

  useEffect(() => {
    fetchReports()
  }, [siteId, filter, dateFilter, sortState])

  const fetchReports = async () => {
    try {
      setLoading(true)
      let url = `/api/admin/sites/${siteId}/daily-reports`
      const params = new URLSearchParams()
      
      if (filter !== 'all') {
        params.append('status', filter)
      }
      if (dateFilter) {
        params.append('date', dateFilter)
      }
      if (sortState.field) {
        params.append('sortField', sortState.field)
        params.append('sortDirection', sortState.direction)
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setReports(data.success ? data.data || [] : [])
      }
    } catch (error) {
      console.error('Error fetching daily reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: SortField) => {
    setSortState(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const getSortIcon = (field: SortField) => {
    if (sortState.field !== field) {
      return <ChevronsUpDown className="h-4 w-4 text-gray-400" />
    }
    return sortState.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-600" />
      : <ChevronDown className="h-4 w-4 text-blue-600" />
  }

  const filteredReports = reports.filter(report => {
    const matchesSearch = searchTerm === '' || 
      report.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.process_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.component_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.work_process?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.work_section?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.issues?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const submittedCount = reports.filter(r => r.status === 'submitted').length
  const draftCount = reports.filter(r => r.status === 'draft').length
  const totalWorkers = reports.reduce((sum, r) => sum + (r.total_workers || 0), 0)

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('작업일지를 삭제하시겠습니까?')) return
    
    try {
      const response = await fetch(`/api/admin/daily-reports/${reportId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        fetchReports()
        alert('작업일지가 삭제되었습니다.')
      } else {
        alert('작업일지 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error deleting report:', error)
      alert('작업일지 삭제 중 오류가 발생했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 및 통계 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            작업일지 통합 관리
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {siteName} 현장의 모든 작업일지를 관리합니다
          </p>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">전체 작업일지</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{reports.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">제출완료</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{submittedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <Edit className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">임시저장</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{draftCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">총 작업인원</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{totalWorkers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="작업자명, 부재명, 공정, 구간, 특이사항으로 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value as unknown)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">모든 상태</option>
              <option value="submitted">제출됨</option>
              <option value="draft">임시저장</option>
            </select>
            
            <input
              type="month"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            
            <Link
              href={`/dashboard/admin/daily-reports/new?site_id=${siteId}`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              새 작업일지
            </Link>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          총 <span className="font-semibold text-gray-900 dark:text-gray-100">{filteredReports.length}</span>개의 작업일지
        </p>
        <button className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <Download className="h-4 w-4" />
          Excel 다운로드
        </button>
      </div>

      {/* Reports Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center">
            <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || filter !== 'all' || dateFilter ? '조건에 맞는 작업일지가 없습니다.' : '작성된 작업일지가 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px]">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('work_date')}
                  >
                    <div className="flex items-center gap-1">
                      작업일 <span className="text-blue-600 dark:text-blue-400 text-xs normal-case">(클릭시 상세)</span>
                      {getSortIcon('work_date')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    부재명
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    작업공정
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    작업구간
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('member_name')}
                  >
                    <div className="flex items-center gap-1">
                      작업책임자
                      {getSortIcon('member_name')}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('total_workers')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      인원
                      {getSortIcon('total_workers')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    자재현황
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    특이사항
                  </th>
                  <th 
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      상태
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    문서/상세
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-1">
                      작성정보
                      {getSortIcon('created_at')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[100px]">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400">
                            {format(new Date(report.work_date), 'yyyy.MM.dd', { locale: ko })}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(report.work_date), 'EEEE', { locale: ko })}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {report.component_name || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {report.work_process || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {report.work_section || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{report.member_name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{report.process_type}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {report.total_workers}명
                        </div>
                        {report.worker_details_count && report.worker_details_count > 0 && (
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            상세: {report.worker_details_count}명
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs">
                        <div className="flex items-center text-gray-700 dark:text-gray-300">
                          <span className="font-medium mr-1">입고:</span>
                          <span className="text-blue-600 dark:text-blue-400">{report.npc1000_incoming}</span>
                        </div>
                        <div className="flex items-center text-gray-700 dark:text-gray-300">
                          <span className="font-medium mr-1">사용:</span>
                          <span className="text-orange-600 dark:text-orange-400">{report.npc1000_used}</span>
                        </div>
                        <div className="flex items-center text-gray-700 dark:text-gray-300">
                          <span className="font-medium mr-1">잔여:</span>
                          <span className="text-green-600 dark:text-green-400">{report.npc1000_remaining}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      {report.issues ? (
                        <div className="text-xs text-gray-700 dark:text-gray-300 truncate" title={report.issues}>
                          {report.issues}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">-</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[report.status]}`}>
                        {statusLabels[report.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {report.daily_documents_count && report.daily_documents_count > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                            📄 {report.daily_documents_count}
                          </span>
                        )}
                        {report.worker_details_count && report.worker_details_count > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                            👷 {report.worker_details_count}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
                          {report.profiles?.full_name || '알 수 없음'}
                        </div>
                        {report.profiles?.role && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {report.profiles.role === 'admin' ? '관리자' : 
                             report.profiles.role === 'site_manager' ? '현장담당' :
                             report.profiles.role === 'worker' ? '작업자' : report.profiles.role}
                          </div>
                        )}
                        <div className="text-xs text-gray-400">
                          {format(new Date(report.created_at), 'HH:mm', { locale: ko })}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      <div className="flex justify-center gap-1">
                        <Link
                          href={`/dashboard/admin/daily-reports/${report.id}`}
                          className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                          title="상세보기"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/dashboard/admin/daily-reports/${report.id}/edit`}
                          className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                          title="편집"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 추가 액션 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          총 {filteredReports.length}개의 작업일지
          {filter !== 'all' && ` (${filter === 'submitted' ? '제출됨' : '임시저장'})`}
        </div>
        
        <Link
          href={`/dashboard/admin/daily-reports?site_id=${siteId}`}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
        >
          전체 작업일지 관리 →
        </Link>
      </div>
    </div>
  )
}