'use client'

import { useState, useEffect } from 'react'
import { 
  Camera, 
  FileImage, 
  Download, 
  Settings, 
  Archive,
  Trash2,
  RefreshCw,
  HardDrive,
  Activity,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatBytes, formatDateTime } from '@/lib/utils'
import type { Profile } from '@/types'

interface PhotoGridToolManagementProps {
  profile: Profile
}

interface ToolStats {
  totalReports: number
  activeReports: number
  archivedReports: number
  totalSize: number
  totalDownloads: number
  averageSize: number
  lastGenerated?: string
  mostActiveUser?: string
  storageUsagePercent: number
}

interface SystemHealth {
  canvasSupport: boolean
  storageAvailable: boolean
  apiStatus: 'healthy' | 'degraded' | 'error'
  lastCheck: string
}

export default function PhotoGridToolManagement({ profile }: PhotoGridToolManagementProps) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ToolStats>({
    totalReports: 0,
    activeReports: 0,
    archivedReports: 0,
    totalSize: 0,
    totalDownloads: 0,
    averageSize: 0,
    storageUsagePercent: 0
  })
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    canvasSupport: true,
    storageAvailable: true,
    apiStatus: 'healthy',
    lastCheck: new Date().toISOString()
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [settings, setSettings] = useState({
    autoArchiveDays: 30,
    maxFileSize: 50, // MB
    compressionEnabled: true,
    retentionDays: 90,
    allowedFormats: ['jpg', 'png', 'pdf'],
    canvasMode: 'auto' // 'auto', 'canvas', 'html'
  })

  useEffect(() => {
    loadData()
    checkSystemHealth()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load statistics from API
      const response = await fetch('/api/photo-grid-reports/stats')
      if (response.ok) {
        const data = await response.json()
        setStats({
          totalReports: data.total_reports || 0,
          activeReports: data.active_reports || 0,
          archivedReports: data.archived_reports || 0,
          totalSize: data.total_file_size || 0,
          totalDownloads: data.total_downloads || 0,
          averageSize: data.average_file_size || 0,
          lastGenerated: data.last_generated,
          mostActiveUser: data.most_active_user,
          storageUsagePercent: (data.total_file_size / (1024 * 1024 * 1024 * 10)) * 100 // Assuming 10GB limit
        })
      }

      // Load recent activity
      const activityResponse = await fetch('/api/photo-grid-reports?limit=5&sort=created_at:desc')
      if (activityResponse.ok) {
        const activityData = await activityResponse.json()
        setRecentActivity(activityData.reports || [])
      }
    } catch (error) {
      console.error('Failed to load photo grid tool data:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkSystemHealth = () => {
    // Check Canvas API support
    const canvasSupport = !!document.createElement('canvas').getContext

    // Check storage availability
    const storageAvailable = 'storage' in navigator && 'estimate' in navigator.storage

    setSystemHealth({
      canvasSupport,
      storageAvailable,
      apiStatus: 'healthy',
      lastCheck: new Date().toISOString()
    })
  }

  const handleCleanup = async () => {
    if (!confirm('오래된 보고서를 정리하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return
    }

    try {
      const response = await fetch('/api/photo-grid-reports/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          olderThanDays: settings.retentionDays 
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`${result.deleted}개의 오래된 보고서가 정리되었습니다.`)
        await loadData()
      }
    } catch (error) {
      console.error('Cleanup failed:', error)
      alert('정리 작업 중 오류가 발생했습니다.')
    }
  }

  const handleOptimizeStorage = async () => {
    try {
      const response = await fetch('/api/photo-grid-reports/optimize', {
        method: 'POST'
      })

      if (response.ok) {
        const result = await response.json()
        alert(`저장소 최적화 완료: ${formatBytes(result.spaceSaved)} 절약`)
        await loadData()
      }
    } catch (error) {
      console.error('Optimization failed:', error)
      alert('최적화 중 오류가 발생했습니다.')
    }
  }

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
    
    // Save settings to backend
    fetch('/api/photo-grid-reports/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value })
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <Camera className="h-6 w-6 mr-2 text-blue-600" />
          사진대지 도구 관리
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          사진대지 PDF 생성 도구의 상태 모니터링 및 설정 관리
        </p>
      </div>

      {/* System Health Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Activity className="h-5 w-5 mr-2 text-green-600" />
          시스템 상태
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Canvas API</span>
            <div className="flex items-center">
              {systemHealth.canvasSupport ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 dark:text-green-400">정상</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-sm text-red-600 dark:text-red-400">오류</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">저장소</span>
            <div className="flex items-center">
              {systemHealth.storageAvailable ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 dark:text-green-400">사용 가능</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-sm text-yellow-600 dark:text-yellow-400">제한됨</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">API 상태</span>
            <div className="flex items-center">
              {systemHealth.apiStatus === 'healthy' ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 dark:text-green-400">정상</span>
                </>
              ) : systemHealth.apiStatus === 'degraded' ? (
                <>
                  <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-sm text-yellow-600 dark:text-yellow-400">성능 저하</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-sm text-red-600 dark:text-red-400">오류</span>
                </>
              )}
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          마지막 확인: {formatDateTime(systemHealth.lastCheck)}
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">총 보고서</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalReports}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                활성: {stats.activeReports} / 보관: {stats.archivedReports}
              </p>
            </div>
            <FileImage className="h-8 w-8 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">저장소 사용량</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatBytes(stats.totalSize)}
              </p>
              <div className="mt-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(stats.storageUsagePercent, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {stats.storageUsagePercent.toFixed(1)}% 사용 중
                </p>
              </div>
            </div>
            <HardDrive className="h-8 w-8 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">총 다운로드</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalDownloads}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                평균 크기: {formatBytes(stats.averageSize)}
              </p>
            </div>
            <Download className="h-8 w-8 text-purple-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">최근 활동</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {recentActivity.length}건
              </p>
              {stats.lastGenerated && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  마지막: {formatDateTime(stats.lastGenerated)}
                </p>
              )}
            </div>
            <Clock className="h-8 w-8 text-orange-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Tool Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2 text-gray-600" />
          도구 설정
        </h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                자동 보관 기간 (일)
              </label>
              <input
                type="number"
                value={settings.autoArchiveDays}
                onChange={(e) => handleSettingChange('autoArchiveDays', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                min="7"
                max="365"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                생성 후 지정된 일수가 지나면 자동으로 보관됩니다
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                최대 파일 크기 (MB)
              </label>
              <input
                type="number"
                value={settings.maxFileSize}
                onChange={(e) => handleSettingChange('maxFileSize', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                min="10"
                max="200"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                생성되는 PDF 파일의 최대 크기 제한
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                보존 기간 (일)
              </label>
              <input
                type="number"
                value={settings.retentionDays}
                onChange={(e) => handleSettingChange('retentionDays', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                min="30"
                max="730"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                보관된 파일이 자동 삭제되기까지의 기간
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                렌더링 모드
              </label>
              <select
                value={settings.canvasMode}
                onChange={(e) => handleSettingChange('canvasMode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="auto">자동 선택</option>
                <option value="canvas">Canvas (고품질)</option>
                <option value="html">HTML (호환성)</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                PDF 생성 시 사용할 렌더링 엔진
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.compressionEnabled}
                onChange={(e) => handleSettingChange('compressionEnabled', e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                이미지 압축 활성화
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
          최근 활동
        </h2>
        
        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex items-center space-x-3">
                  <FileImage className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {activity.title || activity.file_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.generated_by_profile?.full_name} • {formatDateTime(activity.created_at)}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            최근 활동이 없습니다
          </p>
        )}
      </div>

      {/* Maintenance Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Archive className="h-5 w-5 mr-2 text-orange-600" />
          유지보수 작업
        </h2>
        
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleCleanup}
            variant="outline"
            className="flex items-center"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            오래된 보고서 정리
          </Button>
          
          <Button
            onClick={handleOptimizeStorage}
            variant="outline"
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            저장소 최적화
          </Button>
          
          <Button
            onClick={() => loadData()}
            variant="outline"
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            통계 새로고침
          </Button>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            <AlertCircle className="h-4 w-4 inline mr-1" />
            유지보수 작업은 시스템 성능에 영향을 줄 수 있습니다. 사용량이 적은 시간에 실행하세요.
          </p>
        </div>
      </div>
    </div>
  )
}