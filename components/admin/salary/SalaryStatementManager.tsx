'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, ExternalLink, Trash2, Eye, Plus, Calendar } from 'lucide-react'
import { 
  CustomSelect, 
  CustomSelectContent, 
  CustomSelectItem, 
  CustomSelectTrigger, 
  CustomSelectValue 
} from '@/components/ui/custom-select'
import MultiSelectFilter from './components/MultiSelectFilter'

interface SalaryStatement {
  id: string
  worker_id: string
  worker_name: string
  worker_phone: string
  year: number
  month: number
  statement_data: {
    base_salary: number
    allowances: number
    deductions: number
    net_salary: number
    work_days: number
    total_manhours: number
    site_details: Array<{
      site_name: string
      days: number
      manhours: number
    }>
  }
  created_at: string
  updated_at: string
  file_url?: string
}

export default function SalaryStatementManager() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([])
  const [workers, setWorkers] = useState<Array<{ value: string; label: string }>>([])
  const [statements, setStatements] = useState<SalaryStatement[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchWorkers()
  }, [])

  useEffect(() => {
    fetchStatements()
  }, [year, month, selectedWorkers])

  const fetchWorkers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .not('role', 'is', null)
        .not('full_name', 'is', null)
        .order('full_name')

      if (error) {
        console.error('Error fetching workers:', error)
        return
      }

      if (data) {
        console.log('Fetched workers:', data.length)
        setWorkers(data.map(w => ({ value: w.id, label: w.full_name || '이름 없음' })))
      } else {
        console.log('No workers data received')
      }
    } catch (error) {
      console.error('Unexpected error fetching workers:', error)
    }
  }

  const fetchStatements = async () => {
    setLoading(true)
    
    try {
      // Build query parameters
      const params = new URLSearchParams({
        year: year.toString(),
        month: month.toString()
      })
      
      if (selectedWorkers.length > 0) {
        // For now, fetch all and filter client-side
        // In production, you might want to handle multiple worker IDs in the API
      }

      const response = await fetch(`/api/admin/salary/statements/generate?${params}`)
      const result = await response.json()

      if (!response.ok) {
        console.error('Error fetching statements:', result.error)
        setStatements([])
      } else {
        let statements = result.data || []
        
        // Filter by selected workers if needed
        if (selectedWorkers.length > 0) {
          statements = statements.filter((s: SalaryStatement) => 
            selectedWorkers.includes(s.worker_id)
          )
        }
        
        setStatements(statements)
      }
    } catch (error) {
      console.error('Unexpected error fetching statements:', error)
      setStatements([])
    } finally {
      setLoading(false)
    }
  }

  const generateStatements = async () => {
    if (selectedWorkers.length === 0) {
      alert('급여명세서를 생성할 작업자를 선택해주세요.')
      return
    }

    setGenerating(true)
    
    try {
      // Fetch salary data for selected workers
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]
      
      console.log('Generating statements for:', {
        year,
        month,
        startDate,
        endDate,
        selectedWorkers
      })

      const { data: salaryData, error: fetchError } = await supabase
        .from('work_records')
        .select(`
          user_id,
          profile_id,
          labor_hours,
          work_date,
          site_id,
          sites(name)
        `)
        .or(`user_id.in.(${selectedWorkers.join(',')}),profile_id.in.(${selectedWorkers.join(',')})`)
        .gte('work_date', startDate)
        .lte('work_date', endDate)

      if (fetchError) {
        console.error('Error fetching salary data:', fetchError)
        throw new Error(`급여 데이터를 불러올 수 없습니다: ${fetchError.message}`)
      }

      if (!salaryData || salaryData.length === 0) {
        alert('선택한 기간에 해당하는 급여 데이터가 없습니다.')
        setGenerating(false)
        return
      }

      // Get profile information for selected workers
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          phone,
          daily_wage,
          meal_allowance,
          transportation_allowance
        `)
        .in('id', selectedWorkers)

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        throw new Error(`프로필 정보를 불러올 수 없습니다: ${profilesError.message}`)
      }

      // Get salary info for selected workers
      const { data: salaryInfoData, error: salaryInfoError } = await supabase
        .from('salary_info')
        .select(`
          user_id,
          base_salary,
          hourly_rate,
          overtime_rate
        `)
        .in('user_id', selectedWorkers)
        .is('end_date', null)

      if (salaryInfoError) {
        console.error('Error fetching salary info:', salaryInfoError)
        throw new Error(`급여 정보를 불러올 수 없습니다: ${salaryInfoError.message}`)
      }

      // Create profile and salary info maps for quick lookup
      const profilesMap = new Map()
      const salaryInfoMap = new Map()
      
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, profile)
      })
      
      salaryInfoData?.forEach(salaryInfo => {
        salaryInfoMap.set(salaryInfo.user_id, salaryInfo)
      })

      // Process data by worker
      const workerMap = new Map()
      salaryData.forEach(record => {
        if (!record) {
          console.warn('Skipping invalid record:', record)
          return
        }

        const workerId = record.user_id || record.profile_id
        const worker = profilesMap.get(workerId)
        const salaryInfo = salaryInfoMap.get(workerId)
        const site = record.sites

        if (!worker) {
          console.warn('Worker profile not found:', workerId)
          return
        }

        if (!workerMap.has(workerId)) {
          workerMap.set(workerId, {
            worker_id: workerId,
            worker_name: worker.full_name,
            worker_phone: worker.phone || '',
            total_days: 0,
            total_manhours: 0,
            base_salary: 0,
            allowances: 0,
            deductions: 0,
            net_salary: 0,
            sites: new Map()
          })
        }

        const workerData = workerMap.get(workerId)
        const laborHours = Number(record.labor_hours) || 0
        const mealAllowance = Number(worker.meal_allowance) || 0
        const transportAllowance = Number(worker.transportation_allowance) || 0

        workerData.total_manhours += laborHours

        // 급여 계산 로직: salary_info의 정확한 정보 사용
        // salary-calculation.service.ts와 동일한 로직 적용
        const hourlyRate = salaryInfo?.hourly_rate || 20000 // 기본 시급 2만원
        const overtimeRate = salaryInfo?.overtime_rate || (hourlyRate * 1.5)
        
        // labor_hours * 8이 실제 작업 시간 (salary-calculation.service.ts와 동일)
        const actualWorkHours = laborHours * 8
        const baseHours = Math.min(actualWorkHours, 8) // 최대 8시간
        const overtimeHours = Math.max(actualWorkHours - 8, 0) // 연장근무
        
        const dailyBasePay = baseHours * hourlyRate
        const dailyOvertimePay = overtimeHours * overtimeRate
        
        workerData.base_salary += dailyBasePay + dailyOvertimePay
        workerData.allowances += mealAllowance + transportAllowance

        // Track site work
        const siteName = site?.name || '현장 미지정'
        if (!workerData.sites.has(siteName)) {
          workerData.sites.set(siteName, { days: 0, manhours: 0 })
        }
        const siteData = workerData.sites.get(siteName)
        siteData.days += 1
        siteData.manhours += laborHours
      })

      // Insert statements into database
      const statementsToInsert = Array.from(workerMap.values()).map(worker => {
        worker.total_days = Array.from(worker.sites.values()).reduce((sum, site) => sum + site.days, 0)
        
        // 공제액 계산 (salary-calculation.service.ts와 동일)
        const totalGrossPay = worker.base_salary + worker.allowances
        const tax_deduction = Math.floor(totalGrossPay * 0.08) // 소득세 8%
        const national_pension = Math.floor(totalGrossPay * 0.045) // 국민연금 4.5%
        const health_insurance = Math.floor(totalGrossPay * 0.0343) // 건강보험 3.43%
        const employment_insurance = Math.floor(totalGrossPay * 0.009) // 고용보험 0.9%
        
        worker.deductions = tax_deduction + national_pension + health_insurance + employment_insurance
        worker.net_salary = worker.base_salary + worker.allowances - worker.deductions

        return {
          worker_id: worker.worker_id,
          worker_name: worker.worker_name,
          worker_phone: worker.worker_phone,
          year,
          month,
          statement_data: {
            base_salary: worker.base_salary,
            allowances: worker.allowances,
            deductions: worker.deductions,
            net_salary: worker.net_salary,
            work_days: worker.total_days,
            total_manhours: worker.total_manhours,
            site_details: Array.from(worker.sites.entries()).map(([siteName, siteData]) => ({
              site_name: siteName,
              days: siteData.days,
              manhours: siteData.manhours
            }))
          }
        }
      })

      // Use API route to insert statements
      const response = await fetch('/api/admin/salary/statements/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          statements: statementsToInsert
        })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Insert error details:', result.error)
        throw new Error(result.error)
      }

      alert(`${statementsToInsert.length}개의 급여명세서가 생성되었습니다.`)
      fetchStatements()
    } catch (error: any) {
      console.error('Error generating statements:', error)
      const errorMessage = error.message || '알 수 없는 오류가 발생했습니다.'
      alert(`급여명세서 생성 중 오류가 발생했습니다: ${errorMessage}`)
    } finally {
      setGenerating(false)
    }
  }

  const viewPayslip = (statement: SalaryStatement) => {
    // Open HTML payslip in new window/tab for printing
    const payslipUrl = `/payslip/${statement.worker_id}/${statement.year}/${statement.month}`
    window.open(payslipUrl, '_blank', 'width=800,height=600')
  }

  const deleteStatement = async (statementId: string) => {
    if (!confirm('선택한 급여명세서를 삭제하시겠습니까?')) {
      return
    }

    const { error } = await supabase
      .from('salary_statements')
      .delete()
      .eq('id', statementId)

    if (error) {
      console.error('Error deleting statement:', error)
      alert('급여명세서 삭제 중 오류가 발생했습니다.')
    } else {
      fetchStatements()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Filters and Generate */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
            label="작업자"
            options={workers}
            selected={selectedWorkers}
            onChange={setSelectedWorkers}
            placeholder="작업자 선택"
          />

          <div className="flex items-end">
            <button
              onClick={generateStatements}
              disabled={generating || selectedWorkers.length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              <Plus className="h-4 w-4" />
              {generating ? '생성 중...' : '명세서 생성'}
            </button>
          </div>
        </div>
      </div>

      {/* Print Guidance */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-600 dark:text-blue-400 mt-1">
            🖨️
          </div>
          <div>
            <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-1">
              급여명세서 인쇄 안내
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">
              작업 열의 <ExternalLink className="h-4 w-4 inline mx-1" /> 버튼을 클릭하면 새 창에서 급여명세서를 확인할 수 있습니다.
            </p>
            <div className="flex flex-wrap gap-2 text-sm text-blue-700 dark:text-blue-400">
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-blue-300 dark:border-blue-600 rounded text-xs">Cmd+P</kbd>
                (Mac)
              </span>
              <span>또는</span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-blue-300 dark:border-blue-600 rounded text-xs">Ctrl+P</kbd>
                (Windows)
              </span>
              <span>를 눌러 PDF로 저장할 수 있습니다.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Statements List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            급여명세서 목록 ({statements.length}개)
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  작업자
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  지급년월
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  근무일수
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  총공수
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  실수령액
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  생성일시
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    데이터를 불러오는 중...
                  </td>
                </tr>
              ) : statements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    급여명세서가 없습니다
                  </td>
                </tr>
              ) : (
                statements.map(statement => (
                  <tr key={statement.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {statement.worker_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {statement.worker_phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900 dark:text-gray-100">
                      {statement.year}년 {statement.month}월
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900 dark:text-gray-100">
                      {statement.statement_data.work_days}일
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900 dark:text-gray-100">
                      {(statement.statement_data.total_manhours || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                      ₩{new Intl.NumberFormat('ko-KR').format(statement.statement_data.net_salary || 0)}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(statement.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => viewPayslip(statement)}
                          className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="급여명세서 보기"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteStatement(statement.id)}
                          className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}