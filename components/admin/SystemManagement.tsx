'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import AdminDataTable from './AdminDataTable'
import { 
  getSystemConfigurations,
  getSystemStats,
  getAuditLogs,
  getConfigurationCategories,
  updateSystemConfiguration,
  performSystemMaintenance,
  createSystemBackup,
  SystemConfiguration,
  SystemStats,
  AuditLog
} from '@/app/actions/admin/system'
import { 
  Search, 
  Settings, 
  Activity, 
  BarChart3, 
  Database, 
  Shield, 
  Monitor, 
  HardDrive, 
  Users, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Play,
  Download,
  RefreshCw,
  Server
} from 'lucide-react'

interface SystemManagementProps {
  profile: Profile
}

export default function SystemManagement({ profile }: SystemManagementProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'configurations' | 'audit' | 'maintenance'>('overview')
  
  // Configurations tab state
  const [configurations, setConfigurations] = useState<SystemConfiguration[]>([])
  const [configurationsLoading, setConfigurationsLoading] = useState(false)
  const [configurationsError, setConfigurationsError] = useState<string | null>(null)
  
  // Audit logs tab state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditError, setAuditError] = useState<string | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 10

  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [tableFilter, setTableFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  
  // Statistics
  const [stats, setStats] = useState<SystemStats>({
    total_users: 0,
    active_users: 0,
    total_sites: 0,
    active_sites: 0,
    total_documents: 0,
    total_reports: 0,
    storage_used: 0,
    backup_status: 'healthy',
    last_backup: '',
    system_version: '1.0.0'
  })
  
  // Available categories
  const [categories, setCategories] = useState<string[]>([])
  
  // Maintenance state
  const [maintenanceLoading, setMaintenanceLoading] = useState(false)
  const [backupLoading, setBackupLoading] = useState(false)

  // Load configurations data
  const loadConfigurations = async () => {
    setConfigurationsLoading(true)
    setConfigurationsError(null)
    
    try {
      const result = await getSystemConfigurations(
        categoryFilter || undefined,
        searchTerm
      )
      
      if (result.success && result.data) {
        setConfigurations(result.data)
      } else {
        setConfigurationsError(result.error || '시스템 설정 데이터를 불러오는데 실패했습니다.')
      }
    } catch (err) {
      setConfigurationsError('시스템 설정 데이터를 불러오는데 실패했습니다.')
    } finally {
      setConfigurationsLoading(false)
    }
  }

  // Load audit logs data
  const loadAuditLogs = async () => {
    setAuditLoading(true)
    setAuditError(null)
    
    try {
      const result = await getAuditLogs(
        currentPage,
        pageSize,
        searchTerm,
        actionFilter || undefined,
        tableFilter || undefined,
        dateFrom || undefined,
        dateTo || undefined
      )
      
      if (result.success && result.data) {
        setAuditLogs(result.data.logs)
        setTotalCount(result.data.total)
        setTotalPages(result.data.pages)
      } else {
        setAuditError(result.error || '감사 로그 데이터를 불러오는데 실패했습니다.')
      }
    } catch (err) {
      setAuditError('감사 로그 데이터를 불러오는데 실패했습니다.')
    } finally {
      setAuditLoading(false)
    }
  }

  // Load statistics
  const loadStats = async () => {
    try {
      const result = await getSystemStats()
      if (result.success && result.data) {
        setStats(result.data)
      }
    } catch (err) {
      console.error('Failed to load system stats:', err)
    }
  }

  // Load categories
  const loadCategories = async () => {
    try {
      const result = await getConfigurationCategories()
      if (result.success && result.data) {
        setCategories(result.data)
      }
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }

  // Load data based on active tab
  useEffect(() => {
    setCurrentPage(1)
    
    if (activeTab === 'configurations') {
      loadConfigurations()
    } else if (activeTab === 'audit') {
      loadAuditLogs()
    }
  }, [activeTab])

  // Load data when filters change
  useEffect(() => {
    if (activeTab === 'configurations') {
      loadConfigurations()
    } else if (activeTab === 'audit') {
      loadAuditLogs()
    }
  }, [currentPage, searchTerm, categoryFilter, actionFilter, tableFilter, dateFrom, dateTo])

  useEffect(() => {
    loadStats()
    loadCategories()
  }, [])

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  // Handle configuration update
  const handleConfigurationUpdate = async (config: SystemConfiguration, newValue: any) => {
    try {
      const result = await updateSystemConfiguration(
        config.setting_key,
        newValue,
        config.data_type
      )
      
      if (result.success) {
        await loadConfigurations()
        alert(result.message)
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('설정 업데이트 중 오류가 발생했습니다.')
    }
  }

  // Handle system maintenance
  const handleMaintenance = async (tasks: string[]) => {
    setMaintenanceLoading(true)
    
    try {
      const result = await performSystemMaintenance(tasks)
      if (result.success) {
        await loadStats()
        alert(result.message)
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('유지보수 작업 중 오류가 발생했습니다.')
    } finally {
      setMaintenanceLoading(false)
    }
  }

  // Handle backup creation
  const handleBackup = async () => {
    setBackupLoading(true)
    
    try {
      const result = await createSystemBackup()
      if (result.success) {
        await loadStats()
        alert(result.message)
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('백업 생성 중 오류가 발생했습니다.')
    } finally {
      setBackupLoading(false)
    }
  }

  // Define table columns
  const configurationsColumns = [
    {
      key: 'setting_key',
      label: '설정 정보',
      sortable: true,
      filterable: true,
      render: (value: string, config: SystemConfiguration) => (
        <div className="flex items-center">
          <Settings className="h-8 w-8 text-blue-500 mr-3" />
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{value}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{config.category}</div>
            {config.description && (
              <div className="text-xs text-gray-400 mt-1">{config.description}</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'setting_value',
      label: '현재 값',
      render: (value: any, config: SystemConfiguration) => {
        const displayValue = config.data_type === 'json' ? JSON.stringify(value) : String(value)
        return (
          <div className="max-w-xs">
            <div className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded truncate">
              {displayValue}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              타입: {config.data_type}
            </div>
          </div>
        )
      }
    },
    {
      key: 'is_public',
      label: '공개 설정',
      render: (value: boolean) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          value 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
        }`}>
          {value ? '공개' : '비공개'}
        </span>
      )
    },
    {
      key: 'updated_at',
      label: '마지막 수정',
      render: (value: string) => new Date(value).toLocaleString('ko-KR')
    }
  ]

  const auditLogsColumns = [
    {
      key: 'user',
      label: '사용자',
      render: (user: { full_name: string; email: string }) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">{user.full_name}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
        </div>
      )
    },
    {
      key: 'action',
      label: '액션',
      render: (value: string, log: AuditLog) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">{value}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{log.table_name}</div>
          {log.record_id && (
            <div className="text-xs text-gray-400">ID: {log.record_id}</div>
          )}
        </div>
      )
    },
    {
      key: 'timestamp',
      label: '시간',
      render: (value: string) => new Date(value).toLocaleString('ko-KR')
    },
    {
      key: 'ip_address',
      label: 'IP 주소',
      render: (value: string) => (
        <span className="font-mono text-sm">{value || 'N/A'}</span>
      )
    }
  ]

  return (
    <div className="space-y-4">
      {/* System Overview */}
      {activeTab === 'overview' && (
        <>
          {/* System Status Cards */}
          <div className="grid grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                </div>
                <div className="mt-2 sm:mt-0 sm:ml-4 min-w-0">
                  <div className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">사용자</div>
                  <div className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {stats.active_users} / {stats.total_users}
                  </div>
                  <div className="text-xs text-gray-500 truncate">활성 / 전체</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="flex-shrink-0">
                  <Monitor className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                </div>
                <div className="mt-2 sm:mt-0 sm:ml-4 min-w-0">
                  <div className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">현장</div>
                  <div className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {stats.active_sites} / {stats.total_sites}
                  </div>
                  <div className="text-xs text-gray-500 truncate">활성 / 전체</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                </div>
                <div className="mt-2 sm:mt-0 sm:ml-4 min-w-0">
                  <div className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">데이터</div>
                  <div className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {stats.total_documents + stats.total_reports}
                  </div>
                  <div className="text-xs text-gray-500 truncate">문서 + 보고서</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="flex-shrink-0">
                  <HardDrive className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                </div>
                <div className="mt-2 sm:mt-0 sm:ml-4 min-w-0">
                  <div className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">저장소</div>
                  <div className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {stats.storage_used}MB
                  </div>
                  <div className="text-xs text-gray-500 truncate">사용량</div>
                </div>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">시스템 상태</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">시스템 버전</span>
                  <span className="font-medium">{stats.system_version}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">백업 상태</span>
                  <div className="flex items-center">
                    {stats.backup_status === 'healthy' && <CheckCircle className="h-4 w-4 text-green-600 mr-1" />}
                    {stats.backup_status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600 mr-1" />}
                    {stats.backup_status === 'error' && <XCircle className="h-4 w-4 text-red-600 mr-1" />}
                    <span className={`text-sm font-medium ${
                      stats.backup_status === 'healthy' ? 'text-green-600' :
                      stats.backup_status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {stats.backup_status === 'healthy' ? '정상' :
                       stats.backup_status === 'warning' ? '주의' : '오류'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">마지막 백업</span>
                  <span className="text-sm">
                    {stats.last_backup ? new Date(stats.last_backup).toLocaleString('ko-KR') : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">시스템 관리</h3>
              
              <div className="space-y-3">
                <button
                  onClick={handleBackup}
                  disabled={backupLoading}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {backupLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  수동 백업 생성
                </button>
                
                <button
                  onClick={() => handleMaintenance(['cleanup_old_logs', 'update_statistics'])}
                  disabled={maintenanceLoading}
                  className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {maintenanceLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  기본 유지보수 실행
                </button>
                
                <button
                  onClick={() => handleMaintenance(['cleanup_old_logs', 'cleanup_temp_files', 'optimize_database', 'update_statistics'])}
                  disabled={maintenanceLoading}
                  className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {maintenanceLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Server className="h-4 w-4 mr-2" />
                  )}
                  전체 유지보수 실행
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            시스템 개요
          </button>
          <button
            onClick={() => setActiveTab('configurations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'configurations'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            시스템 설정
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'audit'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            감사 로그
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'maintenance'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            유지보수
          </button>
        </nav>
      </div>

      {/* Maintenance Tab */}
      {activeTab === 'maintenance' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">시스템 유지보수</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">데이터 관리</h4>
              <div className="space-y-3">
                <button
                  onClick={() => handleMaintenance(['cleanup_old_logs'])}
                  disabled={maintenanceLoading}
                  className="w-full flex items-center justify-start px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors text-left"
                >
                  <Database className="h-5 w-5 text-yellow-600 mr-3" />
                  <div>
                    <div className="font-medium text-yellow-800 dark:text-yellow-300">오래된 로그 정리</div>
                    <div className="text-sm text-yellow-600 dark:text-yellow-400">90일 이전 감사 로그 삭제</div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleMaintenance(['cleanup_temp_files'])}
                  disabled={maintenanceLoading}
                  className="w-full flex items-center justify-start px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left"
                >
                  <HardDrive className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <div className="font-medium text-blue-800 dark:text-blue-300">임시 파일 정리</div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">불필요한 임시 파일 삭제</div>
                  </div>
                </button>
              </div>
            </div>
            
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">성능 최적화</h4>
              <div className="space-y-3">
                <button
                  onClick={() => handleMaintenance(['optimize_database'])}
                  disabled={maintenanceLoading}
                  className="w-full flex items-center justify-start px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-left"
                >
                  <BarChart3 className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <div className="font-medium text-green-800 dark:text-green-300">데이터베이스 최적화</div>
                    <div className="text-sm text-green-600 dark:text-green-400">인덱스 재구성 및 통계 업데이트</div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleMaintenance(['update_statistics'])}
                  disabled={maintenanceLoading}
                  className="w-full flex items-center justify-start px-4 py-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-left"
                >
                  <Activity className="h-5 w-5 text-purple-600 mr-3" />
                  <div>
                    <div className="font-medium text-purple-800 dark:text-purple-300">시스템 통계 업데이트</div>
                    <div className="text-sm text-purple-600 dark:text-purple-400">시스템 통계 및 메타데이터 갱신</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              유지보수 작업은 시스템 성능에 영향을 줄 수 있습니다. 
              사용량이 적은 시간에 실행하는 것을 권장합니다.
            </p>
          </div>
        </div>
      )}

      {/* Header with search and filters */}
      {(activeTab === 'configurations' || activeTab === 'audit') && (
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder={
                  activeTab === 'configurations' ? '설정 키, 설명으로 검색...' : '액션, 테이블명으로 검색...'
                }
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          
          <div className="flex flex-row gap-2 flex-shrink-0">
            {activeTab === 'configurations' && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="min-w-[120px] px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">모든 카테고리</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            )}
            
            {activeTab === 'audit' && (
              <>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="min-w-[100px] px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">모든 액션</option>
                  <option value="INSERT">생성</option>
                  <option value="UPDATE">수정</option>
                  <option value="DELETE">삭제</option>
                  <option value="SELECT">조회</option>
                </select>
                
                <select
                  value={tableFilter}
                  onChange={(e) => setTableFilter(e.target.value)}
                  className="min-w-[100px] px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">모든 테이블</option>
                  <option value="profiles">사용자</option>
                  <option value="sites">현장</option>
                  <option value="daily_reports">일일보고서</option>
                  <option value="documents">문서</option>
                </select>
                
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="시작일"
                />
                
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="종료일"
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Data tables */}
      {activeTab === 'configurations' && (
        <AdminDataTable
          data={configurations}
          columns={configurationsColumns}
          loading={configurationsLoading}
          error={configurationsError}
          selectable={false}
          selectedIds={[]}
          onSelectionChange={() => {}}
          getRowId={(config: SystemConfiguration) => config.id}
          emptyMessage="시스템 설정이 없습니다"
          emptyDescription="시스템 설정이 로드되면 여기에 표시됩니다."
        />
      )}

      {activeTab === 'audit' && (
        <AdminDataTable
          data={auditLogs}
          columns={auditLogsColumns}
          loading={auditLoading}
          error={auditError}
          selectable={false}
          selectedIds={[]}
          onSelectionChange={() => {}}
          getRowId={(log: AuditLog) => log.id}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          totalCount={totalCount}
          emptyMessage="감사 로그가 없습니다"
          emptyDescription="시스템 활동 로그가 나타날 예정입니다."
        />
      )}
    </div>
  )
}