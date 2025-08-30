'use client'

import { useState, useEffect } from 'react'
import { 
  Calendar, FileText, CheckCircle, Clock, AlertCircle, 
  User, Building2, Search, Filter, Eye, TrendingUp,
  ChevronDown, ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { ko } from 'date-fns/locale'

interface DailyReport {
  id: string
  site_id: string
  site_name?: string
  report_date: string
  status: string
  weather?: string
  temperature?: number
  worker_count?: number
  created_by?: string
  created_at: string
  updated_at?: string
  work_content?: string
  special_notes?: string
}

interface Site {
  id: string
  name: string
}

export default function EnhancedDailyReportsView() {
  const [reports, setReports] = useState<DailyReport[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedReport, setExpandedReport] = useState<string | null>(null)
  const [statistics, setStatistics] = useState<any>(null)

  useEffect(() => {
    const currentMonth = format(new Date(), 'yyyy-MM')
    setSelectedMonth(currentMonth)
    fetchData()
  }, [])

  useEffect(() => {
    fetchReports()
  }, [selectedSite, selectedStatus, selectedMonth])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch sites for filtering
      const sitesRes = await fetch('/api/sites')
      if (sitesRes.ok) {
        const sitesData = await sitesRes.json()
        if (sitesData.success) {
          setSites(sitesData.data.filter((s: Site) => s.id !== 'all'))
        }
      }
      
      await fetchReports()
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReports = async () => {
    try {
      let url = '/api/admin/daily-reports?'
      const params = new URLSearchParams()
      
      if (selectedSite !== 'all') params.append('site_id', selectedSite)
      if (selectedStatus !== 'all') params.append('status', selectedStatus)
      if (selectedMonth) {
        const [year, month] = selectedMonth.split('-')
        const startDate = startOfMonth(new Date(parseInt(year), parseInt(month) - 1))
        const endDate = endOfMonth(startDate)
        params.append('start_date', format(startDate, 'yyyy-MM-dd'))
        params.append('end_date', format(endDate, 'yyyy-MM-dd'))
      }
      
      const response = await fetch(url + params.toString())
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setReports(data.data || [])
          
          // Calculate statistics
          const stats = {
            total: data.data?.length || 0,
            submitted: data.data?.filter((r: DailyReport) => r.status === 'submitted').length || 0,
            approved: data.data?.filter((r: DailyReport) => r.status === 'approved').length || 0,
            rejected: data.data?.filter((r: DailyReport) => r.status === 'rejected').length || 0,
            sites_reporting: new Set(data.data?.map((r: DailyReport) => r.site_id)).size || 0,
            avg_workers: Math.round(
              data.data?.reduce((sum: number, r: DailyReport) => sum + (r.worker_count || 0), 0) / (data.data?.length || 1)
            ) || 0
          }
          setStatistics(stats)
        }
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { text: '작성중', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300', icon: Clock },
      submitted: { text: '제출됨', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300', icon: CheckCircle },
      approved: { text: '승인됨', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300', icon: CheckCircle },
      rejected: { text: '반려됨', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300', icon: AlertCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </span>
    )
  }

  const getWeatherIcon = (weather: string) => {
    const weatherIcons: { [key: string]: string } = {
      sunny: '☀️',
      cloudy: '☁️',
      rainy: '🌧️',
      snowy: '❄️'
    }
    return weatherIcons[weather] || '🌤️'
  }

  const filteredReports = reports.filter(report => {
    const matchesSearch = searchTerm === '' || 
      report.site_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.work_content?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  // Generate month options for the last 6 months
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), i)
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'yyyy년 MM월', { locale: ko })
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">전체 일지</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{statistics.total}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">제출됨</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{statistics.submitted}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">승인됨</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{statistics.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">반려됨</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{statistics.rejected}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">보고 현장</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{statistics.sites_reporting}</p>
              </div>
              <Building2 className="h-8 w-8 text-purple-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">평균 인원</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{statistics.avg_workers}</p>
              </div>
              <Users className="h-8 w-8 text-orange-400" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="작업 내용 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          {/* Site Filter */}
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="all">전체 현장</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>{site.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="all">전체 상태</option>
            <option value="draft">작성중</option>
            <option value="submitted">제출됨</option>
            <option value="approved">승인됨</option>
            <option value="rejected">반려됨</option>
          </select>

          {/* Month Filter */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
          >
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          {/* Action Buttons */}
          <Link
            href="/dashboard/admin/daily-reports/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium whitespace-nowrap"
          >
            일지 작성
          </Link>
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || selectedSite !== 'all' || selectedStatus !== 'all' 
              ? '검색 결과가 없습니다' 
              : '작성된 작업일지가 없습니다'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredReports.map((report) => (
              <li key={report.id}>
                <div 
                  className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {format(new Date(report.report_date), 'yyyy년 MM월 dd일', { locale: ko })}
                          </p>
                          {getStatusBadge(report.status)}
                          {report.weather && (
                            <span className="text-lg">{getWeatherIcon(report.weather)}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <Building2 className="h-4 w-4 mr-1" />
                            {report.site_name || '현장 미지정'}
                          </div>
                          {report.worker_count !== undefined && (
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <User className="h-4 w-4 mr-1" />
                              작업인원: {report.worker_count}명
                            </div>
                          )}
                          {report.temperature !== undefined && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              🌡️ {report.temperature}°C
                            </div>
                          )}
                        </div>
                        {report.work_content && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                            {report.work_content}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/dashboard/admin/daily-reports/${report.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        상세
                      </Link>
                      <button className="p-1">
                        {expandedReport === report.id ? (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedReport === report.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {report.work_content && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">작업 내용</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                              {report.work_content}
                            </p>
                          </div>
                        )}
                        {report.special_notes && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">특이사항</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                              {report.special_notes}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>작성자: {report.created_by || '미확인'}</span>
                        <span>작성일: {format(new Date(report.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}</span>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}