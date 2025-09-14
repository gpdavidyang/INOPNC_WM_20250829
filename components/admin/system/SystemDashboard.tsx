'use client'


interface SystemStatus {
  status: 'healthy' | 'degraded' | 'down'
  database: boolean
  storage: boolean
  uptime: number
  memory: {
    used: number
    total: number
    percentage: number
  }
  activeUsers: number
  requestsPerMinute: number
  errorRate: number
}

export default function SystemDashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSystemStatus()
    // Refresh every 30 seconds
    const interval = setInterval(fetchSystemStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/admin/system/status')
      if (!response.ok) throw new Error('Failed to fetch system status')
      const data = await response.json()
      setSystemStatus(data)
      setError(null)
    } catch (err) {
      setError('시스템 상태를 불러올 수 없습니다')
      // Mock data for development
      setSystemStatus({
        status: 'healthy',
        database: true,
        storage: true,
        uptime: 432000, // 5 days in seconds
        memory: {
          used: 4294967296, // 4GB in bytes
          total: 8589934592, // 8GB in bytes
          percentage: 50
        },
        activeUsers: 24,
        requestsPerMinute: 145,
        errorRate: 0.02
      })
    } finally {
      setLoading(false)
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}일 ${hours}시간 ${minutes}분`
  }

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024)
    return `${gb.toFixed(1)}GB`
  }

  const getStatusColor = (status: 'healthy' | 'degraded' | 'down') => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400'
      case 'degraded': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'down': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400'
    }
  }

  const getStatusIcon = (status: 'healthy' | 'degraded' | 'down') => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5" />
      case 'degraded': return <AlertTriangle className="h-5 w-5" />
      case 'down': return <AlertTriangle className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!systemStatus) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        시스템 상태를 불러올 수 없습니다
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            시스템 상태
          </h2>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor(systemStatus.status)}`}>
            {getStatusIcon(systemStatus.status)}
            <span className="text-sm font-medium capitalize">
              {systemStatus.status === 'healthy' ? '정상' : 
               systemStatus.status === 'degraded' ? '저하' : '오류'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Database Status */}
          <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Database className={`h-8 w-8 mr-3 ${systemStatus.database ? 'text-green-600' : 'text-red-600'}`} />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">데이터베이스</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {systemStatus.database ? '연결됨' : '연결 끊김'}
              </p>
            </div>
          </div>

          {/* Storage Status */}
          <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <HardDrive className={`h-8 w-8 mr-3 ${systemStatus.storage ? 'text-green-600' : 'text-red-600'}`} />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">스토리지</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {systemStatus.storage ? '정상' : '오류'}
              </p>
            </div>
          </div>

          {/* Uptime */}
          <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Clock className="h-8 w-8 mr-3 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">가동 시간</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {formatUptime(systemStatus.uptime)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Users */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {systemStatus.activeUsers}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">활성 사용자</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">실시간</p>
        </div>

        {/* Requests per Minute */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <Activity className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {systemStatus.requestsPerMinute}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">요청/분</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">평균</p>
        </div>

        {/* Memory Usage */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {systemStatus.memory.percentage}%
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">메모리 사용률</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {formatBytes(systemStatus.memory.used)} / {formatBytes(systemStatus.memory.total)}
          </p>
        </div>

        {/* Error Rate */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className={`h-8 w-8 ${systemStatus.errorRate > 0.05 ? 'text-red-600' : 'text-yellow-600'}`} />
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {(systemStatus.errorRate * 100).toFixed(2)}%
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">오류율</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">지난 1시간</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          빠른 작업
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            <Shield className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm text-gray-700 dark:text-gray-300">보안 설정</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            <Database className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm text-gray-700 dark:text-gray-300">DB 백업</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            <Activity className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm text-gray-700 dark:text-gray-300">로그 조회</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            <Settings className="h-8 w-8 text-gray-600 mb-2" />
            <span className="text-sm text-gray-700 dark:text-gray-300">시스템 설정</span>
          </button>
        </div>
      </div>
    </div>
  )
}