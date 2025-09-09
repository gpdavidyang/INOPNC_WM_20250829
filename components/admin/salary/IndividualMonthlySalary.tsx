'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileDown, Search, ChevronDown, ChevronUp, Calculator } from 'lucide-react'
import * as XLSX from 'xlsx'
import { 
  CustomSelect, 
  CustomSelectContent, 
  CustomSelectItem, 
  CustomSelectTrigger, 
  CustomSelectValue 
} from '@/components/ui/custom-select'
import MultiSelectFilter from './components/MultiSelectFilter'
import SummaryCards from './components/SummaryCards'

interface WorkerMonthlySalary {
  worker_id: string
  worker_name: string
  worker_phone: string
  total_days: number
  total_manhours: number
  base_salary: number
  allowances: number
  deductions: number
  net_salary: number
  sites: Array<{
    site_name: string
    days: number
    manhours: number
  }>
}

export default function IndividualMonthlySalary() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [selectedSites, setSelectedSites] = useState<string[]>([])
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([])
  const [sites, setSites] = useState<Array<{ value: string; label: string }>>([])
  const [workers, setWorkers] = useState<Array<{ value: string; label: string }>>([])
  const [salaryData, setSalaryData] = useState<WorkerMonthlySalary[]>([])
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const supabase = createClient()

  useEffect(() => {
    fetchFilters()
  }, [])

  // Remove automatic calculation - now manual with button
  // useEffect(() => {
  //   if (selectedSites.length > 0 || selectedWorkers.length > 0) {
  //     fetchSalaryData()
  //   }
  // }, [year, month, selectedSites, selectedWorkers])

  const fetchFilters = async () => {
    const [sitesRes, workersRes] = await Promise.all([
      supabase.from('sites').select('id, name').order('name'),
      supabase.from('profiles').select('id, full_name').not('role', 'is', null).order('full_name')
    ])

    if (sitesRes.data) {
      setSites(sitesRes.data.map(s => ({ value: s.id, label: s.name })))
    }
    if (workersRes.data) {
      setWorkers(workersRes.data.map(w => ({ value: w.id, label: w.full_name })))
    }
  }

  const fetchSalaryData = async () => {
    if (selectedSites.length === 0 && selectedWorkers.length === 0) {
      alert('급여를 계산할 현장 또는 작업자를 선택해주세요.')
      return
    }

    setCalculating(true)
    setLoading(true)
    
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    let query = supabase
      .from('worker_assignments')
      .select(`
        profile_id,
        labor_hours,
        daily_reports!inner(
          work_date,
          site_id,
          sites(name)
        ),
        profiles!inner(
          id,
          full_name,
          phone,
          daily_wage,
          meal_allowance,
          transportation_allowance
        )
      `)
      .gte('daily_reports.work_date', startDate)
      .lte('daily_reports.work_date', endDate)

    if (selectedSites.length > 0) {
      query = query.in('daily_reports.site_id', selectedSites)
    }
    if (selectedWorkers.length > 0) {
      query = query.in('profile_id', selectedWorkers)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching salary data:', error)
      alert(`급여 데이터를 불러오는 중 오류가 발생했습니다: ${error.message}`)
      setLoading(false)
      setCalculating(false)
      return
    }

    if (!data || data.length === 0) {
      alert('선택한 기간에 해당하는 급여 데이터가 없습니다.')
      setLoading(false)
      setCalculating(false)
      return
    }

    // Process data by worker
    const workerMap = new Map<string, WorkerMonthlySalary>()

    data?.forEach(assignment => {
      const workerId = assignment.profile_id
      const worker = assignment.profiles
      const report = assignment.daily_reports
      const site = report.sites

      if (!workerMap.has(workerId)) {
        workerMap.set(workerId, {
          worker_id: workerId,
          worker_name: worker.full_name || '이름 없음',
          worker_phone: worker.phone || '',
          total_days: 0,
          total_manhours: 0,
          base_salary: 0,
          allowances: 0,
          deductions: 0,
          net_salary: 0,
          sites: []
        })
      }

      const workerData = workerMap.get(workerId)!
      workerData.total_manhours += Number(assignment.labor_hours) || 0
      
      // Calculate daily salary
      const dailyWage = Number(worker.daily_wage) || 0
      const mealAllowance = Number(worker.meal_allowance) || 0
      const transportAllowance = Number(worker.transportation_allowance) || 0
      const dailySalary = dailyWage + mealAllowance + transportAllowance
      
      workerData.base_salary += dailyWage
      workerData.allowances += mealAllowance + transportAllowance

      // Track sites
      const siteName = site?.name || '현장 미지정'
      const siteIndex = workerData.sites.findIndex(s => s.site_name === siteName)
      if (siteIndex >= 0) {
        workerData.sites[siteIndex].days += 1
        workerData.sites[siteIndex].manhours += Number(assignment.labor_hours) || 0
      } else {
        workerData.sites.push({
          site_name: siteName,
          days: 1,
          manhours: Number(assignment.labor_hours) || 0
        })
      }
    })

    // Calculate totals and net salary
    workerMap.forEach(worker => {
      worker.total_days = worker.sites.reduce((sum, site) => sum + site.days, 0)
      worker.net_salary = worker.base_salary + worker.allowances - worker.deductions
    })

      setSalaryData(Array.from(workerMap.values()))
      setLoading(false)
      setCalculating(false)
    } catch (error) {
      console.error('Unexpected error in fetchSalaryData:', error)
      alert('급여 계산 중 예기치 않은 오류가 발생했습니다.')
      setLoading(false)
      setCalculating(false)
    }
  }

  const filteredData = salaryData.filter(worker =>
    worker.worker_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.worker_phone.includes(searchTerm)
  )

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
    const exportData = salaryData.flatMap(worker => {
      if (worker.sites.length === 0) {
        return [{
          '작업자명': worker.worker_name,
          '연락처': worker.worker_phone,
          '현장': '',
          '근무일수': worker.total_days,
          '총공수': worker.total_manhours,
          '기본급': worker.base_salary,
          '수당': worker.allowances,
          '공제': worker.deductions,
          '실수령액': worker.net_salary
        }]
      }
      return worker.sites.map((site, index) => ({
        '작업자명': index === 0 ? worker.worker_name : '',
        '연락처': index === 0 ? worker.worker_phone : '',
        '현장': site.site_name,
        '근무일수': site.days,
        '총공수': site.manhours,
        '기본급': index === 0 ? worker.base_salary : '',
        '수당': index === 0 ? worker.allowances : '',
        '공제': index === 0 ? worker.deductions : '',
        '실수령액': index === 0 ? worker.net_salary : ''
      }))
    })

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '월급여내역')
    XLSX.writeFile(wb, `월급여_${year}년${month}월.xlsx`)
  }

  const totals = {
    workers: filteredData.length,
    manhours: filteredData.reduce((sum, w) => sum + (w.total_manhours || 0), 0),
    salary: filteredData.reduce((sum, w) => sum + (w.net_salary || 0), 0),
    average: filteredData.length > 0 
      ? filteredData.reduce((sum, w) => sum + (w.net_salary || 0), 0) / filteredData.length 
      : 0
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 relative">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              연도
            </label>
            <CustomSelect value={year.toString()} onValueChange={(value) => setYear(Number(value))}>
              <CustomSelectTrigger>
                <CustomSelectValue placeholder="연도 선택" />
              </CustomSelectTrigger>
              <CustomSelectContent>
                {[2023, 2024, 2025].map(y => (
                  <CustomSelectItem key={y} value={y.toString()}>
                    {y}년
                  </CustomSelectItem>
                ))}
              </CustomSelectContent>
            </CustomSelect>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              월
            </label>
            <CustomSelect value={month.toString()} onValueChange={(value) => setMonth(Number(value))}>
              <CustomSelectTrigger>
                <CustomSelectValue placeholder="월 선택" />
              </CustomSelectTrigger>
              <CustomSelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <CustomSelectItem key={m} value={m.toString()}>
                    {m}월
                  </CustomSelectItem>
                ))}
              </CustomSelectContent>
            </CustomSelect>
          </div>

          <MultiSelectFilter
            label="현장"
            options={sites}
            selected={selectedSites}
            onChange={setSelectedSites}
            placeholder="현장 선택"
          />

          <MultiSelectFilter
            label="작업자"
            options={workers}
            selected={selectedWorkers}
            onChange={setSelectedWorkers}
            placeholder="작업자 선택"
          />

          <div className="flex items-end">
            <button
              onClick={fetchSalaryData}
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
      <SummaryCards
        totalWorkers={totals.workers}
        totalManhours={totals.manhours}
        totalSalary={totals.salary}
        averageSalary={totals.average}
      />

      {/* Search and Export */}
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <input
            type="text"
            placeholder="작업자명 또는 연락처 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <FileDown className="h-4 w-4" />
          엑셀 다운로드
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  작업자
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  근무일수
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  총공수
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  기본급
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  수당
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  공제
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  실수령액
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  상세
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    데이터를 불러오는 중...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    데이터가 없습니다
                  </td>
                </tr>
              ) : (
                filteredData.map(worker => (
                  <>
                    <tr key={worker.worker_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {worker.worker_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {worker.worker_phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-gray-100">
                        {worker.total_days}일
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-gray-100">
                        {(worker.total_manhours || 0).toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-gray-100">
                        ₩{new Intl.NumberFormat('ko-KR').format(worker.base_salary || 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-gray-100">
                        ₩{new Intl.NumberFormat('ko-KR').format(worker.allowances || 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-gray-100">
                        ₩{new Intl.NumberFormat('ko-KR').format(worker.deductions || 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                        ₩{new Intl.NumberFormat('ko-KR').format(worker.net_salary || 0)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleRowExpansion(worker.worker_id)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {expandedRows.has(worker.worker_id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedRows.has(worker.worker_id) && (
                      <tr>
                        <td colSpan={8} className="px-4 py-3 bg-gray-50 dark:bg-gray-900">
                          <div className="text-sm">
                            <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                              현장별 근무 내역
                            </div>
                            <div className="space-y-1">
                              {worker.sites.map((site, index) => (
                                <div key={index} className="flex justify-between text-gray-600 dark:text-gray-400">
                                  <span>{site.site_name}</span>
                                  <span>{site.days}일 / {(site.manhours || 0).toFixed(1)}공수</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}