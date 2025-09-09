'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Search, 
  Download, 
  Calendar,
  Users,
  Clock,
  DollarSign,
  Filter,
  ChevronDown,
  ChevronRight,
  FileText,
  Calculator,
  PlayCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import * as XLSX from 'xlsx'
import { 
  CustomSelect, 
  CustomSelectContent, 
  CustomSelectItem, 
  CustomSelectTrigger, 
  CustomSelectValue 
} from '@/components/ui/custom-select'
import MultiSelectFilter from './components/MultiSelectFilter'
import DateRangeSelector from './components/DateRangeSelector'
import SummaryCards from './components/SummaryCards'

interface DailySalaryData {
  id: string
  worker_id: string
  worker_name: string
  worker_role: string
  site_id: string
  site_name: string
  work_date: string
  labor_hours: number
  hourly_rate: number
  daily_rate: number
  overtime_hours: number
  overtime_pay: number
  total_pay: number
}

export default function DailySalaryCalculation() {
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [data, setData] = useState<DailySalaryData[]>([])
  
  // Filter states
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedSites, setSelectedSites] = useState<string[]>([])
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  
  // Available options
  const [availableSites, setAvailableSites] = useState<Array<{ value: string; label: string }>>([])
  const [availableWorkers, setAvailableWorkers] = useState<Array<{ value: string; label: string }>>([])
  
  // Summary stats
  const [summaryStats, setSummaryStats] = useState({
    totalWorkers: 0,
    totalManhours: 0,
    totalSalary: 0,
    averageHourlyRate: 0
  })
  
  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  
  const supabase = createClient()
  
  // Load available sites and workers
  useEffect(() => {
    loadOptions()
  }, [])
  
  const loadOptions = async () => {
    try {
      // Load sites from Supabase
      const { data: sitesData } = await supabase
        .from('sites')
        .select('id, name')
        .order('name')
      
      if (sitesData) {
        setAvailableSites(sitesData.map(site => ({
          value: site.id,
          label: site.name
        })))
      }
      
      // Load workers from profiles table (not workers table)
      const { data: workersData } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .not('role', 'is', null)
        .order('full_name')
      
      if (workersData) {
        setAvailableWorkers(workersData.map(worker => ({
          value: worker.id,
          label: worker.full_name,
          role: worker.role || 'worker'
        })))
      }
    } catch (error) {
      console.error('Failed to load options:', error)
    }
  }
  
  const loadDailySalaryData = async () => {
    setCalculating(true)
    setLoading(true)
    
    try {
      // Build Supabase query for worker assignments with related data
      // Using the actual database schema: worker_assignments with profile_id, daily_reports with work_date
      let query = supabase
        .from('worker_assignments')
        .select(`
          id,
          profile_id,
          labor_hours,
          hourly_rate,
          role_type,
          daily_reports!inner(
            id,
            work_date,
            site_id,
            sites(id, name)
          ),
          profiles!inner(
            id,
            full_name,
            role,
            daily_wage
          )
        `)
        .gte('daily_reports.work_date', startDate)
        .lte('daily_reports.work_date', endDate)
        .order('daily_reports.work_date', { ascending: false })

      // Apply site filter
      if (selectedSites.length > 0) {
        query = query.in('daily_reports.site_id', selectedSites)
      }
      
      // Apply worker filter  
      if (selectedWorkers.length > 0) {
        query = query.in('profile_id', selectedWorkers)
      }
      
      // Apply name search filter
      if (searchTerm) {
        query = query.ilike('profiles.full_name', `%${searchTerm}%`)
      }

      const { data: assignmentsData, error } = await query

      if (error) {
        console.error('Supabase query error:', error)
        throw error
      }

      // Transform data to match DailySalaryData interface
      const transformedData: DailySalaryData[] = (assignmentsData || []).map(assignment => {
        const profile = assignment.profiles
        const report = assignment.daily_reports
        const site = report.sites
        const laborHours = Number(assignment.labor_hours) || 0
        const hourlyRate = Number(assignment.hourly_rate) || Number(profile.daily_wage) || 0
        const overtimeHours = Math.max(0, laborHours - 8) // overtime after 8 hours
        const regularPay = Math.min(laborHours, 8) * hourlyRate
        const overtimePay = overtimeHours * hourlyRate * 1.5 // 1.5x rate for overtime
        const totalPay = regularPay + overtimePay

        return {
          id: assignment.id,
          worker_id: assignment.profile_id,
          worker_name: profile.full_name,
          worker_role: assignment.role_type || profile.role || 'worker',
          site_id: report.site_id,
          site_name: site.name,
          work_date: report.work_date,
          labor_hours: laborHours,
          hourly_rate: hourlyRate,
          daily_rate: regularPay,
          overtime_hours: overtimeHours,
          overtime_pay: overtimePay,
          total_pay: totalPay
        }
      })

      setData(transformedData)
      calculateSummary(transformedData)
    } catch (error) {
      console.error('Failed to load daily salary data:', error)
      alert('급여 데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
      setCalculating(false)
    }
  }
  
  const calculateSummary = (data: DailySalaryData[]) => {
    const uniqueWorkers = new Set(data.map(d => d.worker_id)).size
    const totalManhours = data.reduce((sum, d) => sum + (d.labor_hours || 0), 0)
    const totalSalary = data.reduce((sum, d) => sum + (d.total_pay || 0), 0)
    const averageHourlyRate = totalManhours > 0 ? totalSalary / totalManhours : 0
    
    setSummaryStats({
      totalWorkers: uniqueWorkers,
      totalManhours,
      totalSalary,
      averageHourlyRate
    })
  }
  
  const toggleRowExpansion = (workerId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(workerId)) {
      newExpanded.delete(workerId)
    } else {
      newExpanded.add(workerId)
    }
    setExpandedRows(newExpanded)
  }
  
  const exportToExcel = () => {
    if (data.length === 0) {
      alert('내보낼 데이터가 없습니다.')
      return
    }
    
    const excelData = data.map(item => ({
      '작업일': format(new Date(item.work_date), 'yyyy-MM-dd'),
      '작업자': item.worker_name,
      '역할': item.worker_role === 'site_manager' ? '현장관리자' : '작업자',
      '현장': item.site_name,
      '총공수': item.labor_hours || 0,
      '시급': item.hourly_rate || 0,
      '일당': item.daily_rate || 0,
      '연장근무': item.overtime_hours || 0,
      '연장수당': item.overtime_pay || 0,
      '총급여': item.total_pay || 0
    }))
    
    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '일급여계산')
    
    const fileName = `일급여계산_${format(new Date(), 'yyyy-MM-dd')}.xlsx`
    XLSX.writeFile(wb, fileName)
  }
  
  // Group data by worker for display
  const groupedData = data.reduce((acc, item) => {
    if (!acc[item.worker_id]) {
      acc[item.worker_id] = {
        worker_id: item.worker_id,
        worker_name: item.worker_name,
        worker_role: item.worker_role,
        records: [],
        totalManhours: 0,
        totalSalary: 0
      }
    }
    acc[item.worker_id].records.push(item)
    acc[item.worker_id].totalManhours += (item.labor_hours || 0)
    acc[item.worker_id].totalSalary += (item.total_pay || 0)
    return acc
  }, {} as Record<string, any>)
  
  const workers = Object.values(groupedData)
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            출력일별 일급여계산
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            선택한 기간의 작업자별 일급여를 계산합니다
          </p>
        </div>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          Excel 다운로드
        </button>
      </div>
      
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 relative">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                시작일
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                종료일
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          
          <MultiSelectFilter
            label="현장 선택"
            options={availableSites}
            selected={selectedSites}
            onChange={setSelectedSites}
            placeholder="전체 현장"
          />
          
          <MultiSelectFilter
            label="작업자 선택"
            options={availableWorkers.map(w => ({ 
              value: w.value, 
              label: w.label,
              group: w.role === 'site_manager' ? '현장관리자' : '작업자'
            }))}
            selected={selectedWorkers}
            onChange={setSelectedWorkers}
            placeholder="전체 작업자"
            grouped
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              검색
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="이름으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={loadDailySalaryData}
              disabled={calculating}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {calculating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  계산 중...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4" />
                  급여 계산
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <SummaryCards stats={summaryStats} />
      
      {/* Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">데이터를 불러오는 중...</p>
          </div>
        ) : workers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">조건에 맞는 데이터가 없습니다</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    작업자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    역할
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    총공수
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    평균시급
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    총급여
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    상세
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {workers.map((worker) => (
                  <>
                    <tr key={worker.worker_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs mr-3">
                            {worker.worker_name.charAt(0)}
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {worker.worker_name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          worker.worker_role === 'site_manager'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {worker.worker_role === 'site_manager' ? '현장관리자' : '작업자'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {(worker.totalManhours || 0).toFixed(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-gray-100">
                        ₩{Math.round((worker.totalSalary || 0) / (worker.totalManhours || 1)).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-bold text-green-600 dark:text-green-400">
                          ₩{(worker.totalSalary || 0).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => toggleRowExpansion(worker.worker_id)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {expandedRows.has(worker.worker_id) ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedRows.has(worker.worker_id) && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-gray-50 dark:bg-gray-800">
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              일별 상세 내역
                            </h4>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                              {worker.records.map((record: DailySalaryData) => (
                                <div
                                  key={record.id}
                                  className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {format(new Date(record.work_date), 'MM월 dd일 (EEE)', { locale: ko })}
                                      </p>
                                      <p className="text-xs text-gray-600 dark:text-gray-400">
                                        {record.site_name}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                                        ₩{(record.total_pay || 0).toLocaleString()}
                                      </p>
                                      <p className="text-xs text-gray-600 dark:text-gray-400">
                                        {record.labor_hours || 0}시간
                                        {(record.overtime_hours || 0) > 0 && ` (+${record.overtime_hours || 0})`}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}