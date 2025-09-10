'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { 
  Shield, User, Clock, Activity, Filter, Search, Download,
  FileText, Database, Key, UserCheck, AlertTriangle, Settings,
  Calendar, ChevronDown, ChevronUp, Eye, RefreshCw, CheckCircle,
  XCircle, Edit, Trash2, LogIn, LogOut, UserPlus, Lock,
  File, Folder, Mail, Globe, Server, Cpu, HardDrive, Package,
  Bell, Users
} from 'lucide-react'

interface AuditLogSystemProps {
  profile: Profile
}

interface AuditLog {
  id: string
  action: string
  action_type: 'create' | 'read' | 'update' | 'delete' | 'auth' | 'system'
  entity_type: string
  entity_id?: string
  user_id: string
  user_email: string
  user_name: string
  user_role: string
  ip_address?: string
  user_agent?: string
  details?: any
  changes?: any
  status: 'success' | 'failure' | 'warning'
  error_message?: string
  created_at: string
}

const actionTypeConfig = {
  create: { label: '생성', color: 'text-green-600', bg: 'bg-green-50', icon: UserPlus },
  read: { label: '조회', color: 'text-blue-600', bg: 'bg-blue-50', icon: Eye },
  update: { label: '수정', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Edit },
  delete: { label: '삭제', color: 'text-red-600', bg: 'bg-red-50', icon: Trash2 },
  auth: { label: '인증', color: 'text-purple-600', bg: 'bg-purple-50', icon: Key },
  system: { label: '시스템', color: 'text-gray-600', bg: 'bg-gray-50', icon: Settings }
}

const entityTypeConfig = {
  user: { label: '사용자', icon: User },
  site: { label: '현장', icon: Database },
  document: { label: '문서', icon: FileText },
  report: { label: '보고서', icon: File },
  material: { label: '자재', icon: Package },
  announcement: { label: '공지사항', icon: Bell },
  system: { label: '시스템', icon: Server }
}

export default function AuditLogSystem({ profile }: AuditLogSystemProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedActionType, setSelectedActionType] = useState('all')
  const [selectedEntityType, setSelectedEntityType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedUser, setSelectedUser] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const supabase = createClient()

  // 통계 데이터
  const stats = {
    total: logs.length,
    today: logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length,
    failures: logs.filter(l => l.status === 'failure').length,
    warnings: logs.filter(l => l.status === 'warning').length,
    activeUsers: [...new Set(logs.map(l => l.user_id))].length
  }

  useEffect(() => {
    fetchAuditLogs()
    
    // 실시간 구독 설정
    const channel = supabase
      .channel('audit_log_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'audit_logs' },
        (payload) => {
          setLogs(prev => [payload.new as AuditLog, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    filterLogs()
  }, [logs, selectedActionType, selectedEntityType, selectedStatus, selectedUser, searchTerm, dateRange])

  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      
      // 모의 데이터 생성
      const mockLogs: AuditLog[] = [
        {
          id: '1',
          action: '사용자 로그인',
          action_type: 'auth',
          entity_type: 'user',
          user_id: 'user1',
          user_email: 'admin@inopnc.com',
          user_name: '관리자',
          user_role: 'admin',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0...',
          status: 'success',
          created_at: new Date(Date.now() - 300000).toISOString()
        },
        {
          id: '2',
          action: '작업일지 생성',
          action_type: 'create',
          entity_type: 'report',
          entity_id: 'report123',
          user_id: 'user2',
          user_email: 'manager@inopnc.com',
          user_name: '현장관리자',
          user_role: 'site_manager',
          status: 'success',
          details: { site: '강남 A현장', date: '2024-01-15' },
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '3',
          action: '문서 삭제 시도',
          action_type: 'delete',
          entity_type: 'document',
          entity_id: 'doc456',
          user_id: 'user3',
          user_email: 'worker@inopnc.com',
          user_name: '작업자',
          user_role: 'worker',
          status: 'failure',
          error_message: '권한이 없습니다',
          created_at: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: '4',
          action: '사용자 정보 수정',
          action_type: 'update',
          entity_type: 'user',
          entity_id: 'user789',
          user_id: 'user1',
          user_email: 'admin@inopnc.com',
          user_name: '관리자',
          user_role: 'admin',
          status: 'success',
          changes: {
            before: { role: 'worker', site: '강남 A현장' },
            after: { role: 'site_manager', site: '송파 C현장' }
          },
          created_at: new Date(Date.now() - 10800000).toISOString()
        },
        {
          id: '5',
          action: '시스템 백업',
          action_type: 'system',
          entity_type: 'system',
          user_id: 'system',
          user_email: 'system@inopnc.com',
          user_name: '시스템',
          user_role: 'system',
          status: 'success',
          details: { size: '2.5GB', duration: '5분 23초' },
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '6',
          action: '대량 데이터 조회',
          action_type: 'read',
          entity_type: 'report',
          user_id: 'user4',
          user_email: 'analyst@inopnc.com',
          user_name: '분석가',
          user_role: 'admin',
          status: 'warning',
          details: { records: 10000, duration: '15초' },
          created_at: new Date(Date.now() - 172800000).toISOString()
        }
      ]
      
      setLogs(mockLogs)
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterLogs = () => {
    let filtered = [...logs]
    
    // 액션 타입 필터
    if (selectedActionType !== 'all') {
      filtered = filtered.filter(l => l.action_type === selectedActionType)
    }
    
    // 엔티티 타입 필터
    if (selectedEntityType !== 'all') {
      filtered = filtered.filter(l => l.entity_type === selectedEntityType)
    }
    
    // 상태 필터
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(l => l.status === selectedStatus)
    }
    
    // 사용자 필터
    if (selectedUser !== 'all') {
      filtered = filtered.filter(l => l.user_id === selectedUser)
    }
    
    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(l => 
        l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.entity_type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // 날짜 범위 필터
    if (dateRange.start) {
      filtered = filtered.filter(l => new Date(l.created_at) >= new Date(dateRange.start))
    }
    if (dateRange.end) {
      filtered = filtered.filter(l => new Date(l.created_at) <= new Date(dateRange.end))
    }
    
    // 최신순 정렬
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    
    setFilteredLogs(filtered)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAuditLogs()
    setTimeout(() => setRefreshing(false), 500)
  }

  const exportLogs = () => {
    const csv = [
      ['날짜시간', '사용자', '액션', '타입', '엔티티', '상태', 'IP주소'],
      ...filteredLogs.map(log => [
        new Date(log.created_at).toLocaleString('ko-KR'),
        log.user_email,
        log.action,
        log.action_type,
        log.entity_type,
        log.status,
        log.ip_address || '-'
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const getActionIcon = (actionType: string) => {
    const config = actionTypeConfig[actionType as keyof typeof actionTypeConfig]
    return config?.icon || Activity
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          성공
        </span>
      case 'failure':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          실패
        </span>
      case 'warning':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <AlertTriangle className="h-3 w-3 mr-1" />
          경고
        </span>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 및 통계 */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              감사 로그 시스템
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              시스템 전체 활동 기록 및 보안 감사
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all ${
                refreshing ? 'animate-spin' : ''
              }`}
            >
              <RefreshCw className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={exportLogs}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Download className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-5 gap-2 sm:gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">전체 로그</p>
                <span className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total}
                </span>
              </div>
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 mt-1 sm:mt-0" />
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 truncate">오늘</p>
                <span className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.today}
                </span>
              </div>
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mt-1 sm:mt-0" />
            </div>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 truncate">실패</p>
                <span className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.failures}
                </span>
              </div>
              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mt-1 sm:mt-0" />
            </div>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-yellow-600 dark:text-yellow-400 truncate">경고</p>
                <span className="text-lg sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {stats.warnings}
                </span>
              </div>
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 mt-1 sm:mt-0" />
            </div>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 truncate">활성 사용자</p>
                <span className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.activeUsers}
                </span>
              </div>
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 mt-1 sm:mt-0" />
            </div>
          </div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="space-y-4">
          {/* 검색바 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="로그 검색 (액션, 사용자, 엔티티...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 기본 필터 */}
          <div className="flex flex-wrap gap-4">
            <select
              value={selectedActionType}
              onChange={(e) => setSelectedActionType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">모든 액션</option>
              {Object.entries(actionTypeConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            <select
              value={selectedEntityType}
              onChange={(e) => setSelectedEntityType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">모든 엔티티</option>
              {Object.entries(entityTypeConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">모든 상태</option>
              <option value="success">성공</option>
              <option value="failure">실패</option>
              <option value="warning">경고</option>
            </select>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              고급 필터
              {showAdvancedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {/* 고급 필터 */}
          {showAdvancedFilters && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    시작 날짜
                  </label>
                  <input
                    type="datetime-local"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    종료 날짜
                  </label>
                  <input
                    type="datetime-local"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    사용자
                  </label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">모든 사용자</option>
                    {[...new Set(logs.map(l => l.user_email))].map(email => (
                      <option key={email} value={logs.find(l => l.user_email === email)?.user_id}>
                        {email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 로그 테이블 */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            로그를 불러오는 중...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            표시할 로그가 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    사용자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    액션
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    타입
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    엔티티
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    IP
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredLogs.map((log) => {
                  const ActionIcon = getActionIcon(log.action_type)
                  const actionConfig = actionTypeConfig[log.action_type as keyof typeof actionTypeConfig]
                  
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm">
                              {new Date(log.created_at).toLocaleDateString('ko-KR')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(log.created_at).toLocaleTimeString('ko-KR')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {log.user_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {log.user_email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {log.action}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-2 py-1 rounded-lg ${actionConfig?.bg} ${actionConfig?.color}`}>
                          <ActionIcon className="h-3 w-3 mr-1" />
                          <span className="text-xs">{actionConfig?.label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {entityTypeConfig[log.entity_type as keyof typeof entityTypeConfig]?.label || log.entity_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(log.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ip_address || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 로그 상세 모달 */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  감사 로그 상세
                </h2>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <XCircle className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">시간</h3>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {new Date(selectedLog.created_at).toLocaleString('ko-KR')}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">상태</h3>
                    <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">사용자</h3>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedLog.user_name} ({selectedLog.user_email})
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">역할</h3>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedLog.user_role}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">액션</h3>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedLog.action}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">엔티티</h3>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedLog.entity_type} {selectedLog.entity_id && `(${selectedLog.entity_id})`}
                    </p>
                  </div>
                  {selectedLog.ip_address && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">IP 주소</h3>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedLog.ip_address}
                      </p>
                    </div>
                  )}
                </div>

                {selectedLog.error_message && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">오류 메시지</h3>
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {selectedLog.error_message}
                    </p>
                  </div>
                )}

                {selectedLog.details && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">상세 정보</h3>
                    <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.changes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">변경 사항</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 mb-1">변경 전</h4>
                        <pre className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-xs overflow-x-auto">
                          {JSON.stringify(selectedLog.changes.before, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 mb-1">변경 후</h4>
                        <pre className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-xs overflow-x-auto">
                          {JSON.stringify(selectedLog.changes.after, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {selectedLog.user_agent && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">User Agent</h3>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 font-mono">
                      {selectedLog.user_agent}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}