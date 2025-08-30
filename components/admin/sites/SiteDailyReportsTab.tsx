'use client'

import { useState, useEffect } from 'react'
import { FileText, Calendar, Users, MapPin, Eye, Edit, Plus, Filter, Search, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

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
  created_at: string
  issues?: string
}

interface SiteDailyReportsTabProps {
  siteId: string
  siteName: string
}

export default function SiteDailyReportsTab({ siteId, siteName }: SiteDailyReportsTabProps) {
  const [reports, setReports] = useState<DailyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'submitted' | 'draft'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  useEffect(() => {
    fetchReports()
  }, [siteId, filter, dateFilter])

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

  const getStatusBadge = (status: string) => {
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
        status === 'submitted' 
          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      }`}>
        {status === 'submitted' ? '제출됨' : '임시저장'}
      </span>
    )
  }

  const filteredReports = reports.filter(report => {
    const matchesSearch = searchTerm === '' || 
      report.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.process_type.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const submittedCount = reports.filter(r => r.status === 'submitted').length
  const draftCount = reports.filter(r => r.status === 'draft').length
  const totalWorkers = reports.reduce((sum, r) => sum + (r.total_workers || 0), 0)

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
        <Link
          href={`/dashboard/admin/daily-reports/new?site_id=${siteId}`}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          새 작업일지
        </Link>
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
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">총 작업인원</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{totalWorkers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value as any)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">모든 상태</option>
              <option value="submitted">제출됨</option>
              <option value="draft">임시저장</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <input
              type="month"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="flex-1 flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="작업자명 또는 공정 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* 작업일지 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        {filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">작업일지가 없습니다</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {filter !== 'all' || searchTerm || dateFilter ? '필터 조건에 맞는 작업일지가 없습니다.' : '아직 작성된 작업일지가 없습니다.'}
            </p>
            <Link
              href={`/dashboard/admin/daily-reports/new?site_id=${siteId}`}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              첫 번째 작업일지 작성
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredReports.map((report) => (
              <div key={report.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(report.work_date), 'yyyy년 MM월 dd일 (E)', { locale: ko })}
                      </div>
                      {getStatusBadge(report.status)}
                    </div>
                    
                    <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                      {report.member_name} - {report.process_type}
                    </h4>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        작업인원 {report.total_workers}명
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        작성일: {format(new Date(report.created_at), 'MM.dd', { locale: ko })}
                      </div>
                    </div>

                    {report.issues && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        특이사항: {report.issues}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      href={`/dashboard/admin/daily-reports/${report.id}`}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      상세보기
                    </Link>
                    <Link
                      href={`/dashboard/admin/daily-reports/${report.id}/edit`}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      편집
                    </Link>
                  </div>
                </div>
              </div>
            ))}
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