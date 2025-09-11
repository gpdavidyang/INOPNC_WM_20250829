'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Building2, Calendar, MapPin, User, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns'
import { ko } from 'date-fns/locale'

interface UserSitesPrintsTabProps {
  userId: string
  userName: string
}

interface WorkRecord {
  id: string
  work_date: string
  site_id: string
  site_name: string
  site_address: string
  labor_hours: number
  work_hours: number
  overtime_hours: number
  task_description: string
  status: string
  created_at: string
}

interface SiteSummary {
  site_id: string
  site_name: string
  site_address: string
  total_days: number
  total_labor_hours: number
  total_work_hours: number
  total_overtime_hours: number
  last_work_date: string
  status: string
}

export default function UserSitesPrintsTab({ userId, userName }: UserSitesPrintsTabProps) {
  const [workRecords, setWorkRecords] = useState<WorkRecord[]>([])
  const [siteSummaries, setSiteSummaries] = useState<SiteSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 7, 1)) // 8월로 설정 (0-based index)
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const supabase = createClient()

  useEffect(() => {
    initializeWithLatestData()
  }, [userId])

  useEffect(() => {
    if (userId) { // userId가 있을 때만 fetchWorkData 호출
      fetchWorkData()
    }
  }, [userId, currentMonth])

  const initializeWithLatestData = async () => {
    if (!userId) return
    
    try {
      // 사용자의 가장 최근 데이터를 찾아서 해당 월로 설정
      const { data: latestRecord, error } = await supabase
        .from('work_records')
        .select('work_date')
        .or(`user_id.eq.${userId},profile_id.eq.${userId}`)
        .order('work_date', { ascending: false })
        .limit(1)
        .maybeSingle() // single() 대신 maybeSingle() 사용

      if (!error && latestRecord && latestRecord.work_date) {
        const latestDate = new Date(latestRecord.work_date)
        setCurrentMonth(new Date(latestDate.getFullYear(), latestDate.getMonth(), 1))
        console.log('📅 [UserSitesPrintsTab] Set month to latest data:', format(latestDate, 'yyyy-MM'))
      } else {
        // 기본값으로 8월 사용 (데이터가 있는 월)
        console.log('📅 [UserSitesPrintsTab] No data found, using August 2025')
        setCurrentMonth(new Date(2025, 7, 1)) // 8월로 설정
      }
    } catch (error) {
      console.error('Error finding latest data:', error)
      // 오류 시에도 8월로 설정
      setCurrentMonth(new Date(2025, 7, 1))
    }
  }

  useEffect(() => {
    filterDataBySite()
  }, [workRecords, selectedSite])

  const fetchWorkData = async () => {
    try {
      setLoading(true)
      
      // Calculate date range for selected month
      const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
      const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
      
      console.log('🔍 [UserSitesPrintsTab] Fetching data:', {
        userId,
        currentMonth: format(currentMonth, 'yyyy-MM'),
        dateRange: `${startDate} ~ ${endDate}`
      })
      
      // Fetch work records with site information
      const { data: attendanceData, error } = await supabase
        .from('work_records')
        .select(`
          id,
          work_date,
          site_id,
          labor_hours,
          work_hours,
          overtime_hours,
          notes,
          status,
          created_at,
          sites (
            id,
            name,
            address,
            status
          )
        `)
        .or(`user_id.eq.${userId},profile_id.eq.${userId}`)
        .gte('work_date', startDate)
        .lte('work_date', endDate)
        .order('work_date', { ascending: false })

      console.log('📊 [UserSitesPrintsTab] Query result:', {
        error: error?.message,
        dataCount: attendanceData?.length || 0,
        firstRecord: attendanceData?.[0],
        query: {
          table: 'work_records',
          user_id: userId,
          date_filter: `${startDate} ~ ${endDate}`
        }
      })

      if (error) {
        console.error('Error fetching work data:', error)
        return
      }

      // Transform data
      const transformedRecords = (attendanceData || []).map(record => {
        console.log('🔧 [UserSitesPrintsTab] Transforming record:', {
          id: record.id,
          work_date: record.work_date,
          site_name: record.sites?.name,
          labor_hours: record.labor_hours
        })
        
        return {
          id: record.id,
          work_date: record.work_date,
          site_id: record.site_id,
          site_name: record.sites?.name || '알 수 없음',
          site_address: record.sites?.address || '',
          labor_hours: record.labor_hours || 0,
          work_hours: record.work_hours || 0,
          overtime_hours: record.overtime_hours || 0,
          task_description: record.notes || '', // work_records uses 'notes' instead of 'task_description'
          status: record.status || 'present',
          created_at: record.created_at
        }
      })

      console.log('✅ [UserSitesPrintsTab] Transformed records:', transformedRecords.length)

      setWorkRecords(transformedRecords)
      calculateSiteSummaries(transformedRecords)
    } catch (error) {
      console.error('Error fetching work data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateSiteSummaries = (records: WorkRecord[]) => {
    const siteMap = new Map<string, SiteSummary>()

    records.forEach(record => {
      const siteId = record.site_id
      if (!siteMap.has(siteId)) {
        siteMap.set(siteId, {
          site_id: siteId,
          site_name: record.site_name,
          site_address: record.site_address,
          total_days: 0,
          total_labor_hours: 0,
          total_work_hours: 0,
          total_overtime_hours: 0,
          last_work_date: record.work_date,
          status: 'active'
        })
      }

      const summary = siteMap.get(siteId)!
      summary.total_days += 1
      summary.total_labor_hours += record.labor_hours
      summary.total_work_hours += record.work_hours
      summary.total_overtime_hours += record.overtime_hours
      
      // Update last work date if this record is more recent
      if (record.work_date > summary.last_work_date) {
        summary.last_work_date = record.work_date
      }
    })

    setSiteSummaries(Array.from(siteMap.values()))
  }

  const filterDataBySite = () => {
    // This is handled by selectedSite state in the rendering
  }

  const getFilteredRecords = () => {
    if (selectedSite === 'all') return workRecords
    return workRecords.filter(record => record.site_id === selectedSite)
  }

  const getFilteredSummaries = () => {
    if (selectedSite === 'all') return siteSummaries
    return siteSummaries.filter(summary => summary.site_id === selectedSite)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      present: { text: '출근', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300', icon: CheckCircle },
      absent: { text: '결근', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300', icon: AlertCircle },
      late: { text: '지각', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300', icon: AlertCircle },
      half_day: { text: '반차', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300', icon: CheckCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.present
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </span>
    )
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1))
  }

  const filteredRecords = getFilteredRecords()
  const filteredSummaries = getFilteredSummaries()
  const totalLaborHours = filteredSummaries.reduce((sum, summary) => sum + summary.total_labor_hours, 0)
  const totalWorkDays = filteredSummaries.reduce((sum, summary) => sum + summary.total_days, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {format(currentMonth, 'yyyy년 MM월', { locale: ko })}
            </h3>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Site Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">현장:</label>
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800"
          >
            <option value="all">전체 현장</option>
            {siteSummaries.map(summary => (
              <option key={summary.site_id} value={summary.site_id}>
                {summary.site_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">작업 현장</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {filteredSummaries.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">작업 일수</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {totalWorkDays}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">총 공수</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {totalLaborHours.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <User className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">평균 공수</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {totalWorkDays > 0 ? (totalLaborHours / totalWorkDays).toFixed(1) : '0.0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Site Summaries */}
      {filteredSummaries.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              현장별 요약
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    현장명
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    주소
                  </th>
                  <th className="text-center py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    작업일수
                  </th>
                  <th className="text-center py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    총 공수
                  </th>
                  <th className="text-center py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    마지막 작업일
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredSummaries.map((summary) => (
                  <tr key={summary.site_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <Building2 className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {summary.site_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <MapPin className="h-4 w-4 mr-1" />
                        {summary.site_address || '-'}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {summary.total_days}일
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {summary.total_labor_hours.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(summary.last_work_date), 'MM.dd', { locale: ko })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily Work Records */}
      {filteredRecords.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              일별 작업 기록
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    작업일
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    현장명
                  </th>
                  <th className="text-center py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    공수
                  </th>
                  <th className="text-center py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    작업시간
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    작업 내용
                  </th>
                  <th className="text-center py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    상태
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {format(new Date(record.work_date), 'MM.dd (E)', { locale: ko })}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {record.site_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {record.labor_hours.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {record.work_hours}h
                        {record.overtime_hours > 0 && (
                          <span className="text-orange-600 dark:text-orange-400 ml-1">
                            (+{record.overtime_hours}h)
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {record.task_description.length > 30 
                          ? record.task_description.substring(0, 30) + '...'
                          : record.task_description || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {getStatusBadge(record.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Data Message */}
      {filteredRecords.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              작업 기록이 없습니다
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {userName}님의 {format(currentMonth, 'yyyy년 MM월', { locale: ko })} 출근 기록이 없습니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center items-center text-xs text-gray-400">
              <span>데이터 확인:</span>
              <div className="flex gap-4">
                <span>사용자 ID: {userId}</span>
                <span>조회 월: {format(currentMonth, 'yyyy-MM')}</span>
                <span>테이블: work_records</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}