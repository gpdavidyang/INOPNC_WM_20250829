'use client'

import type { BackupConfig, BackupJob, BackupStats } from '@/lib/backup/types'

interface BackupDashboardProps {
  className?: string
}

export function BackupDashboard({ className }: BackupDashboardProps) {
  const [configs, setConfigs] = useState<BackupConfig[]>([])
  const [recentJobs, setRecentJobs] = useState<BackupJob[]>([])
  const [stats, setStats] = useState<BackupStats | null>(null)
  const [runningJobs, setRunningJobs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadDashboardData()
    // Set up periodic refresh for running jobs
    const interval = setInterval(loadRunningJobs, 5000) // Every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadConfigs(),
        loadRecentJobs(),
        loadStats(),
        loadRunningJobs()
      ])
    } finally {
      setLoading(false)
    }
  }

  const loadConfigs = async () => {
    const result = await getBackupConfigs()
    if (result.success && result.data) {
      setConfigs(result.data)
    } else {
      showErrorNotification(result.error || '백업 설정을 불러오는데 실패했습니다.', 'loadConfigs')
    }
  }

  const loadRecentJobs = async () => {
    const result = await getBackupJobs(undefined, 10)
    if (result.success && result.data) {
      setRecentJobs(result.data)
    } else {
      showErrorNotification(result.error || '최근 백업 작업을 불러오는데 실패했습니다.', 'loadRecentJobs')
    }
  }

  const loadStats = async () => {
    const result = await getBackupStats()
    if (result.success && result.data) {
      setStats(result.data)
    } else {
      showErrorNotification(result.error || '백업 통계를 불러오는데 실패했습니다.', 'loadStats')
    }
  }

  const loadRunningJobs = async () => {
    const result = await getRunningBackupJobs()
    if (result.success && result.data) {
      setRunningJobs(result.data)
    }
  }

  const handleManualBackup = async (configId: string) => {
    try {
      const result = await executeManualBackup(configId)
      if (result.success) {
        toast.success('백업이 시작되었습니다.')
        await loadRunningJobs()
        await loadRecentJobs()
      } else {
        showErrorNotification(result.error || '백업 실행에 실패했습니다.', 'handleManualBackup')
      }
    } catch (error) {
      showErrorNotification(error, 'handleManualBackup')
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadDashboardData()
    } finally {
      setRefreshing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">완료</Badge>
      case 'running':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">실행중</Badge>
      case 'failed':
        return <Badge variant="error">실패</Badge>
      case 'cancelled':
        return <Badge variant="secondary">취소됨</Badge>
      case 'pending':
        return <Badge variant="outline">대기중</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return '0 B'
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}초`
    if (seconds < 3600) return `${Math.round(seconds / 60)}분`
    return `${Math.round(seconds / 3600)}시간`
  }

  if (loading) {
    return (
      <div className={cn("p-6", className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">백업 관리</h1>
          <p className="text-gray-600">시스템 백업 설정 및 작업 현황</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
          새로고침
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 백업</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_backups}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">성공률</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total_backups > 0 
                    ? Math.round((stats.successful_backups / stats.total_backups) * 100)
                    : 0}%
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 용량</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatFileSize(stats.total_size)}
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <HardDrive className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">평균 시간</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDuration(stats.average_duration)}
                </p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backup Configurations */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">백업 설정</h2>
            <Button size="compact" variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              설정 관리
            </Button>
          </div>
          
          <div className="space-y-3">
            {configs.map((config: unknown) => {
              const isRunning = runningJobs.includes(config.id)
              
              return (
                <div key={config.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{config.name}</h3>
                      {config.enabled ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">활성</Badge>
                      ) : (
                        <Badge variant="secondary">비활성</Badge>
                      )}
                      {isRunning && (
                        <Badge variant="default" className="bg-blue-100 text-blue-800">실행중</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{config.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>유형: {config.type}</span>
                      <span>보관: {config.retention_days}일</span>
                      {config.schedule && (
                        <span>스케줄: {config.schedule}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="compact"
                      variant="outline"
                      onClick={() => handleManualBackup(config.id)}
                      disabled={isRunning || !config.enabled}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
            
            {configs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Database className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>백업 설정이 없습니다.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Jobs */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">최근 백업 작업</h2>
            <Button size="compact" variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              전체 보기
            </Button>
          </div>
          
          <div className="space-y-3">
            {recentJobs.map((job: unknown) => (
              <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{job.type} 백업</h3>
                    {getStatusBadge(job.status)}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{format(new Date(job.started_at), 'yyyy-MM-dd HH:mm', { locale: ko })}</span>
                    {job.file_size && (
                      <span>{formatFileSize(job.file_size)}</span>
                    )}
                    {job.status === 'running' && (
                      <span>{job.progress}%</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {job.status === 'completed' && job.file_path && (
                    <Button size="compact" variant="outline">
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                  {job.status === 'completed' && (
                    <Button size="compact" variant="outline">
                      <Upload className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {recentJobs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>최근 백업 작업이 없습니다.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">빠른 작업</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="h-20 flex-col">
            <Database className="w-8 h-8 mb-2" />
            데이터베이스 백업
          </Button>
          <Button variant="outline" className="h-20 flex-col">
            <HardDrive className="w-8 h-8 mb-2" />
            파일 백업
          </Button>
          <Button variant="outline" className="h-20 flex-col">
            <Calendar className="w-8 h-8 mb-2" />
            스케줄 관리
          </Button>
        </div>
      </Card>
    </div>
  )
}