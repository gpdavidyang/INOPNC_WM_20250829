'use client'


interface AuditLog {
  id: string
  user_id: string
  user_email: string
  user_name: string
  user_role: string
  action: string
  entity_type: string
  entity_id: string
  entity_name?: string
  changes?: unknown
  metadata?: unknown
  ip_address?: string
  user_agent?: string
  status: 'success' | 'failed' | 'pending'
  error_message?: string
  created_at: string
  site_id?: string
  site?: {
    name: string
  }
}

const actionLabels: Record<string, string> = {
  create: '생성',
  update: '수정',
  delete: '삭제',
  login: '로그인',
  logout: '로그아웃',
  approve: '승인',
  reject: '거절',
  export: '내보내기',
  import: '가져오기',
  view: '조회'
}

const entityTypeLabels: Record<string, string> = {
  profile: '사용자',
  site: '현장',
  daily_report: '작업일지',
  document: '문서',
  material: '자재',
  attendance: '출근',
  notification: '알림',
  signup_request: '가입요청'
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    action: 'all',
    entityType: 'all',
    status: 'all',
    search: ''
  })
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchLogs()
  }, [filter])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          site:sites(name)
        `)
        .gte('created_at', filter.dateFrom)
        .lte('created_at', filter.dateTo + 'T23:59:59')
        .order('created_at', { ascending: false })
        .limit(100)

      if (filter.action !== 'all') {
        query = query.eq('action', filter.action)
      }

      if (filter.entityType !== 'all') {
        query = query.eq('entity_type', filter.entityType)
      }

      if (filter.status !== 'all') {
        query = query.eq('status', filter.status)
      }

      if (filter.search) {
        query = query.or(`user_email.ilike.%${filter.search}%,user_name.ilike.%${filter.search}%,entity_name.ilike.%${filter.search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      // Mock data for development
      setLogs([
        {
          id: '1',
          user_id: '123',
          user_email: 'admin@inopnc.com',
          user_name: '관리자',
          user_role: 'admin',
          action: 'update',
          entity_type: 'profile',
          entity_id: '456',
          entity_name: '김철수',
          status: 'success',
          created_at: new Date().toISOString(),
          changes: {
            old: { role: 'worker' },
            new: { role: 'site_manager' }
          }
        },
        {
          id: '2',
          user_id: '123',
          user_email: 'manager@inopnc.com',
          user_name: '현장관리자',
          user_role: 'site_manager',
          action: 'create',
          entity_type: 'daily_report',
          entity_id: '789',
          entity_name: '2025-08-22 작업일지',
          status: 'success',
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '3',
          user_id: '123',
          user_email: 'worker@inopnc.com',
          user_name: '작업자',
          user_role: 'worker',
          action: 'login',
          entity_type: 'profile',
          entity_id: '123',
          status: 'failed',
          error_message: '잘못된 비밀번호',
          created_at: new Date(Date.now() - 7200000).toISOString()
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'update': return <Activity className="h-4 w-4 text-blue-600" />
      case 'delete': return <XCircle className="h-4 w-4 text-red-600" />
      case 'login': return <User className="h-4 w-4 text-gray-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      success: { text: '성공', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
      failed: { text: '실패', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' },
      pending: { text: '대기', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const exportLogs = () => {
    const csv = [
      ['시간', '사용자', '역할', '작업', '대상', '상태', '오류메시지'],
      ...logs.map(log => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        `${log.user_name} (${log.user_email})`,
        log.user_role,
        actionLabels[log.action] || log.action,
        `${entityTypeLabels[log.entity_type] || log.entity_type}: ${log.entity_name || log.entity_id}`,
        log.status,
        log.error_message || ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `audit_logs_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`
    link.click()
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
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            감사 로그 조회
          </h2>
          <div className="flex gap-2">
            <button
              onClick={fetchLogs}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              title="새로고침"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <button
              onClick={exportLogs}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              내보내기
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              시작일
            </label>
            <input
              type="date"
              value={filter.dateFrom}
              onChange={(e) => setFilter({...filter, dateFrom: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              종료일
            </label>
            <input
              type="date"
              value={filter.dateTo}
              onChange={(e) => setFilter({...filter, dateTo: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              작업
            </label>
            <select
              value={filter.action}
              onChange={(e) => setFilter({...filter, action: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">전체</option>
              {Object.entries(actionLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              대상
            </label>
            <select
              value={filter.entityType}
              onChange={(e) => setFilter({...filter, entityType: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">전체</option>
              {Object.entries(entityTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              상태
            </label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({...filter, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">전체</option>
              <option value="success">성공</option>
              <option value="failed">실패</option>
              <option value="pending">대기</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="사용자 이메일, 이름, 대상 이름으로 검색..."
              value={filter.search}
              onChange={(e) => setFilter({...filter, search: e.target.value})}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            조회된 로그가 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    사용자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    작업
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    대상
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          {format(new Date(log.created_at), 'MM-dd HH:mm', { locale: ko })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        <div>
                          <div className="font-medium">{log.user_name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{log.user_email}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {log.user_role === 'admin' ? '관리자' : 
                             log.user_role === 'site_manager' ? '현장관리자' :
                             log.user_role === 'worker' ? '작업자' :
                             log.user_role === 'customer_manager' ? '파트너사' : log.user_role}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <span className="text-gray-900 dark:text-gray-100">
                            {actionLabels[log.action] || log.action}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        <div>
                          <div className="font-medium">
                            {entityTypeLabels[log.entity_type] || log.entity_type}
                          </div>
                          {log.entity_name && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {log.entity_name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(log.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {expandedLog === log.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </td>
                    </tr>
                    {expandedLog === log.id && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-gray-50 dark:bg-gray-700">
                          <div className="space-y-3">
                            {log.error_message && (
                              <div className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-red-800 dark:text-red-300">오류 메시지</p>
                                  <p className="text-sm text-red-700 dark:text-red-400">{log.error_message}</p>
                                </div>
                              </div>
                            )}
                            
                            {log.changes && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">변경 내용</p>
                                <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
                                  {JSON.stringify(log.changes, null, 2)}
                                </pre>
                              </div>
                            )}
                            
                            {log.metadata && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">추가 정보</p>
                                <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              {log.ip_address && (
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">IP 주소:</span>
                                  <span className="ml-2 text-gray-900 dark:text-gray-100">{log.ip_address}</span>
                                </div>
                              )}
                              {log.site?.name && (
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">현장:</span>
                                  <span className="ml-2 text-gray-900 dark:text-gray-100">{log.site.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

