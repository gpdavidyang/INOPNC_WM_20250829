'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Download, Trash2, Eye, Plus, Calendar } from 'lucide-react'
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
    const { data } = await supabase
      .from('workers')
      .select('id, name')
      .order('name')

    if (data) {
      setWorkers(data.map(w => ({ value: w.id, label: w.name })))
    }
  }

  const fetchStatements = async () => {
    setLoading(true)
    
    let query = supabase
      .from('salary_statements')
      .select('*')
      .eq('year', year)
      .eq('month', month)
      .order('created_at', { ascending: false })

    if (selectedWorkers.length > 0) {
      query = query.in('worker_id', selectedWorkers)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching statements:', error)
    } else {
      setStatements(data || [])
    }
    
    setLoading(false)
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

      const { data: salaryData } = await supabase
        .from('worker_assignments')
        .select(`
          worker_id,
          labor_hours,
          daily_reports!inner(
            date,
            site_id,
            sites(name)
          ),
          workers!inner(
            id,
            name,
            phone,
            daily_wage,
            meal_allowance,
            transportation_allowance
          )
        `)
        .in('worker_id', selectedWorkers)
        .gte('daily_reports.date', startDate)
        .lte('daily_reports.date', endDate)

      if (!salaryData) {
        throw new Error('급여 데이터를 불러올 수 없습니다.')
      }

      // Process data by worker
      const workerMap = new Map()
      salaryData.forEach(assignment => {
        const workerId = assignment.worker_id
        const worker = assignment.workers
        const report = assignment.daily_reports
        const site = report.sites

        if (!workerMap.has(workerId)) {
          workerMap.set(workerId, {
            worker_id: workerId,
            worker_name: worker.name,
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
        const laborHours = Number(assignment.labor_hours) || 0
        const dailyWage = Number(worker.daily_wage) || 0
        const mealAllowance = Number(worker.meal_allowance) || 0
        const transportAllowance = Number(worker.transportation_allowance) || 0

        workerData.total_manhours += laborHours
        workerData.base_salary += dailyWage
        workerData.allowances += mealAllowance + transportAllowance

        // Track site work
        if (!workerData.sites.has(site.name)) {
          workerData.sites.set(site.name, { days: 0, manhours: 0 })
        }
        const siteData = workerData.sites.get(site.name)
        siteData.days += 1
        siteData.manhours += laborHours
      })

      // Insert statements into database
      const statementsToInsert = Array.from(workerMap.values()).map(worker => {
        worker.total_days = Array.from(worker.sites.values()).reduce((sum, site) => sum + site.days, 0)
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

      const { error: insertError } = await supabase
        .from('salary_statements')
        .upsert(statementsToInsert, {
          onConflict: 'worker_id,year,month'
        })

      if (insertError) {
        throw insertError
      }

      alert(`${statementsToInsert.length}개의 급여명세서가 생성되었습니다.`)
      fetchStatements()
    } catch (error) {
      console.error('Error generating statements:', error)
      alert('급여명세서 생성 중 오류가 발생했습니다.')
    } finally {
      setGenerating(false)
    }
  }

  const downloadStatement = (statement: SalaryStatement) => {
    // Generate PDF content (this would typically use a PDF library like jsPDF or similar)
    const content = `
급여명세서

작업자: ${statement.worker_name}
연락처: ${statement.worker_phone}
지급년월: ${statement.year}년 ${statement.month}월

근무일수: ${statement.statement_data.work_days}일
총공수: ${statement.statement_data.total_manhours}시간

급여 내역:
- 기본급: ₩${new Intl.NumberFormat('ko-KR').format(statement.statement_data.base_salary || 0)}
- 수당: ₩${new Intl.NumberFormat('ko-KR').format(statement.statement_data.allowances || 0)}
- 공제: ₩${new Intl.NumberFormat('ko-KR').format(statement.statement_data.deductions || 0)}
- 실수령액: ₩${new Intl.NumberFormat('ko-KR').format(statement.statement_data.net_salary || 0)}

현장별 근무내역:
${statement.statement_data.site_details.map(site => 
  `- ${site.site_name}: ${site.days}일, ${site.manhours}시간`
).join('\n')}
    `

    // Create downloadable text file (in real implementation, would generate PDF)
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `급여명세서_${statement.worker_name}_${statement.year}년${statement.month}월.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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
                      {(statement.statement_data.total_manhours || 0).toFixed(1)}
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
                          onClick={() => downloadStatement(statement)}
                          className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="다운로드"
                        >
                          <Download className="h-4 w-4" />
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