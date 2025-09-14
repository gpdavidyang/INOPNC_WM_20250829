'use client'


interface DailyReport {
  id: string
  work_date: string
  member_name: string
  process_type: string
  total_workers: number
  status: string
  site_name?: string
  profiles?: {
    full_name: string
  }
  sites?: {
    name: string
  }
}

export default function UnifiedDailyReportListView() {
  const [reports, setReports] = useState<DailyReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/admin/daily-reports')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setReports(data.data || [])
        }
      }
    } catch (error) {
      console.error('Error fetching daily reports:', error)
    } finally {
      setLoading(false)
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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">작업일지 통합 관리</h3>
        <Link
          href="/dashboard/admin/daily-reports"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
        >
          상세 관리 →
        </Link>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">등록된 작업일지가 없습니다</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {reports.map((report) => (
              <li key={report.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                        <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(report.work_date).toLocaleDateString('ko-KR')}
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          report.status === 'submitted' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                        }`}>
                          {report.status === 'submitted' ? '제출됨' : '임시저장'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {report.member_name} - {report.process_type}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Users className="h-4 w-4 mr-1" />
                          작업자 {report.total_workers}명
                        </div>
                        {(report.sites?.name || report.site_name) && (
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <MapPin className="h-4 w-4 mr-1" />
                            {report.sites?.name || report.site_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link
                      href={`/dashboard/admin/daily-reports/${report.id}`}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      보기
                    </Link>
                    <Link
                      href={`/dashboard/admin/daily-reports/${report.id}/edit`}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      편집
                    </Link>
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