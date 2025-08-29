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
import type { Profile, UserSiteHistory } from '@/types'

interface SalaryViewProps {
  profile: Profile
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
  
  // Performance optimizations: Caching system
  const [salaryCache, setSalaryCache] = useState<Map<string, { data: any, timestamp: number }>>(new Map())
  const [siteHistoryCache, setSiteHistoryCache] = useState<{ data: UserSiteHistory[], timestamp: number } | null>(null)
  
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

  const loadSiteHistory = useCallback(async () => {
    const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes for site history
    
    // Use cached data if available and not expired
    if (siteHistoryCache && (Date.now() - siteHistoryCache.timestamp < CACHE_DURATION)) {
      console.log('[SalaryView] Using cached site history')
      setSiteHistory(siteHistoryCache.data)
      return
    }
    
    try {
      console.log('[SalaryView] Fetching site history')
      const result = await getUserSiteHistory()
      if (result.success && result.data) {
        const data = result.data
        setSiteHistory(data)
        setSiteHistoryCache({ data, timestamp: Date.now() })
      }
    } catch (error) {
      console.error('Failed to load site history:', error)
      setSiteHistory([])
    }
  }, [siteHistoryCache])

  const loadSalaryHistoryList = useCallback(async () => {
    if (!profile?.id) return
    
    const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes for salary data
    const cacheKey = `${profile.id}-${selectedSite}-${selectedDateRange}`
    
    // Use cached data if available and not expired
    const cached = salaryCache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      console.log('[SalaryView] Using cached salary data for:', cacheKey)
      setMonthlyHistoryList(cached.data)
      return
    }
    
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
      
      // Cache the results
      setSalaryCache(prev => new Map(prev.set(cacheKey, { 
        data: historyList, 
        timestamp: Date.now() 
      })))
      
    } catch (error) {
      console.error('Failed to load salary history:', error)
      // Fallback to empty list on error
      setMonthlyHistoryList([])
    } finally {
      setLoading(false)
    }
  }, [profile?.id, selectedSite, selectedDateRange, siteHistory, salaryCache, dateRangeOptions])

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
      // Using existing PDF functionality - create a salary statement
      const { jsPDF } = await import('jspdf')
      
      const doc = new jsPDF()
      
      // Set font
      doc.setFont('helvetica')
      
      // Title
      doc.setFontSize(18)
      doc.text('급여명세서', 105, 20, { align: 'center' })
      
      // Employee info
      doc.setFontSize(12)
      doc.text(`성명: ${profile.full_name || ''}`, 20, 40)
      doc.text(`지급월: ${salaryItem.year}-${salaryItem.monthNum.toString().padStart(2, '0')}`, 20, 50)
      doc.text(`현장: ${salaryItem.site}`, 20, 60)
      
      // Salary details
      doc.text('지급내역', 20, 80)
      doc.setFontSize(10)
      doc.text(`기본급: ${salaryItem.basicPay.toLocaleString()}원`, 30, 90)
      doc.text(`연장수당: ${salaryItem.overtimePay.toLocaleString()}원`, 30, 100)
      doc.text(`제수당: ${salaryItem.allowance.toLocaleString()}원`, 30, 110)
      
      doc.text('공제내역', 20, 130)
      doc.text(`총공제액: ${salaryItem.deductions.toLocaleString()}원`, 30, 140)
      
      doc.setFontSize(12)
      doc.text(`실지급액: ${salaryItem.netPay.toLocaleString()}원`, 20, 160)
      
      // Save PDF
      const fileName = `급여명세서_${salaryItem.year}-${salaryItem.monthNum.toString().padStart(2, '0')}.pdf`
      doc.save(fileName)
      
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
          <div className="grid grid-cols-7 gap-1 font-medium text-gray-700 dark:text-gray-300 text-xs">
            <div className="whitespace-nowrap">월</div>
            <div className="whitespace-nowrap">현장</div>
            <div className="text-center whitespace-nowrap">근무일</div>
            <div className="text-right whitespace-nowrap">기본</div>
            <div className="text-right whitespace-nowrap">연장</div>
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
                <div className="grid grid-cols-7 gap-1 items-center text-xs">
                  <div className="font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">{salary.month}</div>
                  <div className="text-gray-600 dark:text-gray-400 whitespace-nowrap truncate">{salary.site}</div>
                  <div className="text-center whitespace-nowrap">{salary.workDays}일</div>
                  <div className="text-right whitespace-nowrap">{Math.floor(salary.basicPay / 10000)}만</div>
                  <div className="text-right whitespace-nowrap">{Math.floor(salary.overtimePay / 10000)}만</div>
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
                <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">연장수당</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap text-right">
                  ₩{selectedMonthDetails.overtime_pay.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">제수당</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap text-right">
                  ₩{selectedMonthDetails.bonus_pay.toLocaleString()}
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
            <div className="flex justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">+ 연장수당</span>
              <span className="text-sm font-medium">{Math.floor(selectedMonthDetails.overtime_pay / 10000)}만원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">+ 제수당</span>
              <span className="text-sm font-medium">{Math.floor(selectedMonthDetails.bonus_pay / 10000)}만원</span>
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

          {/* Work Days Info */}
          <div className="border-t pt-3">
            <div className="text-sm font-medium text-orange-600 mb-2">근무일 기준:</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">총 근무일</span>
                <span className="text-sm font-medium">{selectedMonthDetails.work_days}일</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">일당 평균</span>
                <span className="text-sm font-medium">
                  {selectedMonthDetails.work_days > 0 ? Math.floor((selectedMonthDetails.net_pay / selectedMonthDetails.work_days) / 1000) : 0}천원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">시급 평균 (8시간 기준)</span>
                <span className="text-sm font-medium">
                  {selectedMonthDetails.total_work_hours > 0 ? Math.floor((selectedMonthDetails.net_pay / selectedMonthDetails.total_work_hours) / 100) : 0}백원
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

    </div>
  )
}