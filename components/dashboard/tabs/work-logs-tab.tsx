'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { CustomSelect } from '@/components/ui/custom-select'
import { 
  Eye, Edit, Trash2, Search, Filter, Calendar,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  FileText, Clock, CheckCircle, XCircle, AlertTriangle,
  Building2, MoreHorizontal, Download, Copy
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface WorkLogsTabProps {
  profile: Profile
}

interface WorkLog {
  id: string
  work_date: string
  site_name: string
  work_content: string
  status: 'draft' | 'submitted'
  created_at: string
  updated_at: string
  created_by_name: string
  site_id: string
}

interface Site {
  id: string
  name: string
}

interface SortConfig {
  key: keyof WorkLog | null
  direction: 'asc' | 'desc'
}

export default function WorkLogsTab({ profile }: WorkLogsTabProps) {
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  
  // Sorting
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' })
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  
  const supabase = createClient()
  const router = useRouter()
  
  const canCreate = profile?.role && ['worker', 'site_manager'].includes(profile.role)

  const loadWorkLogs = useCallback(async () => {
    try {
      // console.log('[WorkLogsTab] Loading work logs for user:', profile?.role)
      
      // Check if the browser client has a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      // console.log('[WorkLogsTab] Session check:', {
      //   hasSession: !!session,
      //   sessionError: sessionError?.message,
      //   userId: session?.user?.id,
      //   profileId: profile.id
      // })

      // If no session, the component might be used before proper authentication
      if (!session) {
        console.warn('[WorkLogsTab] No session found, trying to refresh session...')
        
        // Try to refresh session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
        
        // console.log('[WorkLogsTab] Session refresh result:', {
        //   success: !refreshError,
        //   hasSession: !!refreshData.session,
        //   error: refreshError?.message
        // })
        
        if (refreshError || !refreshData.session) {
          console.error('[WorkLogsTab] Could not establish session, queries may fail')
          // Continue anyway but queries might fail due to RLS
        }
      }

      // Try simple query first to check basic connectivity
      // console.log('[WorkLogsTab] Testing basic connectivity...')
      const { data: testData, error: testError } = await supabase
        .from('daily_reports')
        .select('id, work_date, status')
        .limit(1)
      
      // console.log('[WorkLogsTab] Basic connectivity test:', {
      //   success: !testError,
      //   count: testData?.length || 0,
      //   error: testError?.message
      // })

      if (testError) {
        console.error('[WorkLogsTab] Basic connectivity failed:', testError)
        // Don't abort immediately, try the main query anyway
      }
      
      // Load real data from Supabase - try without inner join first
      // console.log('[WorkLogsTab] Attempting query without inner join...')
      const simpleQuery = supabase
        .from('daily_reports')
        .select(`
          id,
          work_date,
          member_name,
          process_type,
          issues,
          status,
          created_at,
          updated_at,
          site_id,
          created_by,
          sites(
            id,
            name
          )
        `)
        .order('work_date', { ascending: false })
        .limit(50)

      // Apply role-based filtering
      if (profile?.role === 'worker') {
        // console.log('[WorkLogsTab] Applying worker filter for user:', profile.id)
        simpleQuery.eq('created_by', profile.id)
      } else {
        // console.log('[WorkLogsTab] No role filter applied - user role:', profile?.role)
      }

      const { data, error } = await simpleQuery
      
      // console.log('[WorkLogsTab] Main query completed:', { 
      //   success: !error, 
      //   count: data?.length || 0,
      //   error: error?.message,
      //   errorCode: error?.code,
      //   errorDetails: error?.details,
      //   errorHint: error?.hint
      // })

      if (error) {
        console.error('[WorkLogsTab] Main query failed:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        
        // Fall back to even simpler query without foreign key join
        // console.log('[WorkLogsTab] Falling back to simplest query without site join...')
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('daily_reports')
          .select('id, work_date, member_name, process_type, issues, status, site_id, created_at, updated_at, created_by')
          .order('work_date', { ascending: false })
          .limit(50)
        
        // Apply same role filtering to fallback
        if (profile?.role === 'worker') {
          // console.log('[WorkLogsTab] Fallback: Applying worker filter for user:', profile.id)
          // Note: This might not work if RLS is blocking access, but we try anyway
        }
        
        if (!fallbackError && fallbackData && fallbackData.length > 0) {
          // console.log('[WorkLogsTab] Fallback query successful:', fallbackData.length, 'results')
          // Convert fallback data to expected format
          const fallbackLogs: WorkLog[] = fallbackData.map(report => ({
            id: report.id,
            work_date: report.work_date,
            site_name: 'Unknown Site', // No site join in fallback
            work_content: `${report.member_name || ''} - ${report.process_type || ''}: ${report.issues || ''}`,
            status: (report.status === 'approved' || report.status === 'submitted') ? 'submitted' : 'draft',
            created_at: report.created_at || new Date().toISOString(),
            updated_at: report.updated_at || new Date().toISOString(),
            created_by_name: 'Site Manager',
            site_id: report.site_id || ''
          }))
          setWorkLogs(fallbackLogs)
          // console.log('[WorkLogsTab] Successfully loaded from fallback:', fallbackLogs.length, 'work logs')
          return
        } else {
          console.error('[WorkLogsTab] Even fallback query failed:', fallbackError)
          // console.log('[WorkLogsTab] Setting empty work logs array')
          setWorkLogs([])
          return
        }
      }

      if (!data || data.length === 0) {
        // console.log('[WorkLogsTab] No work logs found')
        setWorkLogs([])
        return
      }

      // Transform data to match WorkLog interface
      const transformedLogs: WorkLog[] = data.map(report => ({
        id: report.id,
        work_date: report.work_date,
        site_name: report.sites?.name || 'Unknown Site',
        work_content: `${report.member_name || ''} - ${report.process_type || ''}: ${report.issues || ''}`,
        status: (report.status === 'approved' || report.status === 'submitted') ? 'submitted' : 'draft',
        created_at: report.created_at,
        updated_at: report.updated_at,
        created_by_name: 'Site Manager', // Hardcoded for now since we can't join profiles
        site_id: report.site_id
      }))
      
      setWorkLogs(transformedLogs)
      // console.log('[WorkLogsTab] Successfully loaded', transformedLogs.length, 'work logs')
      
    } catch (error) {
      console.error('[WorkLogsTab] Unexpected error loading work logs:', error)
      setWorkLogs([])
    }
  }, [profile.id, profile?.role, supabase])

  const loadSites = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('id, name')
        .eq('status', 'active')
        .order('name')

      if (error) {
        console.error('Error loading sites:', error)
        setSites([])
        return
      }

      setSites(data || [])
    } catch (error) {
      console.error('Error loading sites:', error)
      setSites([])
    }
  }, [supabase])

  useEffect(() => {
    let isMounted = true
    
    const initializeData = async () => {
      // console.log('[WorkLogsTab] Initializing data...')
      
      if (!isMounted) return
      
      setLoading(true)
      
      try {
        // Load both data sets
        await Promise.all([
          loadWorkLogs(),
          loadSites()
        ])
      } catch (error) {
        console.error('[WorkLogsTab] Error loading data:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    // Call the async function immediately
    initializeData()
    
    return () => {
      isMounted = false
    }
  }, [loadWorkLogs, loadSites]) // Use the memoized functions as dependencies

  // Filter and sort work logs
  const filteredAndSortedLogs = useMemo(() => {
    let filtered = workLogs.filter(log => {
      const matchesSearch = log.work_content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.site_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.created_by_name.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesSite = selectedSite === 'all' || log.site_id === selectedSite
      const matchesStatus = selectedStatus === 'all' || log.status === selectedStatus
      
      let matchesDateRange = true
      if (dateRange.start && dateRange.end) {
        const logDate = new Date(log.work_date)
        const startDate = new Date(dateRange.start)
        const endDate = new Date(dateRange.end)
        matchesDateRange = logDate >= startDate && logDate <= endDate
      }
      
      return matchesSearch && matchesSite && matchesStatus && matchesDateRange
    })

    // Primary sort by status (drafts first), secondary by date (newest first)
    filtered.sort((a, b) => {
      // Status priority: draft > submitted
      const statusPriority = {
        'draft': 1,
        'submitted': 2
      }
      
      const statusComparison = statusPriority[a.status] - statusPriority[b.status]
      if (statusComparison !== 0) return statusComparison
      
      // Secondary sort by date (newest first)
      return new Date(b.work_date).getTime() - new Date(a.work_date).getTime()
    })

    // Apply custom sorting if specified
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key!]
        const bValue = b[sortConfig.key!]
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [workLogs, searchTerm, selectedSite, selectedStatus, dateRange, sortConfig])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedLogs.length / itemsPerPage)
  const paginatedLogs = filteredAndSortedLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = (key: keyof WorkLog) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const getSortIcon = (key: keyof WorkLog) => {
    if (sortConfig.key !== key) return null
    return sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Clock className="h-4 w-4 text-gray-500" />
      case 'submitted':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return '임시저장'
      case 'submitted': return '제출됨'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-50 text-gray-700 border-gray-200'
      case 'submitted': return 'bg-blue-50 text-blue-700 border-blue-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }


  const truncateText = (text: string, maxLength: number = 60) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-sm text-gray-500 dark:text-gray-400">작업일지를 불러오는 중...</p>
      </div>
    )
  }


  return (
    <div className="space-y-6">

      {/* Header Section - Updated */}
      <section 
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3"
        aria-labelledby="work-logs-heading"
      >
        <header className="flex items-center justify-between mb-3">
          <div>
            <h1 id="work-logs-heading" className="text-base font-semibold text-gray-900 dark:text-gray-100">
              작업일지 관리
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5" aria-live="polite">
              전체 {filteredAndSortedLogs.length}건 | 임시저장 {filteredAndSortedLogs.filter(l => l.status === 'draft').length}건
            </p>
          </div>
          {canCreate && (
            <button
              onClick={() => router.push('/dashboard/daily-reports/new')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors touch-manipulation focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
              aria-label="새 작업일지 작성하기"
            >
              새 작업일지
            </button>
          )}
        </header>

        {/* Search and Quick Filters - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row gap-2 mb-3" role="search" aria-label="검색 및 필터">
          <div className="flex-1 relative">
            <label htmlFor="search-input" className="sr-only">작업일지 검색</label>
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
            <input
              id="search-input"
              type="text"
              placeholder="검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-h-[36px]"
              aria-describedby="search-help"
            />
            <div id="search-help" className="sr-only">
              작업일지 내용, 현장명, 작성자명으로 검색할 수 있습니다
            </div>
          </div>
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 min-h-[36px] text-xs"
            aria-expanded={filtersExpanded}
            aria-controls="filter-panel"
            aria-label={filtersExpanded ? "상세 필터 숨기기" : "상세 필터 표시"}
          >
            <Filter className="h-4 w-4" aria-hidden="true" />
            <span>필터</span>
            {filtersExpanded ? 
              <ChevronUp className="h-4 w-4" aria-hidden="true" /> : 
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            }
          </button>
        </div>

        {/* Expanded Filters */}
        {filtersExpanded && (
          <div 
            id="filter-panel"
            className="space-y-2 p-3 sm:p-2 bg-gray-50 dark:bg-gray-700 rounded-lg animate-in slide-in-from-top-1 duration-200"
            role="region"
            aria-label="필터 옵션"
          >
            {/* 첫 번째 행: 현장과 상태 */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">현장</label>
                <CustomSelect
                  options={[
                    { value: 'all', label: '전체 현장' },
                    ...sites.map((site: any) => ({
                      value: site.id,
                      label: site.name
                    }))
                  ]}
                  value={selectedSite}
                  onChange={setSelectedSite}
                  placeholder="현장 선택"
                  icon={<Building2 className="h-4 w-4" />}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">상태</label>
                <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-600 rounded-md">
                  <button
                    onClick={() => setSelectedStatus('all')}
                    className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                      selectedStatus === 'all' 
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    전체
                  </button>
                  <button
                    onClick={() => setSelectedStatus('draft')}
                    className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                      selectedStatus === 'draft' 
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    임시저장
                  </button>
                  <button
                    onClick={() => setSelectedStatus('submitted')}
                    className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                      selectedStatus === 'submitted' 
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    제출됨
                  </button>
                </div>
              </div>
            </div>

            {/* 두 번째 행: 기간 선택 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">기간</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-w-lg">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500 min-w-[26px]">시작</span>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="flex-1 px-2 py-2 sm:py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 min-h-[36px] sm:min-h-[32px]"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500 min-w-[26px]">종료</span>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="flex-1 px-2 py-2 sm:py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 min-h-[36px] sm:min-h-[32px]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

      </section>

      {/* Work Log Table - Mobile Optimized */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Mobile Card View */}
        <div className="block sm:hidden">
          {paginatedLogs.map((log: any) => (
            <div key={log.id} className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatDate(log.work_date)}
                    </span>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(log.status)}
                      <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(log.status)}`}>
                        {getStatusText(log.status)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {log.site_name}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {log.work_content}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    작성자: {log.created_by_name}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 ml-2">
                  <button
                    onClick={() => {
                      // 목업 데이터인 경우 alert 표시
                      if (log.id.startsWith('f47ac10b') || log.id.startsWith('6ba7b8')) {
                        alert('이것은 데모 데이터입니다. 실제 데이터가 있을 때 상세 페이지로 이동합니다.')
                      } else {
                        router.push(`/dashboard/daily-reports/${log.id}`)
                      }
                    }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                    title="보기"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {log.status === 'draft' && (
                    <button
                      onClick={() => {
                        // 목업 데이터인 경우 alert 표시
                        if (log.id.startsWith('f47ac10b') || log.id.startsWith('6ba7b8')) {
                          alert('이것은 데모 데이터입니다. 실제 데이터가 있을 때 편집 페이지로 이동합니다.')
                        } else {
                          router.push(`/dashboard/daily-reports/${log.id}/edit`)
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
                      title="편집"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  <button
                    onClick={() => handleSort('work_date')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleSort('work_date')
                      }
                    }}
                    className="flex items-center gap-1 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-600 focus-visible:ring-2 focus-visible:ring-toss-blue-500 focus-visible:ring-offset-2 rounded px-2 py-1 -mx-2 -my-1 transition-colors"
                    aria-label="작업 날짜별 정렬"
                  >
                    날짜
                    {getSortIcon('work_date')}
                  </button>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  <button
                    onClick={() => handleSort('site_name')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleSort('site_name')
                      }
                    }}
                    className="flex items-center gap-1 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-600 focus-visible:ring-2 focus-visible:ring-toss-blue-500 focus-visible:ring-offset-2 rounded px-2 py-1 -mx-2 -my-1 transition-colors"
                    aria-label="현장명별 정렬"
                  >
                    현장명
                    {getSortIcon('site_name')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  작업내용
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell"
                >
                  <button
                    onClick={() => handleSort('status')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleSort('status')
                      }
                    }}
                    className="flex items-center gap-1 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-600 focus-visible:ring-2 focus-visible:ring-toss-blue-500 focus-visible:ring-offset-2 rounded px-2 py-1 -mx-2 -my-1 transition-colors"
                    aria-label="상태별 정렬"
                  >
                    상태
                    {getSortIcon('status')}
                  </button>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden xl:table-cell"
                >
                  <button
                    onClick={() => handleSort('created_by_name')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleSort('created_by_name')
                      }
                    }}
                    className="flex items-center gap-1 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-600 focus-visible:ring-2 focus-visible:ring-toss-blue-500 focus-visible:ring-offset-2 rounded px-2 py-1 -mx-2 -my-1 transition-colors"
                    aria-label="작성자별 정렬"
                  >
                    작성자
                    {getSortIcon('created_by_name')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedLogs.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatDate(log.work_date)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="block truncate max-w-[150px]" title={log.site_name}>
                      {log.site_name}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="block truncate max-w-[200px] lg:max-w-[300px]" title={log.work_content}>
                      {log.work_content}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(log.status)}`}>
                        {getStatusText(log.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 hidden xl:table-cell">
                    {log.created_by_name}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          // 목업 데이터인 경우 alert 표시
                          if (log.id.startsWith('f47ac10b') || log.id.startsWith('6ba7b8')) {
                            alert('이것은 데모 데이터입니다. 실제 데이터가 있을 때 상세 페이지로 이동합니다.')
                          } else {
                            router.push(`/dashboard/daily-reports/${log.id}`)
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                        title="보기"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {log.status === 'draft' && (
                        <>
                          <button
                            onClick={() => {
                              // 목업 데이터인 경우 alert 표시
                              if (log.id.startsWith('f47ac10b') || log.id.startsWith('6ba7b8')) {
                                alert('이것은 데모 데이터입니다. 실제 데이터가 있을 때 편집 페이지로 이동합니다.')
                              } else {
                                router.push(`/dashboard/daily-reports/${log.id}/edit`)
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
                            title="편집"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('정말 삭제하시겠습니까?')) {
                                // console.log('Delete log:', log.id)
                                // TODO: Implement delete
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors hidden sm:block"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State - Works for both mobile and desktop */}
        {filteredAndSortedLogs.length === 0 && (
          <div className="text-center py-12 px-4">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">작업일지가 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || selectedSite !== 'all' || selectedStatus !== 'all' 
                ? '검색 조건을 변경해보세요.' 
                : '새로운 작업일지를 작성해보세요.'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                -
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredAndSortedLogs.length)}</span>
                {' '}of{' '}
                <span className="font-medium">{filteredAndSortedLogs.length}</span>
                {' '}결과
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-toss-blue-500 focus-visible:ring-offset-2 rounded"
                  aria-label="이전 페이지"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-toss-blue-500 focus-visible:ring-offset-2 rounded"
                  aria-label="다음 페이지"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}