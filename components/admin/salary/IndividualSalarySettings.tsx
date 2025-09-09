'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Calculator, Info, Settings } from 'lucide-react'
import { 
  CustomSelect, 
  CustomSelectContent, 
  CustomSelectItem, 
  CustomSelectTrigger, 
  CustomSelectValue 
} from '@/components/ui/custom-select'

type SalaryType = '4대보험직원' | '프리랜서' | '일용직'

interface Worker {
  id: string
  full_name: string
  phone: string
  email: string
  daily_wage: number
  salary_type: SalaryType
  tax_rate: number
  national_pension_rate: number
  health_insurance_rate: number
  employment_insurance_rate: number
  long_term_care_rate: number
}

interface TaxSettings {
  salary_type: SalaryType
  tax_rate: number
  national_pension_rate: number
  health_insurance_rate: number
  employment_insurance_rate: number
  long_term_care_rate: number
}

const defaultTaxSettings: Record<SalaryType, TaxSettings> = {
  '4대보험직원': {
    salary_type: '4대보험직원',
    tax_rate: 3.3,
    national_pension_rate: 4.5,
    health_insurance_rate: 3.545,
    employment_insurance_rate: 0.9,
    long_term_care_rate: 0.4591
  },
  '프리랜서': {
    salary_type: '프리랜서',
    tax_rate: 3.3,
    national_pension_rate: 0,
    health_insurance_rate: 0,
    employment_insurance_rate: 0,
    long_term_care_rate: 0
  },
  '일용직': {
    salary_type: '일용직',
    tax_rate: 6.0,
    national_pension_rate: 0,
    health_insurance_rate: 0,
    employment_insurance_rate: 0,
    long_term_care_rate: 0
  }
}

export default function IndividualSalarySettings() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [editingWorker, setEditingWorker] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Worker>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [showTaxSettings, setShowTaxSettings] = useState(false)
  const [taxSettings, setTaxSettings] = useState(defaultTaxSettings)
  const [savingSettings, setSavingSettings] = useState(false)
  
  // Example calculation values
  const [showExample, setShowExample] = useState(false)
  const exampleManhours = 20.0

  const supabase = createClient()

  useEffect(() => {
    fetchWorkers()
    loadTaxSettings()
  }, [])

  const fetchWorkers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .not('role', 'is', null)
      .order('full_name')

    if (error) {
      console.error('Error fetching workers:', error)
    } else {
      setWorkers((data || []).map(profile => ({
        ...profile,
        salary_type: profile.salary_type || '4대보험직원',
        tax_rate: profile.tax_rate || defaultTaxSettings['4대보험직원'].tax_rate,
        national_pension_rate: profile.national_pension_rate || defaultTaxSettings['4대보험직원'].national_pension_rate,
        health_insurance_rate: profile.health_insurance_rate || defaultTaxSettings['4대보험직원'].health_insurance_rate,
        employment_insurance_rate: profile.employment_insurance_rate || defaultTaxSettings['4대보험직원'].employment_insurance_rate,
        long_term_care_rate: profile.long_term_care_rate || defaultTaxSettings['4대보험직원'].long_term_care_rate
      })))
    }
    setLoading(false)
  }

  const loadTaxSettings = async () => {
    // Load tax settings from localStorage or database
    const savedSettings = localStorage.getItem('taxSettings')
    if (savedSettings) {
      setTaxSettings(JSON.parse(savedSettings))
    }
  }

  const saveTaxSettings = () => {
    setSavingSettings(true)
    // Save to localStorage
    localStorage.setItem('taxSettings', JSON.stringify(taxSettings))
    
    // Update all workers with new tax rates based on their salary type
    workers.forEach(async (worker) => {
      const settings = taxSettings[worker.salary_type]
      await supabase
        .from('profiles')
        .update({
          tax_rate: settings.tax_rate,
          national_pension_rate: settings.national_pension_rate,
          health_insurance_rate: settings.health_insurance_rate,
          employment_insurance_rate: settings.employment_insurance_rate,
          long_term_care_rate: settings.long_term_care_rate
        })
        .eq('id', worker.id)
    })
    
    setTimeout(() => {
      setSavingSettings(false)
      setShowTaxSettings(false)
      fetchWorkers()
      alert('세율 설정이 저장되었습니다.')
    }, 1000)
  }

  const startEditing = (worker: Worker) => {
    setEditingWorker(worker.id)
    setEditForm({
      daily_wage: worker.daily_wage || 0,
      salary_type: worker.salary_type || '4대보험직원'
    })
  }

  const cancelEditing = () => {
    setEditingWorker(null)
    setEditForm({})
  }

  const saveWorkerSettings = async (workerId: string) => {
    const settings = taxSettings[editForm.salary_type as SalaryType]
    
    const { error } = await supabase
      .from('profiles')
      .update({
        daily_wage: editForm.daily_wage,
        salary_type: editForm.salary_type,
        tax_rate: settings.tax_rate,
        national_pension_rate: settings.national_pension_rate,
        health_insurance_rate: settings.health_insurance_rate,
        employment_insurance_rate: settings.employment_insurance_rate,
        long_term_care_rate: settings.long_term_care_rate,
        updated_at: new Date().toISOString()
      })
      .eq('id', workerId)

    if (error) {
      console.error('Error updating worker:', error)
      alert('저장 중 오류가 발생했습니다.')
    } else {
      fetchWorkers()
      setEditingWorker(null)
      setEditForm({})
    }
  }

  const calculateNetSalary = (worker: Worker, manhours: number = 1) => {
    const dailyWage = worker.daily_wage || 0
    const totalSalary = dailyWage * manhours
    
    let totalDeductions = 0
    
    // Calculate deductions based on salary type
    if (worker.salary_type === '4대보험직원') {
      // 4대보험 공제
      totalDeductions += totalSalary * (worker.national_pension_rate / 100)
      totalDeductions += totalSalary * (worker.health_insurance_rate / 100)
      totalDeductions += totalSalary * (worker.employment_insurance_rate / 100)
      totalDeductions += totalSalary * (worker.health_insurance_rate / 100) * (worker.long_term_care_rate / 100)
      // 소득세
      totalDeductions += totalSalary * (worker.tax_rate / 100)
    } else if (worker.salary_type === '프리랜서') {
      // 사업소득세만 공제
      totalDeductions += totalSalary * (worker.tax_rate / 100)
    } else if (worker.salary_type === '일용직') {
      // 일용근로소득세 (15만원 초과분에 대해서만)
      if (dailyWage > 150000) {
        totalDeductions += (totalSalary - (150000 * manhours)) * (worker.tax_rate / 100)
      }
    }
    
    return {
      totalSalary,
      totalDeductions,
      netSalary: totalSalary - totalDeductions
    }
  }

  const filteredWorkers = workers.filter(worker =>
    worker.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.phone?.includes(searchTerm) ||
    worker.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount)
  }

  const getSalaryTypeColor = (type: SalaryType) => {
    switch (type) {
      case '4대보험직원':
        return 'bg-blue-100 text-blue-800'
      case '프리랜서':
        return 'bg-green-100 text-green-800'
      case '일용직':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <input
            type="text"
            placeholder="작업자명, 연락처, 이메일 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowExample(!showExample)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Calculator className="h-4 w-4" />
            예시 계산
          </button>
          <button
            onClick={() => setShowTaxSettings(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Settings className="h-4 w-4" />
            세율 설정
          </button>
        </div>
      </div>

      {/* Example Calculation */}
      {showExample && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                급여 계산 예시 (월 20공수 기준)
              </h4>
              <div className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                <div>김관리: 일당 150,000원 × 20공수 = 3,000,000원 → 실급여 2,757,000원 (4대보험직원)</div>
                <div>이프리: 일당 200,000원 × 20공수 = 4,000,000원 → 실급여 3,868,000원 (프리랜서)</div>
                <div>박일용: 일당 180,000원 × 20공수 = 3,600,000원 → 실급여 3,564,000원 (일용직)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workers Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  작업자
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  일당
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  급여방식
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  적용세율
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  월 총급여
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  공제액
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  실급여
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    데이터를 불러오는 중...
                  </td>
                </tr>
              ) : filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    작업자가 없습니다
                  </td>
                </tr>
              ) : (
                filteredWorkers.map(worker => {
                  const calculation = calculateNetSalary(worker, exampleManhours)
                  return (
                    <tr key={worker.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {worker.full_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {worker.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {editingWorker === worker.id ? (
                          <input
                            type="number"
                            value={editForm.daily_wage || 0}
                            onChange={(e) => setEditForm(prev => ({ ...prev, daily_wage: Number(e.target.value) }))}
                            className="w-28 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-right"
                          />
                        ) : (
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            ₩{formatCurrency(worker.daily_wage || 0)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {editingWorker === worker.id ? (
                          <CustomSelect
                            value={editForm.salary_type}
                            onValueChange={(value) => setEditForm(prev => ({ ...prev, salary_type: value as SalaryType }))}
                          >
                            <CustomSelectTrigger className="w-32 h-8">
                              <CustomSelectValue />
                            </CustomSelectTrigger>
                            <CustomSelectContent>
                              <CustomSelectItem value="4대보험직원">4대보험직원</CustomSelectItem>
                              <CustomSelectItem value="프리랜서">프리랜서</CustomSelectItem>
                              <CustomSelectItem value="일용직">일용직</CustomSelectItem>
                            </CustomSelectContent>
                          </CustomSelect>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSalaryTypeColor(worker.salary_type)}`}>
                            {worker.salary_type}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {worker.salary_type === '4대보험직원' ? (
                            <div className="space-y-0.5 text-xs">
                              <div>소득세: {worker.tax_rate}%</div>
                              <div>4대보험: {(worker.national_pension_rate + worker.health_insurance_rate + worker.employment_insurance_rate).toFixed(1)}%</div>
                            </div>
                          ) : (
                            <div>{worker.tax_rate}%</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900 dark:text-gray-100">
                        ₩{formatCurrency(calculation.totalSalary)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-red-600 dark:text-red-400">
                        -₩{formatCurrency(calculation.totalDeductions)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          ₩{formatCurrency(calculation.netSalary)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {editingWorker === worker.id ? (
                            <>
                              <button
                                onClick={() => saveWorkerSettings(worker.id)}
                                className="px-3 py-1 text-sm font-medium text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 rounded-md transition-colors"
                              >
                                저장
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors"
                              >
                                취소
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => startEditing(worker)}
                              className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                            >
                              수정
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Settings Modal */}
      {showTaxSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                급여방식별 세율 설정
              </h3>
              <button
                onClick={() => setShowTaxSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* 4대보험직원 설정 */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">4대보험직원</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      소득세 (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={taxSettings['4대보험직원'].tax_rate}
                      onChange={(e) => setTaxSettings(prev => ({
                        ...prev,
                        '4대보험직원': { ...prev['4대보험직원'], tax_rate: Number(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      국민연금 (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={taxSettings['4대보험직원'].national_pension_rate}
                      onChange={(e) => setTaxSettings(prev => ({
                        ...prev,
                        '4대보험직원': { ...prev['4대보험직원'], national_pension_rate: Number(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      건강보험 (%)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={taxSettings['4대보험직원'].health_insurance_rate}
                      onChange={(e) => setTaxSettings(prev => ({
                        ...prev,
                        '4대보험직원': { ...prev['4대보험직원'], health_insurance_rate: Number(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      고용보험 (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={taxSettings['4대보험직원'].employment_insurance_rate}
                      onChange={(e) => setTaxSettings(prev => ({
                        ...prev,
                        '4대보험직원': { ...prev['4대보험직원'], employment_insurance_rate: Number(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      장기요양보험 (%)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={taxSettings['4대보험직원'].long_term_care_rate}
                      onChange={(e) => setTaxSettings(prev => ({
                        ...prev,
                        '4대보험직원': { ...prev['4대보험직원'], long_term_care_rate: Number(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* 프리랜서 설정 */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">프리랜서</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      사업소득세 (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={taxSettings['프리랜서'].tax_rate}
                      onChange={(e) => setTaxSettings(prev => ({
                        ...prev,
                        '프리랜서': { ...prev['프리랜서'], tax_rate: Number(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  * 프리랜서는 4대보험 미적용
                </p>
              </div>

              {/* 일용직 설정 */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">일용직</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      일용근로소득세 (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={taxSettings['일용직'].tax_rate}
                      onChange={(e) => setTaxSettings(prev => ({
                        ...prev,
                        '일용직': { ...prev['일용직'], tax_rate: Number(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  * 일 15만원 이하 비과세, 초과분에 대해서만 과세
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowTaxSettings(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                취소
              </button>
              <button
                onClick={saveTaxSettings}
                disabled={savingSettings}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {savingSettings ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}