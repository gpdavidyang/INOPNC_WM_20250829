'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { 
  Download, FileText, User, MapPin, Calendar, DollarSign, 
  Printer, Mail, Eye, ArrowLeft, Calculator, Building2,
  CreditCard, Banknote, Receipt
} from 'lucide-react'
import { CustomSelect, CustomSelectContent, CustomSelectItem, CustomSelectTrigger, CustomSelectValue } from '@/components/ui/custom-select'
import { 
  calculateSalary, 
  formatSalary,
  SalaryCalculationResult
} from '@/lib/salary/calculator'
import { 
  downloadSalaryPDF,
  getSalaryPDFBlob,
  SalaryPDFData
} from '@/lib/salary/pdf-generator'
import { createClient } from '@/lib/supabase/client'

interface Worker {
  id: string
  name: string
  email?: string
  phone?: string
  position?: string
  worker_number?: string
}

interface Site {
  id: string
  name: string
  address?: string
}

interface SalaryStatementProps {
  profile: Profile
  onBack?: () => void
}

export default function SalaryStatement({ profile, onBack }: SalaryStatementProps) {
  const [allWorkers, setAllWorkers] = useState<Worker[]>([])
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [workerSearchTerm, setWorkerSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  
  // Salary calculation inputs
  const [salaryData, setSalaryData] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    startDate: '',
    endDate: '',
    dailyRate: 150000,
    workHours: 8,
    overtimeHours: 0,
    workDays: 22,
    calculationType: 'tax_prepaid' as const,
    taxRate: 3.3,
    bonuses: 0,
    deductions: 0,
    bankName: '',
    accountNumber: '',
    accountHolder: ''
  })
  
  const [calculationResult, setCalculationResult] = useState<SalaryCalculationResult | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  
  const supabase = createClient()
  
  useEffect(() => {
    loadInitialData()
  }, [])
  
  // Filter workers when site selection or search term changes
  useEffect(() => {
    filterWorkers()
  }, [selectedSite, workerSearchTerm, allWorkers])
  
  const filterWorkers = async () => {
    let filtered = [...allWorkers]
    
    // Filter by site if selected
    if (selectedSite) {
      try {
        // Get workers assigned to this site through site_assignments
        const { data: assignments, error } = await supabase
          .from('site_assignments')
          .select('user_id')
          .eq('site_id', selectedSite.id)
          .eq('is_active', true)
        
        if (error) {
          console.error('Error loading site assignments:', error)
        } else {
          const assignedUserIds = assignments?.map(a => a.user_id) || []
          filtered = allWorkers.filter(worker => assignedUserIds.includes(worker.id))
          console.log('Filtered workers by site:', filtered)
        }
      } catch (error) {
        console.error('Failed to filter workers by site:', error)
      }
    }
    
    // Filter by search term
    if (workerSearchTerm.trim()) {
      const searchLower = workerSearchTerm.toLowerCase()
      filtered = filtered.filter(worker => 
        worker.name.toLowerCase().includes(searchLower) ||
        worker.email?.toLowerCase().includes(searchLower) ||
        worker.position?.toLowerCase().includes(searchLower) ||
        worker.worker_number?.toLowerCase().includes(searchLower)
      )
    }
    
    setFilteredWorkers(filtered)
    
    // Clear selected worker if it's not in the filtered list
    if (selectedWorker && !filtered.find(w => w.id === selectedWorker.id)) {
      setSelectedWorker(null)
    }
  }
  
  useEffect(() => {
    // Auto-generate date range when year/month changes
    if (salaryData.year && salaryData.month) {
      const startDate = new Date(salaryData.year, salaryData.month - 1, 1)
      const endDate = new Date(salaryData.year, salaryData.month, 0)
      
      setSalaryData(prev => ({
        ...prev,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      }))
    }
  }, [salaryData.year, salaryData.month])
  
  const loadInitialData = async () => {
    setLoading(true)
    try {
      console.log('🔍 Loading real data from Supabase...')
      
      // Load workers from profiles table
      const { data: workersData, error: workersError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, role, status')
        .in('role', ['worker', 'site_manager', 'customer_manager', 'admin'])
        .neq('status', 'inactive')
        .order('full_name')
      
      console.log('Workers query result:', { data: workersData, error: workersError })
      
      if (workersError) {
        console.error('Error loading workers:', workersError)
        throw workersError
      }
      
      // Transform the data to match our Worker interface
      const transformedWorkers: Worker[] = (workersData || []).map((worker, index) => ({
        id: worker.id,
        name: worker.full_name,
        email: worker.email || undefined,
        phone: worker.phone || undefined,
        position: worker.role === 'worker' ? '작업자' : 
                 worker.role === 'site_manager' ? '현장관리자' : 
                 worker.role === 'customer_manager' ? '파트너사 관리자' :
                 worker.role === 'admin' ? '시스템관리자' :
                 worker.role,
        worker_number: `${worker.role === 'worker' ? 'W' : worker.role === 'site_manager' ? 'M' : worker.role === 'admin' ? 'A' : 'C'}${String(index + 1).padStart(3, '0')}`
      }))
      
      console.log('Transformed workers:', transformedWorkers)
      setAllWorkers(transformedWorkers)
      setFilteredWorkers(transformedWorkers)
      
      // Load sites from sites table
      const { data: sitesData, error: sitesError } = await supabase
        .from('sites')
        .select('id, name, address, status')
        .neq('status', 'inactive')
        .order('name')
      
      console.log('Sites query result:', { data: sitesData, error: sitesError })
      
      if (sitesError) {
        console.error('Error loading sites:', sitesError)
        throw sitesError
      }
      
      // Transform the data to match our Site interface
      const transformedSites: Site[] = (sitesData || []).map(site => ({
        id: site.id,
        name: site.name,
        address: site.address || undefined
      }))
      
      console.log('Transformed sites:', transformedSites)
      setSites(transformedSites)
      
    } catch (error) {
      console.error('Failed to load initial data:', error)
      // Fallback to mock data only if there's a real error
      console.log('🧪 Using fallback mock data due to error')
      
      const mockWorkers: Worker[] = [
        {
          id: 'mock-1',
          name: '김철수 (Mock)',
          email: 'kim@example.com',
          phone: '010-1234-5678',
          position: '작업자',
          worker_number: 'W001'
        },
        {
          id: 'mock-2',
          name: '이영희 (Mock)',
          email: 'lee@example.com',
          phone: '010-2345-6789',
          position: '현장관리자',
          worker_number: 'M001'
        }
      ]
      
      const mockSites: Site[] = [
        {
          id: 'mock-1',
          name: 'A 현장 (Mock)',
          address: '서울특별시 강남구 테헤란로 123'
        },
        {
          id: 'mock-2',
          name: 'B 현장 (Mock)',
          address: '경기도 성남시 분당구 정자로 456'
        }
      ]
      
      setAllWorkers(mockWorkers)
      setFilteredWorkers(mockWorkers)
      setSites(mockSites)
    } finally {
      setLoading(false)
    }
  }
  
  const handleCalculate = () => {
    if (!selectedWorker || !selectedSite) {
      alert('근로자와 현장을 선택해주세요.')
      return
    }
    
    const result = calculateSalary({
      baseAmount: salaryData.dailyRate / 8, // Convert daily rate to hourly
      workHours: salaryData.workHours,
      overtimeHours: salaryData.overtimeHours,
      calculationType: salaryData.calculationType,
      taxRate: salaryData.taxRate,
      bonuses: salaryData.bonuses,
      deductions: salaryData.deductions
    })
    
    setCalculationResult(result)
  }
  
  const handlePreview = () => {
    if (!calculationResult) {
      handleCalculate()
      return
    }
    setPreviewMode(true)
  }
  
  const handleDownloadPDF = async () => {
    if (!selectedWorker || !selectedSite || !calculationResult) {
      alert('계산을 먼저 수행해주세요.')
      return
    }
    
    setGenerating(true)
    try {
      const pdfData: SalaryPDFData = {
        workerName: selectedWorker.name,
        workerNumber: selectedWorker.worker_number,
        position: selectedWorker.position,
        siteName: selectedSite.name,
        siteAddress: selectedSite.address,
        companyName: '이노피앤씨',
        companyRegistrationNumber: '123-45-67890',
        companyAddress: '서울특별시 강남구 테헤란로',
        salaryYear: salaryData.year,
        salaryMonth: salaryData.month,
        workPeriod: {
          startDate: salaryData.startDate,
          endDate: salaryData.endDate
        },
        calculation: calculationResult,
        bankInfo: salaryData.bankName ? {
          bankName: salaryData.bankName,
          accountNumber: salaryData.accountNumber,
          accountHolder: salaryData.accountHolder || selectedWorker.name
        } : undefined,
        issuedDate: new Date().toISOString(),
        issuedBy: profile.name
      }
      
      downloadSalaryPDF(pdfData)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      alert('PDF 생성에 실패했습니다.')
    } finally {
      setGenerating(false)
    }
  }
  
  const handleSiteChange = (siteId: string) => {
    const site = sites.find(s => s.id === siteId)
    setSelectedSite(site || null)
    setSelectedWorker(null) // Clear worker selection when site changes
    setWorkerSearchTerm('') // Clear search term
  }
  
  const handleWorkerSearch = (searchTerm: string) => {
    setWorkerSearchTerm(searchTerm)
  }
  
  const resetForm = () => {
    setSelectedWorker(null)
    setSelectedSite(null)
    setWorkerSearchTerm('')
    setCalculationResult(null)
    setPreviewMode(false)
    setSalaryData(prev => ({
      ...prev,
      dailyRate: 150000,
      workHours: 8,
      overtimeHours: 0,
      bonuses: 0,
      deductions: 0,
      bankName: '',
      accountNumber: '',
      accountHolder: ''
    }))
  }
  
  if (previewMode && calculationResult) {
    return (
      <div className="space-y-6">
        {/* Preview Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPreviewMode(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">급여명세서 미리보기</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedWorker?.name} - {salaryData.year}년 {salaryData.month}월
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={generating}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-md"
            >
              <Download className="h-4 w-4 mr-2" />
              {generating ? 'PDF 생성 중...' : 'PDF 다운로드'}
            </button>
          </div>
        </div>
        
        {/* Preview Content */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow max-w-4xl mx-auto">
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center border-b pb-6">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">급여명세서</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">SALARY STATEMENT</p>
              <p className="text-sm text-gray-500 mt-2">
                {salaryData.year}년 {salaryData.month}월분 | 발행일: {new Date().toLocaleDateString('ko-KR')}
              </p>
            </div>
            
            {/* Worker & Site Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">직원 정보</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">성명:</span> {selectedWorker?.name}</p>
                  {selectedWorker?.worker_number && (
                    <p><span className="font-medium">사번:</span> {selectedWorker.worker_number}</p>
                  )}
                  {selectedWorker?.position && (
                    <p><span className="font-medium">직책:</span> {selectedWorker.position}</p>
                  )}
                  <p><span className="font-medium">현장:</span> {selectedSite?.name}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">급여 기간</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">급여 월:</span> {salaryData.year}년 {salaryData.month}월</p>
                  <p><span className="font-medium">근무 기간:</span> {salaryData.startDate} ~ {salaryData.endDate}</p>
                  <p><span className="font-medium">근무 시간:</span> {calculationResult.details.workHours}시간</p>
                  {calculationResult.details.overtimeHours > 0 && (
                    <p><span className="font-medium">연장 시간:</span> {calculationResult.details.overtimeHours}시간</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Salary Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">급여 상세</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 dark:border-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">항목</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">내용</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">금액</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">기본급</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">
                        {calculationResult.details.workHours}시간 × {formatSalary(calculationResult.details.hourlyRate || 0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                        {formatSalary(calculationResult.basePay)}
                      </td>
                    </tr>
                    
                    {calculationResult.overtimePay > 0 && (
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">연장수당</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">
                          {calculationResult.details.overtimeHours}시간 × {formatSalary(calculationResult.details.overtimeRate || 0)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                          {formatSalary(calculationResult.overtimePay)}
                        </td>
                      </tr>
                    )}
                    
                    {calculationResult.bonuses > 0 && (
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">보너스</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">-</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                          {formatSalary(calculationResult.bonuses)}
                        </td>
                      </tr>
                    )}
                    
                    {calculationResult.deductions > 0 && (
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">공제액</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">-</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                          -{formatSalary(calculationResult.deductions)}
                        </td>
                      </tr>
                    )}
                    
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">소계 (세전)</td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-white">
                        {formatSalary(calculationResult.grossPay)}
                      </td>
                    </tr>
                    
                    {calculationResult.taxAmount > 0 && (
                      <tr>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          세금 ({calculationResult.details.taxRate}%)
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">
                          {calculationResult.calculationType === 'tax_prepaid' ? '3.3% 선취' : ''}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                          -{formatSalary(calculationResult.taxAmount)}
                        </td>
                      </tr>
                    )}
                    
                    <tr className="bg-blue-50 dark:bg-blue-900/20 border-t-2 border-blue-500">
                      <td className="px-4 py-4 text-lg font-bold text-gray-900 dark:text-white">실수령액</td>
                      <td className="px-4 py-4"></td>
                      <td className="px-4 py-4 text-lg text-right font-bold text-blue-600 dark:text-blue-400">
                        {formatSalary(calculationResult.netPay)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Bank Info */}
            {salaryData.bankName && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">계좌 정보</h3>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">은행</p>
                      <p className="font-medium text-gray-900 dark:text-white">{salaryData.bankName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">계좌번호</p>
                      <p className="font-medium text-gray-900 dark:text-white">{salaryData.accountNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">예금주</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {salaryData.accountHolder || selectedWorker?.name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Footer */}
            <div className="border-t pt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              <p>발행자: {profile.name} | 발행일시: {new Date().toLocaleString('ko-KR')}</p>
              <p className="mt-2">본 급여명세서는 기밀문서입니다. 무단 복제 및 배포를 금합니다.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">급여명세서 생성</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              근로자의 급여명세서를 생성하고 PDF로 다운로드할 수 있습니다
            </p>
          </div>
        </div>
        <button
          onClick={resetForm}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          초기화
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">데이터를 불러오는 중...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="space-y-6">
            {/* Site Selection - Moved to top */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">현장 선택</h2>
              </div>
              <CustomSelect value={selectedSite?.id || 'none'} onValueChange={(value) => handleSiteChange(value === 'none' ? '' : value)}>
                <CustomSelectTrigger className="w-full">
                  <CustomSelectValue placeholder="현장을 선택하세요" />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  <CustomSelectItem value="none">현장을 선택하세요</CustomSelectItem>
                  {sites.map((site) => (
                    <CustomSelectItem key={site.id} value={site.id}>
                      {site.name}
                    </CustomSelectItem>
                  ))}
                </CustomSelectContent>
              </CustomSelect>
              {selectedSite && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  📍 {selectedSite.address || '주소 정보 없음'}
                </p>
              )}
            </div>
            
            {/* Worker Selection with Search */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  근로자 선택 
                  {selectedSite ? `(${selectedSite.name} 할당자)` : ''}
                </h2>
              </div>
              
              {/* Search Input */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="근로자 이름, 이메일, 직책 또는 사번으로 검색..."
                  value={workerSearchTerm}
                  onChange={(e) => handleWorkerSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
              
              {/* Worker Select */}
              <CustomSelect 
                value={selectedWorker?.id || 'none'} 
                onValueChange={(value) => {
                  if (value === 'none') {
                    setSelectedWorker(null)
                  } else {
                    const worker = filteredWorkers.find(w => w.id === value)
                    setSelectedWorker(worker || null)
                  }
                }}
                disabled={filteredWorkers.length === 0}
              >
                <CustomSelectTrigger className="w-full">
                  <CustomSelectValue 
                    placeholder={
                      filteredWorkers.length === 0 
                        ? (selectedSite ? '해당 현장에 할당된 근로자가 없습니다' : '근로자를 검색하거나 현장을 선택하세요')
                        : '궼로자를 선택하세요'
                    } 
                  />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  <CustomSelectItem value="none">
                    {filteredWorkers.length === 0 
                      ? (selectedSite ? '해당 현장에 할당된 근로자가 없습니다' : '근로자를 검색하거나 현장을 선택하세요')
                      : '근로자를 선택하세요'
                    }
                  </CustomSelectItem>
                  {filteredWorkers.map((worker) => (
                    <CustomSelectItem key={worker.id} value={worker.id}>
                      {worker.name} ({worker.position}) - {worker.worker_number}
                    </CustomSelectItem>
                  ))}
                </CustomSelectContent>
              </CustomSelect>
              
              {filteredWorkers.length > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {filteredWorkers.length}명의 근로자가 검색되었습니다
                </p>
              )}
              
              {selectedWorker && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>{selectedWorker.name}</strong> ({selectedWorker.position})
                    {selectedWorker.email && ` • ${selectedWorker.email}`}
                    {selectedWorker.phone && ` • ${selectedWorker.phone}`}
                  </p>
                </div>
              )}
            </div>
            
            {/* Salary Period */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">급여 기간</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    급여년도
                  </label>
                  <input
                    type="number"
                    value={salaryData.year}
                    onChange={(e) => setSalaryData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    급여월
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={salaryData.month}
                    onChange={(e) => setSalaryData(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
            
            {/* Salary Details */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">급여 정보</h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      일급
                    </label>
                    <input
                      type="number"
                      value={salaryData.dailyRate}
                      onChange={(e) => setSalaryData(prev => ({ ...prev, dailyRate: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      근무시간
                    </label>
                    <input
                      type="number"
                      value={salaryData.workHours}
                      onChange={(e) => setSalaryData(prev => ({ ...prev, workHours: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      연장시간
                    </label>
                    <input
                      type="number"
                      value={salaryData.overtimeHours}
                      onChange={(e) => setSalaryData(prev => ({ ...prev, overtimeHours: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      세금계산방식
                    </label>
                    <CustomSelect value={salaryData.calculationType || 'tax_prepaid'} onValueChange={(value: any) => setSalaryData(prev => ({ ...prev, calculationType: value }))}>
                      <CustomSelectTrigger className="w-full">
                        <CustomSelectValue placeholder="세금계산방식 선택" />
                      </CustomSelectTrigger>
                      <CustomSelectContent>
                        <CustomSelectItem value="tax_prepaid">3.3% 선취</CustomSelectItem>
                        <CustomSelectItem value="normal">일반계산</CustomSelectItem>
                      </CustomSelectContent>
                    </CustomSelect>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      보너스
                    </label>
                    <input
                      type="number"
                      value={salaryData.bonuses}
                      onChange={(e) => setSalaryData(prev => ({ ...prev, bonuses: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      공제액
                    </label>
                    <input
                      type="number"
                      value={salaryData.deductions}
                      onChange={(e) => setSalaryData(prev => ({ ...prev, deductions: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bank Information */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">계좌 정보 (선택)</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    은행명
                  </label>
                  <input
                    type="text"
                    value={salaryData.bankName}
                    onChange={(e) => setSalaryData(prev => ({ ...prev, bankName: e.target.value }))}
                    placeholder="예: 국민은행"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    계좌번호
                  </label>
                  <input
                    type="text"
                    value={salaryData.accountNumber}
                    onChange={(e) => setSalaryData(prev => ({ ...prev, accountNumber: e.target.value }))}
                    placeholder="예: 123456-78-901234"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    예금주
                  </label>
                  <input
                    type="text"
                    value={salaryData.accountHolder}
                    onChange={(e) => setSalaryData(prev => ({ ...prev, accountHolder: e.target.value }))}
                    placeholder={selectedWorker?.name || "예금주 이름"}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Preview & Actions */}
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleCalculate}
                  disabled={!selectedWorker || !selectedSite}
                  className="inline-flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-md transition-colors"
                >
                  <Calculator className="h-5 w-5 mr-2" />
                  급여 계산
                </button>
                
                <button
                  onClick={handlePreview}
                  disabled={!calculationResult}
                  className="inline-flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <Eye className="h-5 w-5 mr-2" />
                  미리보기
                </button>
                
                <button
                  onClick={handleDownloadPDF}
                  disabled={!calculationResult || generating}
                  className="inline-flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-md transition-colors"
                >
                  <Download className="h-5 w-5 mr-2" />
                  {generating ? 'PDF 생성 중...' : 'PDF 다운로드'}
                </button>
              </div>
            </div>
            
            {/* Calculation Result */}
            {calculationResult && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center gap-2 mb-4">
                  <Receipt className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">계산 결과</h2>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">기본급:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatSalary(calculationResult.basePay)}</span>
                  </div>
                  
                  {calculationResult.overtimePay > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">연장수당:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatSalary(calculationResult.overtimePay)}</span>
                    </div>
                  )}
                  
                  {calculationResult.bonuses > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">보너스:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatSalary(calculationResult.bonuses)}</span>
                    </div>
                  )}
                  
                  {calculationResult.deductions > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">공제액:</span>
                      <span className="font-medium text-red-600">-{formatSalary(calculationResult.deductions)}</span>
                    </div>
                  )}
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">소계 (세전):</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{formatSalary(calculationResult.grossPay)}</span>
                    </div>
                  </div>
                  
                  {calculationResult.taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">세금 ({calculationResult.details.taxRate}%):</span>
                      <span className="font-medium text-red-600">-{formatSalary(calculationResult.taxAmount)}</span>
                    </div>
                  )}
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">실수령액:</span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatSalary(calculationResult.netPay)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Selected Info Summary */}
            {(selectedWorker || selectedSite) && (
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">선택된 정보</h3>
                <div className="space-y-2 text-sm">
                  {selectedWorker && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">근로자:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedWorker.name}</span>
                    </div>
                  )}
                  {selectedSite && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">현장:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedSite.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">기간:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {salaryData.year}년 {salaryData.month}월
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}