'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Save, Edit, X, Check, History, Plus, Info, Calculator, AlertCircle } from 'lucide-react'
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
  name: string
  phone: string
  email: string
  daily_wage: number
  meal_allowance: number
  transportation_allowance: number
  overtime_rate: number
  salary_type: SalaryType
  tax_rate: number
  national_pension_rate: number
  health_insurance_rate: number
  employment_insurance_rate: number
  long_term_care_rate: number
  created_at: string
  updated_at: string
}

interface SalaryHistory {
  id: string
  worker_id: string
  daily_wage: number
  meal_allowance: number
  transportation_allowance: number
  overtime_rate: number
  salary_type: SalaryType
  tax_rate: number
  national_pension_rate: number
  health_insurance_rate: number
  employment_insurance_rate: number
  long_term_care_rate: number
  effective_date: string
  notes: string
  created_at: string
}

interface SalaryTypeInfo {
  type: SalaryType
  description: string
  defaultRates: {
    tax_rate: number
    national_pension_rate: number
    health_insurance_rate: number
    employment_insurance_rate: number
    long_term_care_rate: number
  }
  guidance: string[]
}

const salaryTypeInfo: SalaryTypeInfo[] = [
  {
    type: '4대보험직원',
    description: '정규직 직원으로 4대보험 가입대상',
    defaultRates: {
      tax_rate: 3.3,
      national_pension_rate: 4.5,
      health_insurance_rate: 3.545,
      employment_insurance_rate: 0.9,
      long_term_care_rate: 0.4591
    },
    guidance: [
      '국민연금: 4.5% (사업자 4.5% 매칭)',
      '건강보험: 3.545% (사업자 3.545% 매칭)',
      '고용보험: 0.9% (사업자 1.05% 부담)',
      '장기요양보험: 건강보험료의 12.95%',
      '소득세: 3.3% (간이세액표 적용)'
    ]
  },
  {
    type: '프리랜서',
    description: '프리랜서 (사업소득세 적용)',
    defaultRates: {
      tax_rate: 3.3,
      national_pension_rate: 0,
      health_insurance_rate: 0,
      employment_insurance_rate: 0,
      long_term_care_rate: 0
    },
    guidance: [
      '사업소득세: 3.3% (소득세 3% + 지방소득세 0.3%)',
      '4대보험 미적용 (개인적으로 지역보험 가입)',
      '매월 사업소득세만 원천징수',
      '연말정산 대상 아님 (종합소득세 신고)'
    ]
  },
  {
    type: '일용직',
    description: '일용직 근로자 (일용근로소득세 적용)',
    defaultRates: {
      tax_rate: 6.0,
      national_pension_rate: 0,
      health_insurance_rate: 0,
      employment_insurance_rate: 0,
      long_term_care_rate: 0
    },
    guidance: [
      '일용근로소득세: 6% (소득세 5.5% + 지방소득세 0.5%)',
      '일 15만원 이하 비과세',
      '4대보험 미적용',
      '연말정산 대상 아님'
    ]
  }
]

export default function IndividualSalarySettings() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [editingWorker, setEditingWorker] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Worker>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState<string | null>(null)
  const [salaryHistory, setSalaryHistory] = useState<SalaryHistory[]>([])
  const [showAddWorker, setShowAddWorker] = useState(false)
  const [showTaxInfo, setShowTaxInfo] = useState<SalaryType | null>(null)
  const [newWorkerForm, setNewWorkerForm] = useState({
    name: '',
    phone: '',
    email: '',
    daily_wage: 0,
    meal_allowance: 0,
    transportation_allowance: 0,
    overtime_rate: 1.5,
    salary_type: '4대보험직원' as SalaryType,
    tax_rate: 3.3,
    national_pension_rate: 4.5,
    health_insurance_rate: 3.545,
    employment_insurance_rate: 0.9,
    long_term_care_rate: 0.4591
  })

  const supabase = createClient()

  useEffect(() => {
    fetchWorkers()
  }, [])

  const fetchWorkers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching workers:', error)
    } else {
      setWorkers(data || [])
    }
    setLoading(false)
  }

  const fetchSalaryHistory = async (workerId: string) => {
    const { data, error } = await supabase
      .from('salary_history')
      .select('*')
      .eq('worker_id', workerId)
      .order('effective_date', { ascending: false })

    if (error) {
      console.error('Error fetching salary history:', error)
    } else {
      setSalaryHistory(data || [])
    }
  }

  const handleSalaryTypeChange = (salaryType: SalaryType, isEditForm: boolean = false) => {
    const typeInfo = salaryTypeInfo.find(info => info.type === salaryType)
    if (!typeInfo) return

    const defaultRates = typeInfo.defaultRates
    
    if (isEditForm) {
      setEditForm(prev => ({
        ...prev,
        salary_type: salaryType,
        tax_rate: defaultRates.tax_rate,
        national_pension_rate: defaultRates.national_pension_rate,
        health_insurance_rate: defaultRates.health_insurance_rate,
        employment_insurance_rate: defaultRates.employment_insurance_rate,
        long_term_care_rate: defaultRates.long_term_care_rate
      }))
    } else {
      setNewWorkerForm(prev => ({
        ...prev,
        salary_type: salaryType,
        tax_rate: defaultRates.tax_rate,
        national_pension_rate: defaultRates.national_pension_rate,
        health_insurance_rate: defaultRates.health_insurance_rate,
        employment_insurance_rate: defaultRates.employment_insurance_rate,
        long_term_care_rate: defaultRates.long_term_care_rate
      }))
    }
  }

  const startEditing = (worker: Worker) => {
    setEditingWorker(worker.id)
    setEditForm({
      daily_wage: worker.daily_wage || 0,
      meal_allowance: worker.meal_allowance || 0,
      transportation_allowance: worker.transportation_allowance || 0,
      overtime_rate: worker.overtime_rate || 1.5,
      salary_type: worker.salary_type || '4대보험직원',
      tax_rate: worker.tax_rate || 3.3,
      national_pension_rate: worker.national_pension_rate || 4.5,
      health_insurance_rate: worker.health_insurance_rate || 3.545,
      employment_insurance_rate: worker.employment_insurance_rate || 0.9,
      long_term_care_rate: worker.long_term_care_rate || 0.4591
    })
  }

  const cancelEditing = () => {
    setEditingWorker(null)
    setEditForm({})
  }

  const saveWorkerSettings = async (workerId: string) => {
    const worker = workers.find(w => w.id === workerId)
    if (!worker) return

    // Save to salary history if values changed
    const hasChanges = (
      editForm.daily_wage !== worker.daily_wage ||
      editForm.meal_allowance !== worker.meal_allowance ||
      editForm.transportation_allowance !== worker.transportation_allowance ||
      editForm.overtime_rate !== worker.overtime_rate
    )

    if (hasChanges) {
      await supabase
        .from('salary_history')
        .insert({
          worker_id: workerId,
          daily_wage: editForm.daily_wage,
          meal_allowance: editForm.meal_allowance,
          transportation_allowance: editForm.transportation_allowance,
          overtime_rate: editForm.overtime_rate,
          effective_date: new Date().toISOString().split('T')[0],
          notes: '급여기준 변경'
        })
    }

    // Update worker
    const { error } = await supabase
      .from('workers')
      .update({
        daily_wage: editForm.daily_wage,
        meal_allowance: editForm.meal_allowance,
        transportation_allowance: editForm.transportation_allowance,
        overtime_rate: editForm.overtime_rate,
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

  const addNewWorker = async () => {
    if (!newWorkerForm.name.trim()) {
      alert('작업자 이름을 입력해주세요.')
      return
    }

    const { error } = await supabase
      .from('workers')
      .insert({
        ...newWorkerForm,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error adding worker:', error)
      alert('작업자 추가 중 오류가 발생했습니다.')
    } else {
      fetchWorkers()
      setShowAddWorker(false)
      setNewWorkerForm({
        name: '',
        phone: '',
        email: '',
        daily_wage: 0,
        meal_allowance: 0,
        transportation_allowance: 0,
        overtime_rate: 1.5
      })
    }
  }

  const showWorkerHistory = (workerId: string) => {
    setShowHistory(workerId)
    fetchSalaryHistory(workerId)
  }

  const filteredWorkers = workers.filter(worker =>
    worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.phone.includes(searchTerm) ||
    worker.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  return (
    <div className="space-y-6">
      {/* Search and Add */}
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
        
        <button
          onClick={() => setShowAddWorker(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          작업자 추가
        </button>
      </div>

      {/* Add Worker Modal */}
      {showAddWorker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                새 작업자 추가
              </h3>
              <button
                onClick={() => setShowAddWorker(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  이름 *
                </label>
                <input
                  type="text"
                  value={newWorkerForm.name}
                  onChange={(e) => setNewWorkerForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  연락처
                </label>
                <input
                  type="tel"
                  value={newWorkerForm.phone}
                  onChange={(e) => setNewWorkerForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  이메일
                </label>
                <input
                  type="email"
                  value={newWorkerForm.email}
                  onChange={(e) => setNewWorkerForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    일급 (₩)
                  </label>
                  <input
                    type="number"
                    value={newWorkerForm.daily_wage}
                    onChange={(e) => setNewWorkerForm(prev => ({ ...prev, daily_wage: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    식대 (₩)
                  </label>
                  <input
                    type="number"
                    value={newWorkerForm.meal_allowance}
                    onChange={(e) => setNewWorkerForm(prev => ({ ...prev, meal_allowance: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    교통비 (₩)
                  </label>
                  <input
                    type="number"
                    value={newWorkerForm.transportation_allowance}
                    onChange={(e) => setNewWorkerForm(prev => ({ ...prev, transportation_allowance: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    연장수당율
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newWorkerForm.overtime_rate}
                    onChange={(e) => setNewWorkerForm(prev => ({ ...prev, overtime_rate: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddWorker(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                취소
              </button>
              <button
                onClick={addNewWorker}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                추가
              </button>
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
                  일급
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  식대
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  교통비
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  연장수당율
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  일일 총액
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
              ) : filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    작업자가 없습니다
                  </td>
                </tr>
              ) : (
                filteredWorkers.map(worker => (
                  <tr key={worker.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {worker.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {worker.phone}
                        </div>
                        {worker.email && (
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {worker.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {editingWorker === worker.id ? (
                        <input
                          type="number"
                          value={editForm.daily_wage || 0}
                          onChange={(e) => setEditForm(prev => ({ ...prev, daily_wage: Number(e.target.value) }))}
                          className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-right"
                        />
                      ) : (
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          ₩{formatCurrency(worker.daily_wage)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {editingWorker === worker.id ? (
                        <input
                          type="number"
                          value={editForm.meal_allowance || 0}
                          onChange={(e) => setEditForm(prev => ({ ...prev, meal_allowance: Number(e.target.value) }))}
                          className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-right"
                        />
                      ) : (
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          ₩{formatCurrency(worker.meal_allowance)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {editingWorker === worker.id ? (
                        <input
                          type="number"
                          value={editForm.transportation_allowance || 0}
                          onChange={(e) => setEditForm(prev => ({ ...prev, transportation_allowance: Number(e.target.value) }))}
                          className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-right"
                        />
                      ) : (
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          ₩{formatCurrency(worker.transportation_allowance)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {editingWorker === worker.id ? (
                        <input
                          type="number"
                          step="0.1"
                          value={editForm.overtime_rate || 1.0}
                          onChange={(e) => setEditForm(prev => ({ ...prev, overtime_rate: Number(e.target.value) }))}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center"
                        />
                      ) : (
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {worker.overtime_rate}배
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        ₩{formatCurrency(worker.daily_wage + worker.meal_allowance + worker.transportation_allowance)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        {editingWorker === worker.id ? (
                          <>
                            <button
                              onClick={() => saveWorkerSettings(worker.id)}
                              className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title="저장"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              title="취소"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditing(worker)}
                              className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="수정"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => showWorkerHistory(worker.id)}
                              className="p-2 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                              title="변경 이력"
                            >
                              <History className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                급여 변경 이력
              </h3>
              <button
                onClick={() => setShowHistory(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      적용일
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      일급
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      식대
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      교통비
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      연장수당율
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      비고
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {salaryHistory.map(history => (
                    <tr key={history.id}>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(history.effective_date)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-gray-100">
                        ₩{formatCurrency(history.daily_wage)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-gray-100">
                        ₩{formatCurrency(history.meal_allowance)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-gray-100">
                        ₩{formatCurrency(history.transportation_allowance)}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-gray-100">
                        {history.overtime_rate}배
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {history.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}