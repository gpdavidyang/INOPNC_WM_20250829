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
  const [activeTab, setActiveTab] = useState<'output' | 'calculate' | 'statements'>('output')
  
  // Output tab state
  const [outputData, setOutputData] = useState<OutputSummary[]>([])
  const [outputLoading, setOutputLoading] = useState(false)
  const [outputError, setOutputError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [siteFilter, setSiteFilter] = useState('')
  const [workerFilter, setWorkerFilter] = useState('') // Added worker filter for salary calculation
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  
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
      '총 실제공수': item.total_actual_hours,
      '총 연장공수': item.total_overtime_hours,
      '기본급': item.base_pay,
      '연장수당': item.overtime_pay,
      '보너스': item.bonus_pay,
      '공제액': item.deductions,
      '총 지급액': item.total_pay,
      '근무일수': item.work_days_count,
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

  // Load data based on active tab
  useEffect(() => {
    setSelectedIds([])
    setCurrentPage(1)
    
    if (activeTab === 'output') {
      loadOutputData()
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

  // Set default site filter when sites are loaded
  useEffect(() => {
    if (availableSites.length > 0 && !siteFilter) {
      setSiteFilter(availableSites[0].id)
    }
  }, [availableSites])

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

    try {
      const result = await calculateSalaries(
        siteFilter || undefined,
        workerFilter || undefined,
        dateFrom,
        dateTo
      )

      if (result.success) {
        alert(`급여 계산이 완료되었습니다. ${result.data?.calculated_records || 0}개의 기록이 생성되었습니다.`)
      } else {
        alert(`급여 계산 실패: ${result.error}`)
      }
    } catch (err) {
      console.error('Salary calculation error:', err)
      alert('급여 계산 중 오류가 발생했습니다.')
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
                    <CustomSelectValue placeholder="현장 선택" />
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    <CustomSelectItem value="all">모든 현장</CustomSelectItem>
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
                  placeholder="작업자명으로 검색..."
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
                      기본급
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      연장수당
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
                        ₩{(item.base_pay || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                        {(item.overtime_pay || 0) > 0 ? (
                          <span className="text-orange-600 dark:text-orange-400">
                            ₩{(item.overtime_pay || 0).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
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
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              급여 계산 실행
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
                  <CustomSelectValue placeholder="모든 현장" />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  <CustomSelectItem value="all">모든 현장</CustomSelectItem>
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


    </div>
  )
}