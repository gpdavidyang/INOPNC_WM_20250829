'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import AdminDataTable from './AdminDataTable'
import BulkActionBar, { commonBulkActions } from './BulkActionBar'
import { 
  getSalaryRules,
  getSalaryRecords,
  getSalaryStats,
  getAvailableSitesForSalary,
  upsertSalaryRule,
  deleteSalaryRules,
  calculateSalaries,
  approveSalaryRecords,
  SalaryCalculationRule,
  SalaryRecord,
  SalaryStats
} from '@/app/actions/admin/salary'
import { Search, DollarSign, Calculator, CheckCircle, Clock, Users, TrendingUp, Settings, Plus, Play, FileText } from 'lucide-react'
import SalaryStatement from './salary/SalaryStatement'

interface SalaryManagementProps {
  profile: Profile
}

export default function SalaryManagement({ profile }: SalaryManagementProps) {
  const [activeTab, setActiveTab] = useState<'rules' | 'records' | 'calculate' | 'statements'>('rules')
  
  // Rules tab state
  const [rules, setRules] = useState<SalaryCalculationRule[]>([])
  const [rulesLoading, setRulesLoading] = useState(true)
  const [rulesError, setRulesError] = useState<string | null>(null)
  
  // Records tab state
  const [records, setRecords] = useState<SalaryRecord[]>([])
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [recordsError, setRecordsError] = useState<string | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 10

  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [ruleTypeFilter, setRuleTypeFilter] = useState<string>('hourly_rate')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [siteFilter, setSiteFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  // Statistics
  const [stats, setStats] = useState<SalaryStats>({
    total_workers: 0,
    pending_calculations: 0,
    approved_payments: 0,
    total_payroll: 0,
    average_daily_pay: 0,
    overtime_percentage: 0
  })
  
  // Available sites
  const [availableSites, setAvailableSites] = useState<Array<{ id: string; name: string }>>([])

  // Modal state
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [showRuleDetailModal, setShowRuleDetailModal] = useState(false)
  const [selectedRuleDetail, setSelectedRuleDetail] = useState<SalaryCalculationRule | null>(null)
  const [editingRule, setEditingRule] = useState<SalaryCalculationRule | null>(null)
  const [ruleFormData, setRuleFormData] = useState<{
    rule_name: string
    rule_type: 'hourly_rate' | 'daily_rate' | 'overtime_multiplier' | 'bonus_calculation'
    base_amount: number
    multiplier: number
    site_id: string
    role: string
    is_active: boolean
    id?: string
  }>({
    rule_name: '',
    rule_type: 'hourly_rate',
    base_amount: 0,
    multiplier: 1,
    site_id: '',
    role: '',
    is_active: true
  })

  // Load rules data
  const loadRules = async () => {
    setRulesLoading(true)
    setRulesError(null)
    
    try {
      const result = await getSalaryRules(
        currentPage,
        pageSize,
        searchTerm,
        ruleTypeFilter || undefined,
        siteFilter || undefined
      )
      
      if (result.success && result.data) {
        setRules(result.data.rules)
        setTotalCount(result.data.total)
        setTotalPages(result.data.pages)
      } else {
        setRulesError(result.error || '급여 규칙 데이터를 불러오는데 실패했습니다.')
      }
    } catch (err) {
      setRulesError('급여 규칙 데이터를 불러오는데 실패했습니다.')
    } finally {
      setRulesLoading(false)
    }
  }

  // Load records data
  const loadRecords = async () => {
    setRecordsLoading(true)
    setRecordsError(null)
    
    try {
      const result = await getSalaryRecords(
        currentPage,
        pageSize,
        searchTerm,
        statusFilter as any,
        siteFilter || undefined,
        dateFrom || undefined,
        dateTo || undefined
      )
      
      if (result.success && result.data) {
        setRecords(result.data.records)
        setTotalCount(result.data.total)
        setTotalPages(result.data.pages)
      } else {
        setRecordsError(result.error || '급여 기록 데이터를 불러오는데 실패했습니다.')
      }
    } catch (err) {
      setRecordsError('급여 기록 데이터를 불러오는데 실패했습니다.')
    } finally {
      setRecordsLoading(false)
    }
  }

  // Load statistics
  const loadStats = async () => {
    try {
      const result = await getSalaryStats(
        siteFilter || undefined,
        dateFrom || undefined,
        dateTo || undefined
      )
      if (result.success && result.data) {
        setStats(result.data)
      }
    } catch (err) {
      console.error('Failed to load salary stats:', err)
    }
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

  // Load data based on active tab
  useEffect(() => {
    setSelectedIds([])
    setCurrentPage(1)
    
    if (activeTab === 'rules') {
      loadRules()
    } else if (activeTab === 'records') {
      loadRecords()
    }
  }, [activeTab])

  // Load data when filters change
  useEffect(() => {
    if (activeTab === 'rules') {
      loadRules()
    } else if (activeTab === 'records') {
      loadRecords()
    }
  }, [currentPage, searchTerm, ruleTypeFilter, statusFilter, siteFilter, dateFrom, dateTo])

  useEffect(() => {
    loadStats()
    loadAvailableSites()
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

  // Handle rule creation/editing
  const handleRuleSubmit = async () => {
    try {
      const submitData = editingRule?.id 
        ? { ...ruleFormData, id: editingRule.id }
        : ruleFormData
        
      const result = await upsertSalaryRule(submitData)
      
      if (result.success) {
        await loadRules()
        setShowRuleModal(false)
        setEditingRule(null)
        setRuleFormData({
          rule_name: '',
          rule_type: 'hourly_rate',
          base_amount: 0,
          multiplier: 1,
          site_id: '',
          role: '',
          is_active: true
        })
        alert(result.message)
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('급여 규칙 처리 중 오류가 발생했습니다.')
    }
  }

  // Handle bulk delete rules
  const handleBulkDeleteRules = async (ruleIds: string[]) => {
    if (!confirm(`${ruleIds.length}개 급여 규칙을 삭제하시겠습니까?`)) {
      return
    }

    try {
      const result = await deleteSalaryRules(ruleIds)
      if (result.success) {
        await loadRules()
        setSelectedIds([])
        alert(result.message)
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  // Handle salary calculation
  const handleCalculateSalaries = async () => {
    if (!dateFrom || !dateTo) {
      alert('계산할 기간을 선택하세요.')
      return
    }

    try {
      const result = await calculateSalaries(
        siteFilter || undefined,
        dateFrom,
        dateTo
      )
      
      if (result.success) {
        await Promise.all([loadRecords(), loadStats()])
        alert(result.message)
        setActiveTab('records')
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('급여 계산 중 오류가 발생했습니다.')
    }
  }

  // Handle salary approval
  const handleApproveSalaries = async (recordIds: string[]) => {
    if (!confirm(`${recordIds.length}개 급여 기록을 승인하시겠습니까?`)) {
      return
    }

    try {
      const result = await approveSalaryRecords(recordIds)
      if (result.success) {
        await Promise.all([loadRecords(), loadStats()])
        setSelectedIds([])
        alert(result.message)
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('승인 처리 중 오류가 발생했습니다.')
    }
  }

  // Define columns for different tabs
  const rulesColumns = [
    {
      key: 'rule_name',
      label: '규칙 정보',
      sortable: true,
      filterable: true,
      render: (value: string, rule: SalaryCalculationRule) => (
        <div 
          className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md p-2 -m-2 transition-colors"
          onClick={() => {
            setSelectedRuleDetail(rule)
            setShowRuleDetailModal(true)
          }}
        >
          <Settings className="h-8 w-8 text-blue-500 mr-3" />
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{value}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {rule.rule_type.replace('_', ' ').toUpperCase()}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'base_amount',
      label: '기본 금액',
      render: (value: number, rule: SalaryCalculationRule) => (
        <div>
          <div className="font-medium">₩{value.toLocaleString()}</div>
          {rule.multiplier && rule.multiplier !== 1 && (
            <div className="text-sm text-gray-500">
              배율: {rule.multiplier}x
            </div>
          )}
        </div>
      )
    },
    {
      key: 'site_id',
      label: '적용 범위',
      render: (site_id: string, rule: SalaryCalculationRule) => (
        <div className="text-sm">
          <div>{site_id ? availableSites.find(s => s.id === site_id)?.name || 'Unknown Site' : '전체 현장'}</div>
          {rule.role && (
            <div className="text-gray-500">역할: {rule.role}</div>
          )}
        </div>
      )
    },
    {
      key: 'is_active',
      label: '상태',
      render: (value: boolean) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          value 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
        }`}>
          {value ? '활성' : '비활성'}
        </span>
      )
    }
  ]

  const recordsColumns = [
    {
      key: 'worker',
      label: '근로자 정보',
      render: (worker: { full_name: string; email: string; role: string }) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">{worker.full_name}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{worker.role}</div>
          <div className="text-xs text-gray-400">{worker.email}</div>
        </div>
      )
    },
    {
      key: 'work_date',
      label: '근무일',
      render: (value: string) => new Date(value).toLocaleDateString('ko-KR')
    },
    {
      key: 'regular_hours',
      label: '공수',
      render: (regular_hours: number, record: SalaryRecord) => (
        <div className="text-sm">
          <div>공수: {regular_hours}</div>
          {record.overtime_hours > 0 && (
            <div className="text-orange-600">연장: {record.overtime_hours}</div>
          )}
          {record.notes && (
            <div className="text-xs text-gray-500">{record.notes}</div>
          )}
        </div>
      )
    },
    {
      key: 'total_pay',
      label: '급여 정보',
      render: (total_pay: number, record: SalaryRecord) => (
        <div>
          <div className="font-medium">₩{total_pay.toLocaleString()}</div>
          <div className="text-xs text-gray-500">
            기본: ₩{record.base_pay.toLocaleString()}
            {record.overtime_pay > 0 && (
              <span> + 연장: ₩{record.overtime_pay.toLocaleString()}</span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: '상태',
      render: (value: string) => {
        const statusConfig = {
          calculated: { text: '계산됨', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300', icon: Calculator },
          approved: { text: '승인됨', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300', icon: CheckCircle },
          paid: { text: '지급됨', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300', icon: DollarSign }
        }
        
        const config = statusConfig[value as keyof typeof statusConfig] || statusConfig.calculated
        const Icon = config.icon
        
        return (
          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
            <Icon className="h-3 w-3 mr-1" />
            {config.text}
          </span>
        )
      }
    }
  ]

  // Define bulk actions for different tabs
  const rulesBulkActions = [
    commonBulkActions.delete(handleBulkDeleteRules)
  ]

  const recordsBulkActions = [
    {
      id: 'approve',
      label: '승인',
      icon: CheckCircle,
      variant: 'default' as const,
      onClick: handleApproveSalaries
    }
  ]

  const getCurrentData = () => {
    switch (activeTab) {
      case 'rules': return rules
      case 'records': return records
      default: return []
    }
  }

  const getCurrentColumns = () => {
    switch (activeTab) {
      case 'rules': return rulesColumns
      case 'records': return recordsColumns
      default: return []
    }
  }

  const getCurrentLoading = () => {
    switch (activeTab) {
      case 'rules': return rulesLoading
      case 'records': return recordsLoading
      default: return false
    }
  }

  const getCurrentError = () => {
    switch (activeTab) {
      case 'rules': return rulesError
      case 'records': return recordsError
      default: return null
    }
  }

  const getCurrentBulkActions = () => {
    switch (activeTab) {
      case 'rules': return rulesBulkActions
      case 'records': return recordsBulkActions
      default: return []
    }
  }

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 xl:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">총 근로자</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stats.total_workers}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">계산 대기</div>
          <div className="text-lg font-semibold text-yellow-600">{stats.pending_calculations}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">승인됨</div>
          <div className="text-lg font-semibold text-green-600">{stats.approved_payments}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">총 급여</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">₩{stats.total_payroll.toLocaleString()}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">일평균 급여</div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">₩{Math.round(stats.average_daily_pay).toLocaleString()}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">연장근무율</div>
          <div className="text-lg font-semibold text-orange-600">{stats.overtime_percentage.toFixed(1)}%</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rules'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            급여 규칙
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'records'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            급여 기록
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

      {/* Salary Calculation Tab */}
      {activeTab === 'calculate' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">급여 계산</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                시작일 *
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                종료일 *
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                현장 선택
              </label>
              <select
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">모든 현장</option>
                {availableSites.map((site) => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleCalculateSalaries}
                disabled={!dateFrom || !dateTo}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Play className="h-4 w-4 mr-2" />
                급여 계산 실행
              </button>
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              선택한 기간의 출근 기록을 바탕으로 급여를 자동 계산합니다. 
              계산된 급여는 급여 기록 탭에서 확인하고 승인할 수 있습니다.
            </p>
          </div>
        </div>
      )}

      {/* Salary Statement Tab */}
      {activeTab === 'statements' && (
        <SalaryStatement profile={profile} />
      )}

      {/* Header with search and filters */}
      {activeTab !== 'calculate' && activeTab !== 'statements' && (
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder={
                  activeTab === 'rules' ? '규칙명으로 검색...' : '근로자명으로 검색...'
                }
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          
          <div className="flex flex-row gap-2 flex-shrink-0 flex-wrap lg:flex-nowrap">
            {activeTab === 'rules' && (
              <>
                <select
                  value={ruleTypeFilter}
                  onChange={(e) => setRuleTypeFilter(e.target.value)}
                  className="min-w-[140px] px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="hourly_rate">시급</option>
                  <option value="daily_rate">일급</option>
                  <option value="overtime_multiplier">연장근무 배율</option>
                  <option value="bonus_calculation">보너스 계산</option>
                </select>
                
                <button
                  onClick={() => {
                    setEditingRule(null)
                    setRuleFormData({
                      rule_name: '',
                      rule_type: 'hourly_rate',
                      base_amount: 0,
                      multiplier: 1,
                      site_id: '',
                      role: '',
                      is_active: true
                    })
                    setShowRuleModal(true)
                  }}
                  className="flex items-center whitespace-nowrap px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  규칙 추가
                </button>
              </>
            )}
            
            {activeTab === 'records' && (
              <>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="min-w-[100px] px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">모든 상태</option>
                  <option value="calculated">계산됨</option>
                  <option value="approved">승인됨</option>
                  <option value="paid">지급됨</option>
                </select>
                
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="min-w-[130px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="시작일"
                />
                
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="min-w-[130px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="종료일"
                />
              </>
            )}
            
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="min-w-[100px] px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              {availableSites.map((site) => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Data table */}
      {activeTab !== 'calculate' && activeTab !== 'statements' && (
        <AdminDataTable
          data={getCurrentData() as any[]}
          columns={getCurrentColumns() as any[]}
          loading={getCurrentLoading()}
          error={getCurrentError()}
          selectable={true}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          getRowId={(item: any) => item.id}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          totalCount={totalCount}
          emptyMessage={
            activeTab === 'rules' ? '급여 규칙이 없습니다' : '급여 기록이 없습니다'
          }
          emptyDescription={
            activeTab === 'rules' 
              ? '급여 계산을 위한 규칙을 추가하세요.' 
              : '급여 계산을 실행하면 기록이 생성됩니다.'
          }
        />
      )}

      {/* Bulk action bar */}
      {activeTab !== 'calculate' && activeTab !== 'statements' && (
        <BulkActionBar
          selectedIds={selectedIds}
          totalCount={totalCount}
          actions={getCurrentBulkActions()}
          onClearSelection={() => setSelectedIds([])}
        />
      )}

      {/* Rule Detail Modal */}
      {showRuleDetailModal && selectedRuleDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  급여 규칙 상세 정보
                </h2>
                <button
                  onClick={() => {
                    setShowRuleDetailModal(false)
                    setSelectedRuleDetail(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* 기본 정보 */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">기본 정보</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">규칙명</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedRuleDetail.rule_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">규칙 타입</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {selectedRuleDetail.rule_type === 'hourly_rate' && '시급'}
                        {selectedRuleDetail.rule_type === 'daily_rate' && '일급'}
                        {selectedRuleDetail.rule_type === 'overtime_multiplier' && '연장근무 배율'}
                        {selectedRuleDetail.rule_type === 'bonus_calculation' && '보너스 계산'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">상태</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        selectedRuleDetail.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                      }`}>
                        {selectedRuleDetail.is_active ? '활성' : '비활성'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">규칙 ID</p>
                      <p className="text-sm font-mono text-gray-600 dark:text-gray-400">{selectedRuleDetail.id}</p>
                    </div>
                  </div>
                </div>

                {/* 급여 계산 정보 */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-3">급여 계산 정보</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">기본 금액</p>
                      <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                        ₩{selectedRuleDetail.base_amount.toLocaleString()}
                      </p>
                    </div>
                    {selectedRuleDetail.multiplier && selectedRuleDetail.multiplier !== 1 && (
                      <div>
                        <p className="text-xs text-blue-600 dark:text-blue-400">배율</p>
                        <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                          {selectedRuleDetail.multiplier}x
                        </p>
                      </div>
                    )}
                  </div>
                  {selectedRuleDetail.rule_type === 'overtime_multiplier' && (
                    <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-900/30 rounded">
                      <p className="text-xs text-blue-800 dark:text-blue-200">
                        연장근무 시 기본 시급의 {selectedRuleDetail.multiplier}배가 적용됩니다.
                      </p>
                    </div>
                  )}
                </div>

                {/* 적용 범위 */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">적용 범위</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">적용 현장</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {selectedRuleDetail.site_id 
                          ? availableSites.find(s => s.id === selectedRuleDetail.site_id)?.name || '알 수 없는 현장'
                          : '전체 현장'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">적용 역할</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {selectedRuleDetail.role || '모든 역할'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 생성/수정 정보 */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">이력 정보</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">생성일시</p>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {selectedRuleDetail.created_at ? new Date(selectedRuleDetail.created_at).toLocaleString('ko-KR') : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">최종 수정일시</p>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {selectedRuleDetail.updated_at ? new Date(selectedRuleDetail.updated_at).toLocaleString('ko-KR') : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-600 mt-6">
                <button
                  onClick={() => {
                    setEditingRule(selectedRuleDetail)
                    setRuleFormData({
                      rule_name: selectedRuleDetail.rule_name,
                      rule_type: selectedRuleDetail.rule_type,
                      base_amount: selectedRuleDetail.base_amount,
                      multiplier: selectedRuleDetail.multiplier || 1,
                      site_id: selectedRuleDetail.site_id || '',
                      role: selectedRuleDetail.role || '',
                      is_active: selectedRuleDetail.is_active
                    })
                    setShowRuleDetailModal(false)
                    setSelectedRuleDetail(null)
                    setShowRuleModal(true)
                  }}
                  className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-700 border border-blue-600 dark:border-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors"
                >
                  수정
                </button>
                <button
                  onClick={() => {
                    if (confirm('이 급여 규칙을 삭제하시겠습니까?')) {
                      handleBulkDeleteRules([selectedRuleDetail.id])
                      setShowRuleDetailModal(false)
                      setSelectedRuleDetail(null)
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-gray-700 border border-red-600 dark:border-red-400 rounded-md hover:bg-red-50 dark:hover:bg-gray-600 transition-colors"
                >
                  삭제
                </button>
                <button
                  onClick={() => {
                    setShowRuleDetailModal(false)
                    setSelectedRuleDetail(null)
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                {editingRule ? '급여 규칙 수정' : '급여 규칙 추가'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    규칙명 *
                  </label>
                  <input
                    type="text"
                    value={ruleFormData.rule_name}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, rule_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    규칙 타입 *
                  </label>
                  <select
                    value={ruleFormData.rule_type}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, rule_type: e.target.value as any })}
                    className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="hourly_rate">시급</option>
                    <option value="daily_rate">일급</option>
                    <option value="overtime_multiplier">연장근무 배율</option>
                    <option value="bonus_calculation">보너스 계산</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    기본 금액 *
                  </label>
                  <input
                    type="number"
                    value={ruleFormData.base_amount}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, base_amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>

                {ruleFormData.rule_type === 'overtime_multiplier' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      배율
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={ruleFormData.multiplier}
                      onChange={(e) => setRuleFormData({ ...ruleFormData, multiplier: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    적용 현장
                  </label>
                  <select
                    value={ruleFormData.site_id}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, site_id: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">모든 현장</option>
                    {availableSites.map((site) => (
                      <option key={site.id} value={site.id}>{site.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    적용 역할
                  </label>
                  <input
                    type="text"
                    value={ruleFormData.role}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, role: e.target.value })}
                    placeholder="예: worker, site_manager (비워두면 모든 역할)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={ruleFormData.is_active}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, is_active: e.target.checked })}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    활성 상태
                  </label>
                </div>
              </div>

              {/* Form actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-600 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowRuleModal(false)
                    setEditingRule(null)
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleRuleSubmit}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingRule ? '수정' : '추가'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}