'use client'

import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { Profile } from '@/types'
import { 
  getAvailableSitesForSalary,
  getAvailableWorkersForSalary,
  getOutputSummary,
  calculateSalaries,
  OutputSummary
} from '@/app/actions/admin/salary'
import { Search, DollarSign, Calculator, Play, FileText } from 'lucide-react'
import { CustomSelect, CustomSelectContent, CustomSelectItem, CustomSelectTrigger, CustomSelectValue } from '@/components/ui/custom-select'
import SalaryStatement from './salary/SalaryStatement'

interface SalaryManagementProps {
  profile: Profile
}

export default function SalaryManagement({ profile }: SalaryManagementProps) {
  const [activeTab, setActiveTab] = useState<'output' | 'calculate' | 'statements' | 'rates'>('output')
  
  // Output tab state
  const [outputData, setOutputData] = useState<OutputSummary[]>([])
  const [outputLoading, setOutputLoading] = useState(false)
  const [outputError, setOutputError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    const prevMonth = now.getMonth()
    return prevMonth === 0 ? 12 : prevMonth
  })
  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [siteFilter, setSiteFilter] = useState('')
  const [workerFilter, setWorkerFilter] = useState('') // Added worker filter for salary calculation
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Salary calculation results state
  const [calculationResults, setCalculationResults] = useState<{
    calculated_records: number
    date_from: string
    date_to: string
    site_name?: string
    worker_name?: string
    timestamp: string
  } | null>(null)
  const [calculationLoading, setCalculationLoading] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 10

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  // Available sites and workers
  const [availableSites, setAvailableSites] = useState<Array<{ id: string; name: string }>>([])
  const [availableWorkers, setAvailableWorkers] = useState<Array<{ id: string; name: string }>>([])

  // Salary rates state (role-based)
  const [salaryRates, setSalaryRates] = useState<Array<{ role: string; role_name: string; daily_rate: number; hourly_rate: number; description: string }>>([])
  const [ratesLoading, setRatesLoading] = useState(false)
  const [editingRates, setEditingRates] = useState<Record<string, { daily_rate: number; hourly_rate: number }>>({})

  // Load output data
  const loadOutputData = async () => {
    setOutputLoading(true)
    setOutputError(null)
    
    try {
      const result = await getOutputSummary(
        selectedYear,
        selectedMonth,
        siteFilter || undefined,
        searchTerm || undefined
      )
      
      if (result.success && result.data) {
        setOutputData(result.data)
      } else {
        setOutputError(result.error || '출력 데이터를 불러오는데 실패했습니다.')
      }
    } catch (err) {
      setOutputError('출력 데이터를 불러오는데 실패했습니다.')
    } finally {
      setOutputLoading(false)
    }
  }

  // Load calendar data for selected worker
  // Export data to Excel
  const exportToExcel = () => {
    if (!outputData || outputData.length === 0) {
      alert('내보낼 데이터가 없습니다.')
      return
    }

    // Prepare data for export
    const excelData = outputData.map(item => ({
      '작업자명': item.worker_name,
      '작업자역할': item.worker_role,
      '현장': item.site_name,
      '총 공수': item.total_work_hours,
      '근무일수': item.work_days_count,
      '일당': item.total_work_hours > 0 ? Math.round(item.base_pay / item.total_work_hours) : 0,
      '총 지급액': item.total_pay,
      '마지막근무일': item.last_work_date ? new Date(item.last_work_date).toLocaleDateString('ko-KR') : ''
    }))

    // Create workbook
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Auto-size columns
    const colWidths = Object.keys(excelData[0] || {}).map(key => ({
      wch: Math.max(key.length, 15)
    }))
    ws['!cols'] = colWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, '급여 출력정보')

    // Generate filename
    const filename = `급여출력정보_${selectedYear}년${selectedMonth}월_${new Date().toISOString().split('T')[0]}.xlsx`
    
    // Save file
    XLSX.writeFile(wb, filename)
  }

  // Load available sites
  const loadAvailableSites = async () => {
    try {
      const result = await getAvailableSitesForSalary()
      if (result.success && result.data) {
        setAvailableSites(result.data)
      }
    } catch (err) {
      console.error('Failed to load available sites:', err)
    }
  }

  // Load available workers
  const loadAvailableWorkers = async () => {
    try {
      const result = await getAvailableWorkersForSalary()
      if (result.success && result.data) {
        setAvailableWorkers(result.data)
      }
    } catch (err) {
      console.error('Failed to load available workers:', err)
    }
  }

  // Load salary rates (role-based)
  const loadSalaryRates = async () => {
    setRatesLoading(true)
    try {
      // Role-based salary rates
      const roleRates = [
        { 
          role: 'worker', 
          role_name: '작업자', 
          daily_rate: 130000, 
          hourly_rate: 16250,
          description: '일반 현장 작업자'
        },
        { 
          role: 'site_manager', 
          role_name: '현장관리자', 
          daily_rate: 220000, 
          hourly_rate: 27500,
          description: '현장 총괄 관리자'
        },
        { 
          role: 'customer_manager', 
          role_name: '기타', 
          daily_rate: 180000, 
          hourly_rate: 22500,
          description: '고객 관리 및 기타 업무'
        }
      ]
      setSalaryRates(roleRates)
    } catch (err) {
      console.error('Failed to load salary rates:', err)
    } finally {
      setRatesLoading(false)
    }
  }

  // Handle edit rate (role-based)
  const handleEditRate = (role: string, field: 'daily_rate' | 'hourly_rate', value: number) => {
    setEditingRates(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [field]: value
      }
    }))
  }

  // Save salary rates (role-based)
  const saveSalaryRates = async () => {
    try {
      // In real implementation, this would save to database
      const updatedRates = salaryRates.map(rate => ({
        ...rate,
        ...(editingRates[rate.role] || {})
      }))
      setSalaryRates(updatedRates)
      setEditingRates({})
      alert('역할별 급여 기준이 저장되었습니다.')
    } catch (err) {
      console.error('Failed to save salary rates:', err)
      alert('급여 기준 저장에 실패했습니다.')
    }
  }

  // Load data based on active tab
  useEffect(() => {
    setSelectedIds([])
    setCurrentPage(1)
    
    if (activeTab === 'output') {
      loadOutputData()
    } else if (activeTab === 'rates') {
      loadSalaryRates()
    }
  }, [activeTab])

  // Load data when filters change
  useEffect(() => {
    if (activeTab === 'output') {
      loadOutputData()
    }
  }, [currentPage, searchTerm, statusFilter, siteFilter, workerFilter, dateFrom, dateTo, selectedYear, selectedMonth])

  useEffect(() => {
    loadAvailableSites()
    loadAvailableWorkers()
  }, [])

  // Set default site filter to "all" - removed auto selection of first site

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  // Handle salary calculation
  const handleCalculateSalaries = async () => {
    if (!dateFrom || !dateTo) {
      alert('날짜 범위를 선택해주세요.')
      return
    }

    setCalculationLoading(true)
    setCalculationResults(null)

    try {
      // Get site and worker names for display
      const selectedSite = availableSites.find(s => s.id === siteFilter)
      const selectedWorker = availableWorkers.find(w => w.id === workerFilter)

      const result = await calculateSalaries(
        siteFilter || undefined,
        workerFilter || undefined,
        dateFrom,
        dateTo
      )

      if (result.success) {
        // Set calculation results for display
        setCalculationResults({
          calculated_records: result.data?.calculated_records || 0,
          date_from: dateFrom,
          date_to: dateTo,
          site_name: selectedSite?.name,
          worker_name: selectedWorker?.name,
          timestamp: new Date().toISOString()
        })
        
        alert(`급여 계산이 완료되었습니다. ${result.data?.calculated_records || 0}개의 기록이 생성되었습니다.`)
        
        // Refresh output data if we're on the output tab and dates match current selection
        if (activeTab === 'output') {
          loadOutputData()
        }
      } else {
        alert(`급여 계산 실패: ${result.error}`)
      }
    } catch (err) {
      console.error('Salary calculation error:', err)
      alert('급여 계산 중 오류가 발생했습니다.')
    } finally {
      setCalculationLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('output')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'output'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            출력정보
          </button>
          <button
            onClick={() => setActiveTab('calculate')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'calculate'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            급여 계산
          </button>
          <button
            onClick={() => setActiveTab('statements')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'statements'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            급여명세서
          </button>
          <button
            onClick={() => setActiveTab('rates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rates'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            급여기준 및 할당
          </button>
        </nav>
      </div>

      {/* Output Information Tab */}
      {activeTab === 'output' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">출력정보</h3>
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              onClick={exportToExcel}
            >
              <FileText className="h-4 w-4" />
              엑셀 다운로드
            </button>
          </div>

          {/* Filters */}
          <div className="mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  연도
                </label>
                <CustomSelect value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <CustomSelectTrigger>
                    <CustomSelectValue />
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    {[2023, 2024, 2025].map(year => (
                      <CustomSelectItem key={year} value={year.toString()}>{year}년</CustomSelectItem>
                    ))}
                  </CustomSelectContent>
                </CustomSelect>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  월
                </label>
                <CustomSelect value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                  <CustomSelectTrigger>
                    <CustomSelectValue />
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                      <CustomSelectItem key={month} value={month.toString()}>{month}월</CustomSelectItem>
                    ))}
                  </CustomSelectContent>
                </CustomSelect>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  현장
                </label>
                <CustomSelect value={siteFilter || "all"} onValueChange={(value) => setSiteFilter(value === "all" ? "" : value)}>
                  <CustomSelectTrigger>
                    <CustomSelectValue placeholder="전체" />
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    <CustomSelectItem value="all">전체</CustomSelectItem>
                    {availableSites.map((site) => (
                      <CustomSelectItem key={site.id} value={site.id}>{site.name}</CustomSelectItem>
                    ))}
                  </CustomSelectContent>
                </CustomSelect>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  작업자명 검색
                </label>
                <input
                  type="text"
                  placeholder=""
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Data Display */}
          {outputLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">출력 데이터를 불러오는 중...</p>
            </div>
          ) : outputError ? (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400">{outputError}</p>
            </div>
          ) : outputData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      작업자
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      역할
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      현장
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      총 공수
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      실제
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      연장
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      근무일
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      일당
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      총 급여
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {outputData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs mr-2">
                            {item.worker_name.charAt(0)}
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {item.worker_name}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.worker_role === 'site_manager' 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {item.worker_role === 'site_manager' ? '현장관리자' : '작업자'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {item.site_name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900 dark:text-gray-100">
                        {item.total_work_hours || 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900 dark:text-gray-100">
                        {item.total_actual_hours || 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                        {(item.total_overtime_hours || 0) > 0 ? (
                          <span className="text-orange-600 dark:text-orange-400 font-medium">
                            {item.total_overtime_hours}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                          {item.work_days_count || 0}일
                        </div>
                        {item.last_work_date && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ~{new Date(item.last_work_date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900 dark:text-gray-100">
                        ₩{(item.total_work_hours > 0 ? Math.round(item.base_pay / item.total_work_hours) : 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="text-sm font-bold text-green-600 dark:text-green-400">
                          ₩{(item.total_pay || 0).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <button
                          onClick={() => {
                            const worker = availableWorkers.find(w => w.name === item.worker_name)
                            if (worker) {
                              window.location.href = `/dashboard/admin/salary/calendar/${worker.id}?name=${encodeURIComponent(item.worker_name)}&year=${selectedYear}&month=${selectedMonth}`
                            }
                          }}
                          className="inline-flex items-center px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-xs font-medium rounded transition-colors duration-200"
                        >
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          캘린더
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                {selectedYear}년 {selectedMonth}월 출력 데이터가 없습니다.
              </p>
            </div>
          )}

        </div>
      )}

      {/* Salary Calculation Tab */}
      {activeTab === 'calculate' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">급여 계산</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                일일 보고서 데이터를 기반으로 급여를 계산합니다.
              </p>
            </div>
            <button
              onClick={handleCalculateSalaries}
              disabled={calculationLoading}
              className={`px-6 py-2 rounded-lg flex items-center gap-2 ${
                calculationLoading
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {calculationLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  계산 중...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  급여 계산 실행
                </>
              )}
            </button>
          </div>

          {/* Calculation filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                시작일
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                종료일
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                현장 필터
              </label>
              <CustomSelect value={siteFilter || "all"} onValueChange={(value) => setSiteFilter(value === "all" ? "" : value)}>
                <CustomSelectTrigger>
                  <CustomSelectValue placeholder="전체" />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  <CustomSelectItem value="all">전체</CustomSelectItem>
                  {availableSites.map((site) => (
                    <CustomSelectItem key={site.id} value={site.id}>{site.name}</CustomSelectItem>
                  ))}
                </CustomSelectContent>
              </CustomSelect>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                작업자 필터
              </label>
              <CustomSelect value={workerFilter || "all"} onValueChange={(value) => setWorkerFilter(value === "all" ? "" : value)}>
                <CustomSelectTrigger>
                  <CustomSelectValue placeholder="모든 작업자" />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  <CustomSelectItem value="all">모든 작업자</CustomSelectItem>
                  {availableWorkers.map((worker) => (
                    <CustomSelectItem key={worker.id} value={worker.id}>{worker.name}</CustomSelectItem>
                  ))}
                </CustomSelectContent>
              </CustomSelect>
            </div>
          </div>

          {/* Calculation Results */}
          {calculationResults && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-green-900 dark:text-green-200">
                      급여 계산이 완료되었습니다!
                    </h4>
                    <button
                      onClick={() => setCalculationResults(null)}
                      className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">생성된 기록</div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {calculationResults.calculated_records}개
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">계산 기간</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {new Date(calculationResults.date_from).toLocaleDateString('ko-KR')} ~ {new Date(calculationResults.date_to).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">대상 현장</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {calculationResults.site_name || '전체 현장'}
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">대상 작업자</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {calculationResults.worker_name || '모든 작업자'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        setActiveTab('output')
                        loadOutputData()
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      출력정보에서 결과 확인
                    </button>
                    <button
                      onClick={() => {
                        const params = new URLSearchParams()
                        if (calculationResults.site_name) {
                          const site = availableSites.find(s => s.name === calculationResults.site_name)
                          if (site) params.set('site', site.id)
                        }
                        const queryString = params.toString()
                        const url = `/dashboard/admin/salary${queryString ? '?' + queryString : ''}`
                        window.location.href = url + '#output'
                      }}
                      className="flex-1 bg-white dark:bg-gray-800 border border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <Search className="h-4 w-4" />
                      필터 적용하여 보기
                    </button>
                  </div>
                  
                  <div className="mt-3 text-xs text-green-600 dark:text-green-400">
                    계산 완료 시각: {new Date(calculationResults.timestamp).toLocaleString('ko-KR')}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Calculator className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  급여 계산 안내
                </h4>
                <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  <ul className="list-disc list-inside space-y-1">
                    <li>일일 보고서의 작업 시간(공수) 데이터를 기반으로 급여를 계산합니다</li>
                    <li>기본 8시간을 초과한 시간은 연장근무로 처리됩니다</li>
                    <li>현장관리자: 27,500원/시간, 일반작업자: 16,250원/시간</li>
                    <li>계산된 급여는 출력정보 탭에서 확인할 수 있습니다</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Salary Statements Tab */}
      {activeTab === 'statements' && (
        <SalaryStatement profile={profile} />
      )}

      {/* Salary Rates Tab */}
      {activeTab === 'rates' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">급여기준 및 할당</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                역할별 일당 및 시급 기준을 설정합니다.
              </p>
            </div>
            <button
              onClick={saveSalaryRates}
              disabled={Object.keys(editingRates).length === 0}
              className={`px-6 py-2 rounded-lg flex items-center gap-2 ${
                Object.keys(editingRates).length > 0
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <DollarSign className="h-4 w-4" />
              변경사항 저장
            </button>
          </div>

          {ratesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">급여 기준을 불러오는 중...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      역할
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      설명
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      일당 (원)
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      시급 (원)
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      변경 상태
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {salaryRates.map((rate) => {
                    const isEditing = editingRates[rate.role]
                    const currentDailyRate = isEditing?.daily_rate ?? rate.daily_rate
                    const currentHourlyRate = isEditing?.hourly_rate ?? rate.hourly_rate
                    
                    // Role badge colors
                    const getRoleBadgeColor = (role: string) => {
                      switch (role) {
                        case 'worker':
                          return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        case 'site_manager':
                          return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        case 'customer_manager':
                          return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                        default:
                          return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }
                    }
                    
                    return (
                      <tr key={rate.role} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getRoleBadgeColor(rate.role)}`}>
                            {rate.role_name}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {rate.description}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <input
                            type="number"
                            value={currentDailyRate}
                            onChange={(e) => handleEditRate(rate.role, 'daily_rate', parseInt(e.target.value) || 0)}
                            className="w-24 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <input
                            type="number"
                            value={currentHourlyRate}
                            onChange={(e) => handleEditRate(rate.role, 'hourly_rate', parseInt(e.target.value) || 0)}
                            className="w-24 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          {isEditing ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                              수정됨
                            </span>
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                              저장됨
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {salaryRates.length === 0 && !ratesLoading && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">설정된 급여 기준이 없습니다.</p>
            </div>
          )}

          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  급여 기준 설정 안내
                </h4>
                <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  <ul className="list-disc list-inside space-y-1">
                    <li>일당: 하루 8시간 기준 금액입니다 (1공수 = 일당)</li>
                    <li>시급: 시간당 기준 금액입니다 (연장근무 계산에 사용)</li>
                    <li>변경 후 반드시 '변경사항 저장' 버튼을 클릭해주세요</li>
                    <li>설정된 금액은 급여 계산 시 자동으로 적용됩니다</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}