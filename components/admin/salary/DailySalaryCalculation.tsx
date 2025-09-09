'use client'

import { useState, useEffect } from 'react'
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
  FileText
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
  const [data, setData] = useState<DailySalaryData[]>([])
  
  // Filter states
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  })
  const [selectedSites, setSelectedSites] = useState<string[]>([])
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  
  // Available options
  const [availableSites, setAvailableSites] = useState<Array<{ id: string; name: string }>>([])
  const [availableWorkers, setAvailableWorkers] = useState<Array<{ 
    id: string; 
    name: string; 
    role: string 
  }>>([])
  
  // Summary stats
  const [summaryStats, setSummaryStats] = useState({
    totalWorkers: 0,
    totalManhours: 0,
    totalSalary: 0,
    averageHourlyRate: 0
  })
  
  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  
  // Load available sites and workers
  useEffect(() => {
    loadOptions()
  }, [])
  
  // Load data when filters change
  useEffect(() => {
    loadDailySalaryData()
  }, [dateRange, selectedSites, selectedWorkers, searchTerm])
  
  const loadOptions = async () => {
    try {
      // Load sites
      const sitesResponse = await fetch('/api/admin/sites')
      if (sitesResponse.ok) {
        const sitesData = await sitesResponse.json()
        setAvailableSites(sitesData.success ? sitesData.data || [] : [])
      }
      
      // Load workers
      const workersResponse = await fetch('/api/admin/users?role=worker,site_manager')
      if (workersResponse.ok) {
        const workersData = await workersResponse.json()
        const workers = workersData.success ? workersData.data || [] : []
        setAvailableWorkers(workers.map((w: any) => ({
          id: w.id,
          name: w.full_name || w.name,
          role: w.role
        })))
      }
    } catch (error) {
      console.error('Failed to load options:', error)
    }
  }
  
  const loadDailySalaryData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      if (dateRange.from) {
        params.append('date_from', format(dateRange.from, 'yyyy-MM-dd'))
      }
      if (dateRange.to) {
        params.append('date_to', format(dateRange.to, 'yyyy-MM-dd'))
      }
      if (selectedSites.length > 0) {
        params.append('sites', selectedSites.join(','))
      }
      if (selectedWorkers.length > 0) {
        params.append('workers', selectedWorkers.join(','))
      }
      if (searchTerm) {
        params.append('search', searchTerm)
      }
      
      const response = await fetch(`/api/admin/salary/daily-calculation?${params.toString()}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setData(result.data || [])
          calculateSummary(result.data || [])
        }
      }
    } catch (error) {
      console.error('Failed to load daily salary data:', error)
    } finally {
      setLoading(false)
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DateRangeSelector
            dateRange={dateRange}
            onChange={setDateRange}
          />
          
          <MultiSelectFilter
            label="현장 선택"
            options={availableSites.map(s => ({ value: s.id, label: s.name }))}
            selected={selectedSites}
            onChange={setSelectedSites}
            placeholder="전체 현장"
          />
          
          <MultiSelectFilter
            label="작업자 선택"
            options={availableWorkers.map(w => ({ 
              value: w.id, 
              label: w.name,
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