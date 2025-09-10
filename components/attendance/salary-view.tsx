'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { 
  ChevronLeft,
  ChevronRight,
  DollarSign,
  FileText,
  Calculator,
  TrendingUp,
  Download,
  Calendar
} from 'lucide-react'
import { getSalaryInfo, calculateMonthlySalary } from '@/app/actions/salary'
import { getUserSiteHistory } from '@/app/actions/site-info'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useFontSize } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { useSalaryRealtime } from '@/hooks/useSalaryRealtime'
import { payslipGenerator } from '@/lib/services/payslip-generator'
import type { Profile, UserSiteHistory } from '@/types'

interface SalaryViewProps {
  profile: Profile & { salary_type?: string }
}

interface SalaryInfo {
  id: string
  user_id: string
  base_salary: number
  hourly_rate: number
  overtime_rate: number
  effective_date: string
}

interface MonthlySalaryCalculation {
  base_salary: number
  hourly_rate: number
  overtime_rate: number
  total_work_hours: number
  total_overtime_hours: number
  total_labor_hours: number
  regular_pay: number
  overtime_pay: number
  bonus_pay: number
  total_gross_pay: number
  tax_deduction: number
  national_pension: number
  health_insurance: number
  employment_insurance: number
  total_deductions: number
  net_pay: number
  work_days: number
}

interface DateRangeOption {
  value: string
  label: string
  getMonthsBack: () => number
}

export function SalaryView({ profile }: SalaryViewProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  
  // State
  const [currentDate, setCurrentDate] = useState(new Date())
  const [salaryInfo, setSalaryInfo] = useState<SalaryInfo | null>(null)
  const [monthlyCalculation, setMonthlyCalculation] = useState<MonthlySalaryCalculation | null>(null)
  const [monthlyHistoryList, setMonthlyHistoryList] = useState<any[]>([])
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [selectedDateRange, setSelectedDateRange] = useState<string>('최근3개월')
  const [selectedMonthDetails, setSelectedMonthDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [siteHistory, setSiteHistory] = useState<UserSiteHistory[]>([])
  
  // 실시간 업데이트 훅 사용
  const { refreshSalary } = useSalaryRealtime({ 
    userId: profile?.id,
    enabled: !!profile?.id 
  })
  
  // Memoized date range options
  const dateRangeOptions: DateRangeOption[] = useMemo(() => [
    { value: '금월', label: '금월', getMonthsBack: () => 1 },
    { value: '최근3개월', label: '최근3개월', getMonthsBack: () => 3 },
    { value: '최근6개월', label: '최근6개월', getMonthsBack: () => 6 },
    { value: '최근12개월', label: '최근12개월', getMonthsBack: () => 12 },
    { value: '최근24개월', label: '최근24개월', getMonthsBack: () => 24 }
  ], [])

  // Load sites and initial data
  useEffect(() => {
    if (profile?.id) {
      loadSiteHistory()
      loadSalaryHistoryList()
    }
  }, [profile?.id, selectedSite, selectedDateRange])

  // 실시간 업데이트 감지 시 데이터 새로고침
  useEffect(() => {
    const handleSalaryUpdate = () => {
      loadSalaryHistoryList()
      if (selectedMonthDetails) {
        loadSalaryData()
      }
    }

    // 급여 데이터가 변경되면 자동으로 새로고침
    const interval = setInterval(() => {
      refreshSalary()
    }, 60000) // 1분마다 체크 (실시간 구독이 끊어진 경우 대비)

    return () => clearInterval(interval)
  }, [selectedMonthDetails, refreshSalary])

  const loadSiteHistory = useCallback(async () => {
    try {
      console.log('[SalaryView] Fetching site history')
      const result = await getUserSiteHistory()
      if (result.success && result.data) {
        setSiteHistory(result.data)
      }
    } catch (error) {
      console.error('Failed to load site history:', error)
      setSiteHistory([])
    }
  }, [])

  const loadSalaryHistoryList = useCallback(async () => {
    if (!profile?.id) return
    
    setLoading(true)
    try {
      // Get the number of months to load based on selected date range
      const selectedOption = dateRangeOptions.find(opt => opt.value === selectedDateRange)
      const monthsToLoad = selectedOption?.getMonthsBack() || 6
      
      const historyList = []
      const currentDate = new Date()
      const salaryPromises = []
      
      // Parallel API calls instead of sequential for better performance
      for (let i = 0; i < monthsToLoad; i++) {
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
        const year = targetDate.getFullYear()
        const month = targetDate.getMonth() + 1
        
        salaryPromises.push(
          calculateMonthlySalary({
            user_id: profile.id,
            year: year,
            month: month
          }).then(calcResult => ({ calcResult, year, month, index: i }))
        )
      }
      
      console.log('[SalaryView] Fetching salary data in parallel:', salaryPromises.length, 'requests')
      const results = await Promise.all(salaryPromises)
      
      // Process results in order
      for (const { calcResult, year, month, index } of results) {
        if (calcResult.success && calcResult.data) {
          const data = calcResult.data
          const monthStr = `${month.toString().padStart(2, '0')}월`
          
          // Determine site name based on selection
          let siteName = selectedSite === 'all' ? 
            '전체' : 
            (siteHistory.find(s => s.site_id === selectedSite)?.site_name || '미상')
          
          // Remove '현장' suffix for shorter display
          if (siteName !== '전체' && siteName !== '미상') {
            siteName = siteName.replace(/\s*[A-Z]?현장\s*$/g, '').trim()
          }
          
          const historyItem = {
            month: monthStr,
            site: siteName,
            workDays: data.work_days,
            totalLaborHours: data.total_labor_hours,
            basicPay: data.base_salary,
            overtimePay: data.overtime_pay,
            allowance: data.bonus_pay,
            deductions: data.total_deductions,
            netPay: data.net_pay,
            status: index === 0 ? 'pending' : 'paid', // Current month is pending, others are paid
            year: year,
            monthNum: month,
            fullData: data // Store full calculation data
          }
          
          historyList.push(historyItem)
        }
      }
      
      // Sort by year/month descending
      historyList.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.monthNum - a.monthNum
      })
      
      setMonthlyHistoryList(historyList)
      
    } catch (error) {
      console.error('Failed to load salary history:', error)
      // Fallback to empty list on error
      setMonthlyHistoryList([])
    } finally {
      setLoading(false)
    }
  }, [profile?.id, selectedSite, selectedDateRange, siteHistory, dateRangeOptions])

  const loadSalaryData = async () => {
    if (!profile?.id) return
    
    setLoading(true)
    try {
      // Get salary info
      const salaryResult = await getSalaryInfo({ 
        user_id: profile.id,
        date: format(currentDate, 'yyyy-MM-dd')
      })

      if (salaryResult.success && salaryResult.data) {
        setSalaryInfo(salaryResult.data)
      }

      // Calculate monthly salary
      const calcResult = await calculateMonthlySalary({
        user_id: profile.id,
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1
      })

      if (calcResult.success && calcResult.data) {
        setMonthlyCalculation(calcResult.data)
      }
    } catch (error) {
      console.error('Failed to load salary data:', error)
    } finally {
      setLoading(false)
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
      return newDate
    })
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ko-KR') + '원'
  }

  const handleRowClick = (salaryItem: any) => {
    // Set the selected month details and load full calculation data
    setSelectedMonthDetails(salaryItem.fullData)
  }

  const handleDownloadPDF = async (salaryItem: any) => {
    try {
      // 급여명세서가 생성 가능한지 확인
      if (!salaryItem.fullData || !salaryItem.year || !salaryItem.monthNum) {
        alert('급여명세서가 아직 생성되지 않았습니다. 급여 처리가 완료된 후 다시 시도해주세요.');
        return;
      }

      // 통합 PDF 생성 서비스 사용
      // 월의 마지막 날 계산
      const lastDayOfMonth = new Date(salaryItem.year, salaryItem.monthNum, 0).getDate();
      
      const payslipData = {
        employee: {
          id: profile.id,
          name: profile.full_name || '',
          email: profile.email || '',
          role: profile.role || 'worker'
        },
        company: {
          name: 'INOPNC',
          address: '서울특별시 강남구',
          phone: '02-1234-5678',
          registrationNumber: '123-45-67890'
        },
        site: {
          id: salaryItem.siteId || '',
          name: salaryItem.site || ''
        },
        salary: {
          // fullData가 있으면 사용, 없으면 기본값 사용
          ...(salaryItem.fullData ? salaryItem.fullData : {
            base_pay: salaryItem.basicPay || 0,
            base_salary: salaryItem.basicPay || 0,
            overtime_pay: salaryItem.overtimePay || 0,
            bonus_pay: salaryItem.allowance || 0,
            total_gross_pay: (salaryItem.basicPay || 0) + (salaryItem.overtimePay || 0) + (salaryItem.allowance || 0),
            total_deductions: salaryItem.deductions || 0,
            net_pay: salaryItem.netPay || 0,
            work_days: salaryItem.workDays || 0,
            total_labor_hours: salaryItem.totalLaborHours || 0,
            total_work_hours: salaryItem.totalLaborHours || 0,
            total_overtime_hours: 0,
            tax_deduction: 0,
            national_pension: 0,
            health_insurance: 0,
            employment_insurance: 0,
            hourly_rate: 0,
            overtime_rate: 0,
            regular_pay: salaryItem.basicPay || 0
          }),
          // period_start와 period_end는 항상 올바른 형식으로 생성
          period_start: salaryItem.fullData?.period_start || 
                        `${salaryItem.year}-${salaryItem.monthNum.toString().padStart(2, '0')}-01`,
          period_end: salaryItem.fullData?.period_end || 
                      `${salaryItem.year}-${salaryItem.monthNum.toString().padStart(2, '0')}-${lastDayOfMonth.toString().padStart(2, '0')}`
        },
        paymentDate: new Date(),
        paymentMethod: '계좌이체'
      }

      const pdfBlob = await payslipGenerator.generatePDF(payslipData)
      
      // Blob을 다운로드
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `급여명세서_${salaryItem.year}-${salaryItem.monthNum.toString().padStart(2, '0')}.pdf`
      link.click()
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('PDF download error:', error)
      alert('PDF 다운로드 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="space-y-2">
      {/* Site Selection Dropdown - Consistent with 출력정보 screen */}
      <div className="mb-3">
        <CustomSelect value={selectedSite} onValueChange={setSelectedSite}>
          <CustomSelectTrigger className={cn(
            "w-full justify-between text-left",
            touchMode === 'glove' ? 'min-h-[60px]' : 
              touchMode === 'precision' ? 'min-h-[44px]' : 
              'min-h-[48px]',
            isLargeFont ? 'text-base' : 'text-sm'
          )}>
            <CustomSelectValue>
              {selectedSite === 'all' ? '전체 현장' : siteHistory.find(s => s.site_id === selectedSite)?.site_name || '현장을 선택하세요'}
            </CustomSelectValue>
          </CustomSelectTrigger>
            <CustomSelectContent>
              <CustomSelectItem value="all">
                전체 현장
              </CustomSelectItem>
              {siteHistory.map(site => (
                <CustomSelectItem key={site.site_id} value={site.site_id}>
                  <div className="flex items-center gap-2 w-full">
                    <span className="flex-1 truncate">{site.site_name}</span>
                    {site.is_active && (
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs dark:bg-green-900/20 dark:text-green-400">
                        현재
                      </span>
                    )}
                  </div>
                </CustomSelectItem>
              ))}
            </CustomSelectContent>
        </CustomSelect>
      </div>

      {/* Date Range Selection Dropdown */}
      <div className="mb-3">
        <CustomSelect value={selectedDateRange} onValueChange={setSelectedDateRange}>
          <CustomSelectTrigger className={cn(
            "w-full justify-between text-left",
            touchMode === 'glove' ? 'min-h-[60px]' : 
              touchMode === 'precision' ? 'min-h-[44px]' : 
              'min-h-[48px]',
            isLargeFont ? 'text-base' : 'text-sm'
          )}>
            <CustomSelectValue>
              {selectedDateRange}
            </CustomSelectValue>
          </CustomSelectTrigger>
          <CustomSelectContent>
            {dateRangeOptions.map(option => (
              <CustomSelectItem key={option.value} value={option.value}>
                {option.label}
              </CustomSelectItem>
            ))}
          </CustomSelectContent>
        </CustomSelect>
      </div>

      {/* Simple Salary Table - Exactly like Image 1 */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 border-b">
          <div className="grid grid-cols-6 gap-1 font-medium text-gray-700 dark:text-gray-300 text-xs">
            <div className="whitespace-nowrap">월</div>
            <div className="whitespace-nowrap">현장</div>
            <div className="text-center whitespace-nowrap">총 공수</div>
            <div className="text-right whitespace-nowrap">기본급</div>
            <div className="text-right whitespace-nowrap">실지급</div>
            <div className="text-center whitespace-nowrap">PDF</div>
          </div>
        </div>
        
        {/* Table Body */}
        <div className="divide-y divide-gray-200 dark:divide-gray-600">
          {loading ? (
            <div className="px-3 py-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">급여 데이터를 불러오는 중...</p>
            </div>
          ) : monthlyHistoryList.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">급여 데이터가 없습니다.</p>
            </div>
          ) : (
            monthlyHistoryList.map((salary, index) => (
              <div 
                key={index}
                className={cn(
                  "px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors",
                  selectedMonthDetails === salary.fullData && "bg-blue-50 dark:bg-blue-900/20"
                )}
                onClick={() => handleRowClick(salary)}
              >
                <div className="grid grid-cols-6 gap-1 items-center text-xs">
                  <div className="font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">{salary.month}</div>
                  <div className="text-gray-600 dark:text-gray-400 whitespace-nowrap truncate">{salary.site}</div>
                  <div className="text-center whitespace-nowrap">{salary.totalLaborHours?.toFixed(1) || '0.0'}</div>
                  <div className="text-right whitespace-nowrap">{Math.floor(salary.basicPay / 10000)}만</div>
                  <div className="text-right font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                    {Math.floor(salary.netPay / 10000)}만
                  </div>
                  <div className="text-center">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="p-1 h-6 w-6 rounded hover:bg-blue-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadPDF(salary);
                      }}
                    >
                      <Download className="h-3 w-3 text-blue-600" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Usage Guide Message */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3">
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">i</span>
            </div>
          </div>
          <div className="text-xs text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">💡 사용 안내</p>
            <p>• 각 월을 클릭하시면 상세 급여내역과 계산과정을 확인할 수 있습니다</p>
            <p>• PDF 버튼을 클릭하면 급여명세서를 다운로드할 수 있습니다</p>
          </div>
        </div>
      </div>

      {/* Selected Month Details - Exactly like Image 1 */}
      {selectedMonthDetails && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <div className="mb-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              선택된 급여내역 ({monthlyHistoryList.find(m => m.fullData === selectedMonthDetails)?.year}-{monthlyHistoryList.find(m => m.fullData === selectedMonthDetails)?.monthNum.toString().padStart(2, '0')})
            </span>
          </div>
          
          {/* Two Column Layout - Optimized for Mobile */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Left Column */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">기본급</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap text-right">
                  ₩{selectedMonthDetails.base_salary.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">급여방식</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap text-right">
                  {profile.salary_type || '일용직'}
                </span>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">공제액</span>
                <span className="text-sm font-bold text-red-600 whitespace-nowrap text-right">
                  -₩{selectedMonthDetails.total_deductions.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">실지급액</span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap text-right">
                  ₩{selectedMonthDetails.net_pay.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">세율</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap text-right">
                  {selectedMonthDetails.total_gross_pay > 0 ? 
                    ((selectedMonthDetails.total_deductions / selectedMonthDetails.total_gross_pay) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Salary Calculation - Exactly like Image 1 */}
      {selectedMonthDetails && (
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center">
              <Calculator className="h-4 w-4 text-orange-600" />
            </div>
            <h4 className="font-bold text-gray-900 dark:text-gray-100">급여 계산식</h4>
          </div>

          {/* Total Amount */}
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-3">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700 dark:text-gray-300">총 지급액</span>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                ₩{selectedMonthDetails.total_gross_pay.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Calculation Process */}
          <div className="space-y-2 mb-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">계산과정:</div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">기본급</span>
              <span className="text-sm font-medium">{Math.floor(selectedMonthDetails.base_salary / 10000)}만원</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span className="text-sm">- 공제액</span>
              <span className="text-sm font-medium">{Math.floor(selectedMonthDetails.total_deductions / 10000)}만원</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-blue-600">
              <span className="text-sm">= 실지급액</span>
              <span className="text-sm">{Math.floor(selectedMonthDetails.net_pay / 10000)}만원</span>
            </div>
          </div>

          {/* 공수 기준 정보 */}
          <div className="border-t pt-3">
            <div className="text-sm font-medium text-orange-600 mb-2">공수 기준:</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">총 공수</span>
                <span className="text-sm font-medium">{selectedMonthDetails.total_labor_hours?.toFixed(1) || '0.0'}공수</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">근무 날짜수</span>
                <span className="text-sm font-medium">{selectedMonthDetails.work_days}일</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">일당(공수당단가)</span>
                <span className="text-sm font-medium">
                  {selectedMonthDetails.total_labor_hours > 0 ? Math.floor((selectedMonthDetails.net_pay / selectedMonthDetails.total_labor_hours) / 1000) : 0}천원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">시급 평균 (8시간=1공수)</span>
                <span className="text-sm font-medium">
                  {selectedMonthDetails.total_labor_hours > 0 ? Math.floor((selectedMonthDetails.net_pay / selectedMonthDetails.total_labor_hours / 8) / 100) : 0}백원
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

    </div>
  )
}