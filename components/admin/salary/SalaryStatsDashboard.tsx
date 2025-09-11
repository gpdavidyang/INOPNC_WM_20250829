'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock, 
  Calendar,
  Building2,
  FileText,
  Download
} from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { ko } from 'date-fns/locale'
import * as XLSX from 'xlsx'
import SalaryChart, { 
  WorkerSalaryChart, 
  SiteSalaryChart, 
  MonthlySalaryTrendChart 
} from './SalaryChart'

interface StatsCard {
  title: string
  value: string
  change?: string
  changeType?: 'increase' | 'decrease' | 'neutral'
  icon: any
  color: string
}

interface SalaryStatsData {
  totalWorkers: number
  totalSalary: number
  avgSalary: number
  totalHours: number
  avgHourlyRate: number
  topSites: Array<{ name: string; value: number; count: number }>
  topWorkers: Array<{ name: string; value: number; hours: number }>
  monthlyTrend: Array<{ name: string; value: number; count: number }>
  roleDistribution: Array<{ name: string; value: number; count: number }>
}

export default function SalaryStatsDashboard() {
  const [loading, setLoading] = useState(true)
  const [statsData, setStatsData] = useState<SalaryStatsData>({
    totalWorkers: 0,
    totalSalary: 0,
    avgSalary: 0,
    totalHours: 0,
    avgHourlyRate: 0,
    topSites: [],
    topWorkers: [],
    monthlyTrend: [],
    roleDistribution: []
  })
  const [selectedPeriod, setSelectedPeriod] = useState('6months')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const supabase = createClient()

  useEffect(() => {
    loadStatsData()
  }, [selectedPeriod, refreshTrigger])

  const loadStatsData = async () => {
    setLoading(true)
    
    try {
      // 기간 설정
      const endDate = new Date()
      let startDate = new Date()
      
      switch (selectedPeriod) {
        case '1month':
          startDate = subMonths(endDate, 1)
          break
        case '3months':
          startDate = subMonths(endDate, 3)
          break
        case '6months':
          startDate = subMonths(endDate, 6)
          break
        case '1year':
          startDate = subMonths(endDate, 12)
          break
        default:
          startDate = subMonths(endDate, 6)
      }

      // 작업자 배정 데이터 조회
      const { data: assignmentsData, error } = await supabase
        .from('work_records')
        .select(`
          id,
          profile_id,
          labor_hours,
          hourly_rate,
          role_type,
          daily_report_id,
          daily_reports!inner(
            id,
            work_date,
            site_id,
            sites(id, name)
          )
        `)
        .gte('daily_reports.work_date', startDate.toISOString().split('T')[0])
        .lte('daily_reports.work_date', endDate.toISOString().split('T')[0])

      if (error) {
        console.error('데이터 조회 오류:', error)
        return
      }

      // 프로필 데이터 조회
      const workerIds = [...new Set(assignmentsData?.map(a => a.profile_id) || [])]
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, role, daily_wage')
        .in('id', workerIds)

      // 데이터 가공
      const profilesMap = new Map()
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, profile)
      })

      // 통계 계산
      const processedData = (assignmentsData || []).map(assignment => {
        const profile = profilesMap.get(assignment.profile_id) || { full_name: 'Unknown', role: 'worker', daily_wage: 0 }
        const laborHours = Number(assignment.labor_hours) || 0
        const dailyWage = Number(profile.daily_wage) || 0
        const hourlyRate = laborHours > 0 ? dailyWage / 8 : 0
        const overtimeHours = Math.max(0, laborHours - 8)
        const regularPay = Math.min(laborHours, 8) * hourlyRate
        const overtimePay = overtimeHours * hourlyRate * 1.5
        const totalPay = regularPay + overtimePay

        return {
          ...assignment,
          profile,
          laborHours,
          hourlyRate,
          totalPay,
          workDate: assignment.daily_reports.work_date,
          siteName: assignment.daily_reports.sites?.name || 'Unknown'
        }
      })

      // 기본 통계
      const totalWorkers = new Set(processedData.map(d => d.profile_id)).size
      const totalSalary = processedData.reduce((sum, d) => sum + d.totalPay, 0)
      const avgSalary = totalWorkers > 0 ? totalSalary / totalWorkers : 0
      const totalHours = processedData.reduce((sum, d) => sum + d.laborHours, 0)
      const avgHourlyRate = totalHours > 0 ? totalSalary / totalHours : 0

      // 현장별 통계 (상위 5개)
      const siteStats = processedData.reduce((acc, d) => {
        const siteName = d.siteName
        if (!acc[siteName]) {
          acc[siteName] = { value: 0, count: 0 }
        }
        acc[siteName].value += d.totalPay
        acc[siteName].count += 1
        return acc
      }, {} as Record<string, { value: number; count: number }>)

      const topSites = Object.entries(siteStats)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)

      // 작업자별 통계 (상위 10명)
      const workerStats = processedData.reduce((acc, d) => {
        const workerId = d.profile_id
        const workerName = d.profile.full_name
        if (!acc[workerId]) {
          acc[workerId] = { name: workerName, value: 0, hours: 0 }
        }
        acc[workerId].value += d.totalPay
        acc[workerId].hours += d.laborHours
        return acc
      }, {} as Record<string, { name: string; value: number; hours: number }>)

      const topWorkers = Object.values(workerStats)
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)

      // 월별 추이
      const monthlyStats = processedData.reduce((acc, d) => {
        const monthKey = format(new Date(d.workDate), 'yyyy-MM')
        if (!acc[monthKey]) {
          acc[monthKey] = { value: 0, count: 0 }
        }
        acc[monthKey].value += d.totalPay
        acc[monthKey].count += 1
        return acc
      }, {} as Record<string, { value: number; count: number }>)

      const monthlyTrend = Object.entries(monthlyStats)
        .map(([month, stats]) => ({
          name: format(new Date(month + '-01'), 'MM월', { locale: ko }),
          ...stats
        }))
        .sort((a, b) => a.name.localeCompare(b.name))

      // 역할별 분포
      const roleStats = processedData.reduce((acc, d) => {
        const role = d.profile.role === 'site_manager' ? '현장관리자' : '작업자'
        if (!acc[role]) {
          acc[role] = { value: 0, count: 0 }
        }
        acc[role].value += d.totalPay
        acc[role].count += 1
        return acc
      }, {} as Record<string, { value: number; count: number }>)

      const roleDistribution = Object.entries(roleStats)
        .map(([name, stats]) => ({ name, ...stats }))

      setStatsData({
        totalWorkers,
        totalSalary,
        avgSalary,
        totalHours,
        avgHourlyRate,
        topSites,
        topWorkers,
        monthlyTrend,
        roleDistribution
      })

    } catch (error) {
      console.error('통계 데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportStats = () => {
    const workbook = XLSX.utils.book_new()
    
    // 기본 통계
    const basicStats = [
      ['항목', '값'],
      ['총 작업자 수', `${statsData.totalWorkers}명`],
      ['총 급여', `₩${statsData.totalSalary.toLocaleString()}`],
      ['평균 급여', `₩${Math.round(statsData.avgSalary).toLocaleString()}`],
      ['총 근무시간', `${statsData.totalHours}시간`],
      ['평균 시급', `₩${Math.round(statsData.avgHourlyRate).toLocaleString()}`]
    ]
    
    const basicStatsSheet = XLSX.utils.aoa_to_sheet(basicStats)
    XLSX.utils.book_append_sheet(workbook, basicStatsSheet, '기본통계')
    
    // 현장별 통계
    if (statsData.topSites.length > 0) {
      const siteStats = [
        ['현장명', '급여총액', '건수'],
        ...statsData.topSites.map(site => [
          site.name,
          site.value,
          site.count
        ])
      ]
      const siteStatsSheet = XLSX.utils.aoa_to_sheet(siteStats)
      XLSX.utils.book_append_sheet(workbook, siteStatsSheet, '현장별통계')
    }
    
    // 작업자별 통계
    if (statsData.topWorkers.length > 0) {
      const workerStats = [
        ['작업자명', '급여총액', '근무시간'],
        ...statsData.topWorkers.map(worker => [
          worker.name,
          worker.value,
          worker.hours
        ])
      ]
      const workerStatsSheet = XLSX.utils.aoa_to_sheet(workerStats)
      XLSX.utils.book_append_sheet(workbook, workerStatsSheet, '작업자별통계')
    }
    
    const fileName = `급여통계_${format(new Date(), 'yyyy-MM-dd')}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  const statsCards: StatsCard[] = [
    {
      title: '총 작업자',
      value: `${statsData.totalWorkers}명`,
      icon: Users,
      color: 'blue'
    },
    {
      title: '총 급여',
      value: `₩${statsData.totalSalary.toLocaleString()}`,
      icon: DollarSign,
      color: 'green'
    },
    {
      title: '평균 급여',
      value: `₩${Math.round(statsData.avgSalary).toLocaleString()}`,
      icon: TrendingUp,
      color: 'purple'
    },
    {
      title: '총 근무시간',
      value: `${statsData.totalHours}시간`,
      icon: Clock,
      color: 'orange'
    }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
          <div className="grid grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-300 dark:bg-gray-600 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            급여 통계 대시보드
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            급여 지급 현황 및 통계 분석
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="1month">최근 1개월</option>
            <option value="3months">최근 3개월</option>
            <option value="6months">최근 6개월</option>
            <option value="1year">최근 1년</option>
          </select>
          <button
            onClick={exportStats}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            통계 내보내기
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-3 sm:gap-6">
        {statsCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                    {card.title}
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {card.value}
                  </p>
                </div>
                <div className={`p-2 sm:p-3 rounded-full bg-${card.color}-100 dark:bg-${card.color}-900 mt-2 sm:mt-0 self-start sm:self-auto`}>
                  <Icon className={`h-4 w-4 sm:h-6 sm:w-6 text-${card.color}-600 dark:text-${card.color}-400`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 차트 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 월별 추이 */}
        {statsData.monthlyTrend.length > 0 && (
          <MonthlySalaryTrendChart data={statsData.monthlyTrend} />
        )}

        {/* 역할별 분포 */}
        {statsData.roleDistribution.length > 0 && (
          <SiteSalaryChart data={statsData.roleDistribution} />
        )}

        {/* 현장별 급여 */}
        {statsData.topSites.length > 0 && (
          <WorkerSalaryChart data={statsData.topSites} />
        )}

        {/* 상위 작업자 */}
        {statsData.topWorkers.length > 0 && (
          <WorkerSalaryChart data={statsData.topWorkers} />
        )}
      </div>

      {/* 상세 테이블들 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 현장별 상세 */}
        {statsData.topSites.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                현장별 급여 현황
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {statsData.topSites.map((site, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {site.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {site.count}건
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        ₩{site.value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 상위 작업자 상세 */}
        {statsData.topWorkers.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                상위 작업자 급여
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {statsData.topWorkers.map((worker, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 text-sm font-bold mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {worker.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {worker.hours}시간
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        ₩{worker.value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}