'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp,
  ChevronDown,
  Download,
  Building2
} from 'lucide-react'
import jsPDF from 'jspdf'
import { SortableTable, useSortableData, type SortConfig } from '@/components/ui/sortable-table'
import { 
  CustomSelect,
  CustomSelectContent, 
  CustomSelectItem, 
  CustomSelectTrigger, 
  CustomSelectValue 
} from '@/components/ui/custom-select'

interface AttendanceTabProps {
  profile: Profile
}

interface AttendanceRecord {
  id: string
  work_date: string
  check_in_time?: string
  check_out_time?: string
  site_name: string
  status: 'present' | 'absent' | 'late' | 'half_day'
  hours_worked?: number
  overtime_hours?: number
  labor_hours?: number  // 공수 (1.0 = 8 hours)
  notes?: string
}

interface SalaryInfo {
  id: string
  month: string
  basic_salary: number
  overtime_pay: number
  allowances: number
  deductions: number
  total_pay: number
  work_days: number  // 실제 근무 날짜 수
  total_labor_hours: number  // 총 공수
  site_name: string
}

interface Site {
  id: string
  name: string
  address: string
}

export default function AttendanceTab({ profile }: AttendanceTabProps) {
  // All hooks must be called before any conditional returns
  const [activeTab, setActiveTab] = useState<'print' | 'salary'>('print')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([])
  const [salaryInfo, setSalaryInfo] = useState<SalaryInfo[]>([])
  const [filteredSalaryInfo, setFilteredSalaryInfo] = useState<SalaryInfo[]>([])
  const [selectedSalaryMonth, setSelectedSalaryMonth] = useState<string>('')
  const [salaryFilter, setSalaryFilter] = useState<{period: string, sort: {key: keyof SalaryInfo | null, direction: 'asc' | 'desc'}}>({
    period: 'recent3', // recent3, recent6, recent12, all
    sort: {key: null, direction: 'asc'}
  })
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<{key: 'work_date' | 'site_name' | 'labor_hours', direction: 'asc' | 'desc'} | null>(null)
  
  const supabase = createClient()

  // Calendar state - 현재 월로 초기화
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  useEffect(() => {
    loadData()
  }, [selectedDate, selectedSite, activeTab])

  // 월 변경 시 데이터 필터링
  useEffect(() => {
    filterRecordsByMonth()
  }, [attendanceRecords, currentMonth, selectedDate])

  // 급여 데이터 필터링
  useEffect(() => {
    filterSalaryData()
  }, [salaryInfo, salaryFilter])

  // Early return if no profile (after all hooks)
  if (!profile?.id) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">프로필 정보를 불러올 수 없습니다.</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">페이지를 새로고침해 주세요.</p>
        </div>
      </div>
    )
  }

  const filterRecordsByMonth = () => {
    if (selectedDate) {
      // 특정 날짜가 선택된 경우 - 해당 날짜만 표시
      const filtered = attendanceRecords.filter(record => 
        new Date(record.work_date).toDateString() === selectedDate.toDateString()
      )
      setFilteredRecords(filtered)
    } else {
      // 월별 필터링 - 선택된 월의 모든 데이터 표시
      const currentYear = currentMonth.getFullYear()
      const currentMonthNum = currentMonth.getMonth() // 0-11 (JS Date months)
      
      const filtered = attendanceRecords.filter(record => {
        const recordDate = new Date(record.work_date)
        return recordDate.getFullYear() === currentYear && recordDate.getMonth() === currentMonthNum
      })
      setFilteredRecords(filtered)
    }
  }

  const filterSalaryData = () => {
    let filtered = [...salaryInfo]
    
    // 기간 필터링
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    
    switch (salaryFilter.period) {
      case 'recent3':
        filtered = filtered.filter(item => {
          const [year, month] = item.month.split('-').map(Number)
          const monthDiff = (currentYear - year) * 12 + (currentMonth - month)
          return monthDiff >= 0 && monthDiff <= 2
        })
        break
      case 'recent6':
        filtered = filtered.filter(item => {
          const [year, month] = item.month.split('-').map(Number)
          const monthDiff = (currentYear - year) * 12 + (currentMonth - month)
          return monthDiff >= 0 && monthDiff <= 5
        })
        break
      case 'recent12':
        filtered = filtered.filter(item => {
          const [year, month] = item.month.split('-').map(Number)
          const monthDiff = (currentYear - year) * 12 + (currentMonth - month)
          return monthDiff >= 0 && monthDiff <= 11
        })
        break
      // 'all'의 경우 모든 데이터 표시
    }
    
    // 정렬
    if (salaryFilter.sort.key) {
      filtered.sort((a, b) => {
        const key = salaryFilter.sort.key!
        let aValue = a[key]
        let bValue = b[key]
        
        // 숫자 정렬을 위한 처리
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return salaryFilter.sort.direction === 'asc' ? aValue - bValue : bValue - aValue
        }
        
        // 문자열 정렬
        const aStr = String(aValue)
        const bStr = String(bValue)
        
        if (salaryFilter.sort.direction === 'asc') {
          return aStr.localeCompare(bStr)
        } else {
          return bStr.localeCompare(aStr)
        }
      })
    }
    
    setFilteredSalaryInfo(filtered)
  }

  const handleSalarySort = (key: keyof SalaryInfo) => {
    setSalaryFilter(prev => ({
      ...prev,
      sort: {
        key,
        direction: prev.sort.key === key && prev.sort.direction === 'asc' ? 'desc' : 'asc'
      }
    }))
  }

  const getSalaryIcon = (key: keyof SalaryInfo) => {
    if (!salaryFilter.sort.key || salaryFilter.sort.key !== key) {
      return <ChevronUp className="h-3 w-3 text-gray-400" />
    }
    return salaryFilter.sort.direction === 'asc' 
      ? <ChevronUp className="h-3 w-3 text-blue-600" />
      : <ChevronDown className="h-3 w-3 text-blue-600" />
  }

  const loadData = async () => {
    if (!profile?.id) {
      console.error('❌ AttendanceTab: No profile ID available')
      setError('프로필 정보가 없습니다')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      // Check and refresh session if needed (like WorkLogsTab)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      // console.log('[AttendanceTab] Session check:', {
      //   hasSession: !!session,
      //   sessionError: sessionError?.message,
      //   userId: session?.user?.id,
      //   profileId: profile.id
      // })

      if (!session) {
        console.warn('[AttendanceTab] No session found, trying to refresh session...')
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
        
        // console.log('[AttendanceTab] Session refresh result:', {
        //   success: !refreshError,
        //   hasSession: !!refreshData.session,
        //   error: refreshError?.message
        // })
        
        if (refreshError || !refreshData.session) {
          console.error('[AttendanceTab] Could not establish session, queries may fail')
        }
      }
      
      // Load sites first
      await loadSites()
      
      // Then load tab-specific data
      if (activeTab === 'print') {
        await loadAttendanceData()
      } else {
        await loadSalaryData()
      }
    } catch (error: any) {
      console.error('❌ AttendanceTab: Error loading data:', error)
      setError(`데이터를 불러오는데 실패했습니다: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const loadSites = async () => {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('id, name, address')
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setSites(data || [])
    } catch (error: any) {
      console.error('Error loading sites:', error)
      setSites([])
      throw new Error(`현장 목록 로드 실패: ${error.message}`)
    }
  }

  const loadAttendanceData = async () => {
    try {
      // Calculate date range for current month
      const selectedYear = currentMonth.getFullYear()
      const selectedMonth = currentMonth.getMonth() + 1
      const startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString().split('T')[0]
      const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0]
      
      // console.log('[AttendanceTab] Loading attendance data:', {
      //   userId: profile.id,
      //   dateRange: `${startDate} ~ ${endDate}`,
      //   selectedSite
      // })
      
      let query = supabase
        .from('attendance_records')
        .select(`
          id,
          work_date,
          check_in_time,
          check_out_time,
          status,
          work_hours,
          overtime_hours,
          labor_hours,
          notes,
          site_id,
          sites(name)
        `)
        .eq('user_id', profile.id)
        .gte('work_date', startDate)
        .lte('work_date', endDate)
        .order('work_date', { ascending: false })

      // Add site filter if selected
      if (selectedSite !== 'all') {
        query = query.eq('site_id', selectedSite)
      }

      const { data, error } = await query

      if (error) {
        console.error('[AttendanceTab] Query error:', error)
        throw error
      }

      // console.log('[AttendanceTab] Query success, records:', data?.length || 0)

      // Transform data to match AttendanceRecord interface
      // Now using labor_hours directly from database
      const transformedData: AttendanceRecord[] = (data || []).map(record => ({
        id: record.id,
        work_date: record.work_date,
        check_in_time: record.check_in_time,
        check_out_time: record.check_out_time,
        site_name: record.sites?.name || '',
        status: record.status || 'absent',
        hours_worked: record.work_hours || 0,
        overtime_hours: record.overtime_hours || 0,
        labor_hours: record.labor_hours || (record.work_hours ? record.work_hours / 8 : 0),  // Use DB labor_hours or calculate fallback
        notes: record.notes
      }))
      
      setAttendanceRecords(transformedData)
    } catch (error: any) {
      console.error('[AttendanceTab] Error loading attendance data:', error)
      setAttendanceRecords([])
      throw new Error(`출근 데이터 로드 실패: ${error.message}`)
    }
  }

  const loadSalaryData = async () => {
    try {
      // Calculate salary from attendance records
      // Note: In a real system, this would come from a payroll table
      const { data: attendanceData, error } = await supabase
        .from('attendance_records')
        .select(`
          work_date,
          work_hours,
          overtime_hours,
          site_id,
          sites(name)
        `)
        .eq('user_id', profile.id)
        .order('work_date', { ascending: false })

      if (error) {
        console.error('Error loading salary data:', error)
        setSalaryInfo([])
        return
      }

      // Group by month and calculate salary
      const monthlyData = new Map<string, SalaryInfo>()
      
      (attendanceData || []).forEach(record => {
        const month = record.work_date.substring(0, 7) // YYYY-MM
        if (!monthlyData.has(month)) {
          monthlyData.set(month, {
            id: month,
            month: month,
            basic_salary: 3000000, // Base salary
            overtime_pay: 0,
            allowances: 200000, // Fixed allowances
            deductions: 180000, // Fixed deductions (tax, insurance)
            total_pay: 0,
            work_days: 0,
            total_labor_hours: 0,  // 총 공수
            site_name: record.sites?.name || ''
          })
        }
        
        const salary = monthlyData.get(month)!
        if (record.work_hours) {
          salary.work_days += 1
          // 공수 계산 (labor_hours 필드 우선, 없으면 work_hours/8로 계산)
          const laborHours = record.labor_hours || (record.work_hours / 8)
          salary.total_labor_hours += laborHours
          
          // Calculate overtime pay (work_hours > 8 means overtime)
          if (record.overtime_hours && record.overtime_hours > 0) {
            salary.overtime_pay += Math.floor(record.overtime_hours * 15000) // 시간당 15,000원
          }
        }
      })

      // Calculate total pay for each month
      const salaryArray: SalaryInfo[] = Array.from(monthlyData.values()).map(salary => ({
        ...salary,
        total_pay: salary.basic_salary + salary.overtime_pay + salary.allowances - salary.deductions
      }))

      // Sort by month descending
      salaryArray.sort((a, b) => b.month.localeCompare(a.month))
      
      setSalaryInfo(salaryArray)
      
      // Set initial selected month to most recent
      if (salaryArray.length > 0 && !selectedSalaryMonth) {
        setSelectedSalaryMonth(salaryArray[0].month)
      }
    } catch (error) {
      console.error('Error loading salary data:', error)
      setSalaryInfo([])
    }
  }


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  const downloadSalaryPDF = (salary: SalaryInfo) => {
    try {
      // Create new PDF document
      const doc = new jsPDF()
      
      // Title
      doc.setFontSize(18)
      doc.text('Salary Statement', 105, 30, { align: 'center' })
      
      // Date
      const [year, month] = salary.month.split('-')
      doc.setFontSize(14)
      doc.text(`${year}/${month}`, 105, 45, { align: 'center' })
      
      // Company and employee info
      doc.setFontSize(12)
      doc.text('INOPNC Construction', 20, 65)
      doc.text(`Employee: ${profile.full_name || 'N/A'}`, 20, 75)
      doc.text(`Site: ${salary.site_name}`, 20, 85)
      doc.text(`Work Days: ${salary.work_days}`, 20, 95)
      
      // Simple table without autoTable
      let yPos = 120
      const lineHeight = 15
      
      // Table header
      doc.setFontSize(12)
      doc.text('Item', 20, yPos)
      doc.text('Amount', 150, yPos)
      
      // Draw line under header
      doc.line(20, yPos + 3, 190, yPos + 3)
      yPos += lineHeight
      
      // Table rows
      doc.setFontSize(10)
      const salaryItems = [
        ['Basic Salary', formatCurrency(salary.basic_salary)],
        ['Overtime Pay', formatCurrency(salary.overtime_pay)],
        ['Allowances', formatCurrency(salary.allowances)],
        ['Deductions', `-${formatCurrency(salary.deductions)}`],
        ['Total Pay', formatCurrency(salary.total_pay)]
      ]
      
      salaryItems.forEach(([item, amount]) => {
        doc.text(item, 20, yPos)
        doc.text(amount, 150, yPos)
        yPos += lineHeight
      })
      
      // Draw line above total
      doc.line(20, yPos - lineHeight - 3, 190, yPos - lineHeight - 3)
      
      // Footer
      doc.setFontSize(8)
      doc.text('Generated by INOPNC Work Management System', 105, yPos + 20, { align: 'center' })
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, yPos + 30, { align: 'center' })
      
      // Download PDF
      const fileName = `salary_${year}_${month}_${salary.site_name.replace(/\s+/g, '_')}.pdf`
      doc.save(fileName)
      
    } catch (error) {
      console.error('PDF generation error:', error)
      alert('PDF 생성 중 오류가 발생했습니다.')
    }
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
    // 월 변경 시 선택된 날짜 초기화
    setSelectedDate(null)
  }


  // Sorting functions
  const handleSort = (key: 'work_date' | 'site_name' | 'labor_hours') => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const getSortedRecords = () => {
    if (!sortConfig) return filteredRecords

    return [...filteredRecords].sort((a, b) => {
      const { key, direction } = sortConfig
      let aValue: any, bValue: any

      switch (key) {
        case 'work_date':
          aValue = new Date(a.work_date)
          bValue = new Date(b.work_date)
          break
        case 'site_name':
          aValue = a.site_name || ''
          bValue = b.site_name || ''
          break
        case 'labor_hours':
          aValue = a.labor_hours || 0
          bValue = b.labor_hours || 0
          break
        default:
          return 0
      }

      if (direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })
  }

  const getSortIcon = (key: 'work_date' | 'site_name' | 'labor_hours') => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronUp className="h-3 w-3 text-gray-400" />
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-3 w-3 text-blue-600" />
      : <ChevronDown className="h-3 w-3 text-blue-600" />
  }

  // Calculate overall statistics (전체 통계)
  const getOverallStatistics = () => {
    const workDays = attendanceRecords.filter(record => 
      record.labor_hours !== null && record.labor_hours !== undefined && record.labor_hours > 0
    ).length
    
    const uniqueSites = new Set(
      attendanceRecords
        .filter(record => record.site_name && record.labor_hours !== null && record.labor_hours !== undefined && record.labor_hours > 0)
        .map(record => record.site_name)
    ).size
    
    const totalLaborHours = attendanceRecords
      .filter(record => record.labor_hours !== null && record.labor_hours !== undefined)
      .reduce((sum, record) => sum + (record.labor_hours || 0), 0)

    return {
      workDays,
      uniqueSites,
      totalLaborHours,
      totalDays: attendanceRecords.length
    }
  }

  // Calculate monthly statistics (선택된 월 통계)
  const getMonthlyStatistics = () => {
    const workDays = filteredRecords.filter(record => 
      record.labor_hours !== null && record.labor_hours !== undefined && record.labor_hours > 0
    ).length
    
    const uniqueSites = new Set(
      filteredRecords
        .filter(record => record.site_name && record.labor_hours !== null && record.labor_hours !== undefined && record.labor_hours > 0)
        .map(record => record.site_name)
    ).size
    
    const totalLaborHours = filteredRecords
      .filter(record => record.labor_hours !== null && record.labor_hours !== undefined)
      .reduce((sum, record) => sum + (record.labor_hours || 0), 0)

    return {
      workDays,
      uniqueSites,
      totalLaborHours,
      totalDays: filteredRecords.length
    }
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    const days = []
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>)
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      const isSelected = selectedDate ? selectedDate.toDateString() === dayDate.toDateString() : false
      const isToday = new Date().toDateString() === dayDate.toDateString()
      
      // Check if there's attendance data for this day
      const dayRecord = attendanceRecords.find(record => 
        new Date(record.work_date).toDateString() === dayDate.toDateString()
      )
      
      // Simple background without color coding
      const getDayBackground = (laborHours: number | undefined) => {
        if (!laborHours || laborHours === 0) return 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      }
      
      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(dayDate)}
          className={`h-14 w-full rounded text-xs font-medium transition-colors touch-manipulation relative flex flex-col items-center justify-start p-1 ${
            isSelected
              ? 'bg-blue-600 text-white'
              : dayRecord && dayRecord.labor_hours !== undefined
              ? getDayBackground(dayRecord.labor_hours)
              : isToday
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          {/* 날짜 숫자 - 상단 고정 */}
          <div className="text-sm font-bold mb-0.5">{day}</div>
          
          {/* 공수 정보 */}
          {dayRecord && dayRecord.labor_hours !== undefined && dayRecord.labor_hours !== null && (
            <div className={`text-xs font-bold leading-none ${
              isSelected ? 'text-white' : 'text-gray-800 dark:text-gray-200'
            }`}>
              {dayRecord.labor_hours.toFixed(1)}
            </div>
          )}
          
          {/* 현장명 약어 - 매우 작은 폰트 */}
          {dayRecord && dayRecord.labor_hours !== undefined && dayRecord.labor_hours !== null && dayRecord.site_name && (
            <div className={`text-[10px] leading-none px-0.5 truncate max-w-full ${
              isSelected ? 'text-white/90' : 'text-blue-600 dark:text-blue-400'
            }`}>
              {dayRecord.site_name.replace(/\s*[A-Z]?현장$/g, '').slice(0, 4)}
            </div>
          )}
          
        </button>
      )
    }
    
    return days
  }

  return (
    <div className="space-y-3">
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('print')}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === 'print'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            출력정보
          </button>
          <button
            onClick={() => setActiveTab('salary')}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === 'salary'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            급여정보
          </button>
        </div>

        <div className="p-3">
          {/* Filters */}
          <div className="mb-3">
            {/* Site Selection */}
            <div className="relative">
              <CustomSelect value={selectedSite} onValueChange={setSelectedSite}>
                <CustomSelectTrigger className="w-full pl-8 pr-3 py-1.5 h-8 text-xs font-medium">
                  <CustomSelectValue placeholder="전체 현장" />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  <CustomSelectItem value="all">전체 현장</CustomSelectItem>
                  {sites.map((site: any) => (
                    <CustomSelectItem key={site.id} value={site.id}>
                      {site.name}
                    </CustomSelectItem>
                  ))}
                </CustomSelectContent>
              </CustomSelect>
              <Building2 className="absolute left-2 top-2 h-3 w-3 text-gray-500 dark:text-gray-400 pointer-events-none" />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 mb-3">
              <div className="flex items-center space-x-2">
                <div className="text-red-600 dark:text-red-400 text-sm font-medium">오류</div>
              </div>
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
              <button
                onClick={() => loadData()}
                className="mt-2 text-xs px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-700 dark:text-red-200 rounded transition-colors"
              >
                다시 시도
              </button>
            </div>
          )}

          {activeTab === 'print' ? (
            <div className="space-y-3">
              {/* Calendar */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                {/* Year/Month Selectors */}
                <div className="flex items-center justify-center gap-2 mb-3">
                  <CustomSelect 
                    value={currentMonth.getFullYear().toString()} 
                    onValueChange={(value) => {
                      const newDate = new Date(currentMonth)
                      newDate.setFullYear(parseInt(value))
                      setCurrentMonth(newDate)
                    }}
                  >
                    <CustomSelectTrigger className="w-20 h-7 text-xs">
                      <CustomSelectValue />
                    </CustomSelectTrigger>
                    <CustomSelectContent>
                      {Array.from({ length: 6 }, (_, i) => {
                        const year = new Date().getFullYear() - 2 + i
                        return (
                          <CustomSelectItem key={year} value={year.toString()}>
                            {year}년
                          </CustomSelectItem>
                        )
                      })}
                    </CustomSelectContent>
                  </CustomSelect>
                  
                  <CustomSelect 
                    value={(currentMonth.getMonth() + 1).toString()} 
                    onValueChange={(value) => {
                      const newDate = new Date(currentMonth)
                      newDate.setMonth(parseInt(value) - 1)
                      setCurrentMonth(newDate)
                    }}
                  >
                    <CustomSelectTrigger className="w-16 h-7 text-xs">
                      <CustomSelectValue />
                    </CustomSelectTrigger>
                    <CustomSelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <CustomSelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1}월
                        </CustomSelectItem>
                      ))}
                    </CustomSelectContent>
                  </CustomSelect>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
                  </h3>
                  
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                  >
                    <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                {/* Calendar Header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['일', '월', '화', '수', '목', '금', '토'].map((day: any) => (
                    <div key={day} className="h-6 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {renderCalendar()}
                </div>
              </div>

              {/* Statistics Summary - 전체 통계와 월별 통계 분리 */}
              <div className="space-y-2">
                {/* 전체 통계 */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">📊 전체 통계</div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className="text-sm font-bold text-gray-600 dark:text-gray-400">
                        {getOverallStatistics().workDays}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">작업일</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-gray-600 dark:text-gray-400">
                        {getOverallStatistics().uniqueSites}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">현장</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-gray-600 dark:text-gray-400">
                        {getOverallStatistics().totalLaborHours.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">총공수</div>
                    </div>
                  </div>
                </div>

                {/* 선택된 월/날짜 통계 */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-2 border border-blue-200 dark:border-blue-800">
                  <div className="text-xs text-blue-600 dark:text-blue-400 mb-1 font-medium">
                    📅 {selectedDate 
                      ? `${selectedDate.getMonth() + 1}/${selectedDate.getDate()} 일별 통계`
                      : `${currentMonth.getFullYear()}년 ${currentMonth.getMonth() + 1}월 통계`
                    }
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {getMonthlyStatistics().workDays}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">작업일</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        {getMonthlyStatistics().uniqueSites}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">현장</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {getMonthlyStatistics().totalLaborHours.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">총공수</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attendance Records - Table Layout */}
              <SortableTable
                data={getSortedRecords()}
                columns={[
                  {
                    key: 'work_date',
                    label: '날짜',
                    sortable: true,
                    render: (value) => new Date(value).toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric'
                    })
                  },
                  {
                    key: 'site_name',
                    label: '현장',
                    sortable: true,
                    render: (value) => value ? value.replace(/\s*[A-Z]?현장$/g, '') : '미지정',
                    className: 'font-medium truncate max-w-[80px]'
                  },
                  {
                    key: 'labor_hours',
                    label: '공수',
                    sortable: true,
                    render: (value) => value !== null && value !== undefined && value > 0 ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        {value.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">-</span>
                    )
                  }
                ]}
                onSort={(config) => {
                  if (config.key && config.direction) {
                    setSortConfig({ key: config.key as keyof AttendanceRecord, direction: config.direction as 'asc' | 'desc' })
                  } else {
                    setSortConfig(null)
                  }
                }}
                sortConfig={sortConfig || undefined}
                loading={loading}
                compact={true}
                emptyMessage="출근 기록이 없습니다"
              />
            </div>
          ) : (
            /* Salary Info Tab - Compact Design */
            <div className="space-y-2">
              {/* 급여 정보 필터 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">조회 기간:</span>
                  <CustomSelect 
                    value={salaryFilter.period} 
                    onValueChange={(value) => setSalaryFilter(prev => ({...prev, period: value}))}
                  >
                    <CustomSelectTrigger className="w-32 h-7 text-xs">
                      <CustomSelectValue />
                    </CustomSelectTrigger>
                    <CustomSelectContent>
                      <CustomSelectItem value="recent3">최근 3개월</CustomSelectItem>
                      <CustomSelectItem value="recent6">최근 6개월</CustomSelectItem>
                      <CustomSelectItem value="recent12">최근 12개월</CustomSelectItem>
                      <CustomSelectItem value="all">전체 기간</CustomSelectItem>
                    </CustomSelectContent>
                  </CustomSelect>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">데이터 로딩...</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th 
                            className="px-1 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none whitespace-nowrap"
                            onClick={() => handleSalarySort('month')}
                          >
                            <div className="flex items-center space-x-1">
                              <span>월</span>
                              {getSalaryIcon('month')}
                            </div>
                          </th>
                          <th 
                            className="px-1 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none whitespace-nowrap"
                            onClick={() => handleSalarySort('site_name')}
                          >
                            <div className="flex items-center space-x-1">
                              <span>현장</span>
                              {getSalaryIcon('site_name')}
                            </div>
                          </th>
                          <th 
                            className="px-1 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none whitespace-nowrap"
                            onClick={() => handleSalarySort('total_labor_hours')}
                          >
                            <div className="flex items-center justify-center space-x-1">
                              <span>총 공수</span>
                              {getSalaryIcon('total_labor_hours')}
                            </div>
                          </th>
                          <th 
                            className="px-1 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none whitespace-nowrap"
                            onClick={() => handleSalarySort('basic_salary')}
                          >
                            <div className="flex items-center justify-end space-x-1">
                              <span>기본</span>
                              {getSalaryIcon('basic_salary')}
                            </div>
                          </th>
                          <th 
                            className="px-1 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none whitespace-nowrap"
                            onClick={() => handleSalarySort('overtime_pay')}
                          >
                            <div className="flex items-center justify-end space-x-1">
                              <span>연장</span>
                              {getSalaryIcon('overtime_pay')}
                            </div>
                          </th>
                          <th 
                            className="px-1 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none whitespace-nowrap"
                            onClick={() => handleSalarySort('total_pay')}
                          >
                            <div className="flex items-center justify-end space-x-1">
                              <span>실급</span>
                              {getSalaryIcon('total_pay')}
                            </div>
                          </th>
                          <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 whitespace-nowrap">
                            PDF
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredSalaryInfo.map((salary: any) => (
                          <tr 
                            key={salary.id} 
                            onClick={() => setSelectedSalaryMonth(salary.month)}
                            className={`cursor-pointer transition-colors ${
                              selectedSalaryMonth === salary.month 
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' 
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            <td className="px-1 py-2 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-gray-100">
                              {salary.month.split('-')[1]}월
                            </td>
                            <td className="px-1 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100 truncate max-w-[50px]">
                              {salary.site_name.replace(/\s*[A-Z]?현장$/g, '')}
                            </td>
                            <td className="px-1 py-2 whitespace-nowrap text-xs text-center text-gray-900 dark:text-gray-100">
                              {salary.total_labor_hours?.toFixed(1) || '0.0'}
                            </td>
                            <td className="px-1 py-2 whitespace-nowrap text-xs text-right text-gray-900 dark:text-gray-100">
                              {(salary.basic_salary / 10000).toFixed(0)}만
                            </td>
                            <td className="px-1 py-2 whitespace-nowrap text-xs text-right text-gray-900 dark:text-gray-100">
                              {(salary.overtime_pay / 10000).toFixed(0)}만
                            </td>
                            <td className="px-1 py-2 whitespace-nowrap text-xs text-right font-bold text-blue-600 dark:text-blue-400">
                              {(salary.total_pay / 10000).toFixed(0)}만
                            </td>
                            <td className="px-1 py-2 whitespace-nowrap text-center">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation() // 행 클릭 이벤트 방지
                                  downloadSalaryPDF(salary)
                                }}
                                className="p-1 text-blue-600 hover:text-blue-700 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                title="PDF 다운로드"
                              >
                                <Download className="h-3 w-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* 상세 정보 표시 영역 - 선택된 월의 상세 정보 */}
                  {(() => {
                    const selectedSalary = filteredSalaryInfo.find(salary => salary.month === selectedSalaryMonth)
                    if (!selectedSalary) return null

                    return (
                      <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-3">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          선택된 급여내역 ({selectedSalary.month})
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">기본급</span>
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {formatCurrency(selectedSalary.basic_salary)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">연장수당</span>
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {formatCurrency(selectedSalary.overtime_pay)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">제수당</span>
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {formatCurrency(selectedSalary.allowances)}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-red-600 dark:text-red-400">
                              <span>공제액</span>
                              <span className="font-medium">-{formatCurrency(selectedSalary.deductions)}</span>
                            </div>
                            <div className="flex justify-between items-center bg-blue-100 dark:bg-blue-900/20 rounded px-2 py-1 mt-2">
                              <span className="font-semibold text-gray-900 dark:text-gray-100">실지급액</span>
                              <span className="font-bold text-blue-600 dark:text-blue-400">
                                {formatCurrency(selectedSalary.total_pay)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* 급여 계산식 */}
                        <div className="mt-4 pt-3 border-t border-gray-300 dark:border-gray-600">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
                            💰 급여 계산식
                          </div>
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                            <div className="space-y-2 text-xs">
                              {/* 총 지급액 계산 */}
                              <div className="flex items-center justify-between py-1">
                                <span className="text-gray-600 dark:text-gray-400">총 지급액</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {formatCurrency(selectedSalary.basic_salary + selectedSalary.overtime_pay + selectedSalary.allowances)}
                                </span>
                              </div>
                              
                              {/* 계산식 표시 */}
                              <div className="bg-gray-50 dark:bg-gray-700 rounded p-2 text-xs">
                                <div className="text-gray-500 dark:text-gray-400 mb-1">계산과정:</div>
                                <div className="space-y-1 font-mono">
                                  <div className="flex justify-between">
                                    <span>기본급</span>
                                    <span className="text-gray-900 dark:text-gray-100">
                                      {(selectedSalary.basic_salary / 10000).toFixed(0)}만원
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>+ 연장수당</span>
                                    <span className="text-gray-900 dark:text-gray-100">
                                      {(selectedSalary.overtime_pay / 10000).toFixed(0)}만원
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>+ 제수당</span>
                                    <span className="text-gray-900 dark:text-gray-100">
                                      {(selectedSalary.allowances / 10000).toFixed(0)}만원
                                    </span>
                                  </div>
                                  <div className="border-t border-gray-300 dark:border-gray-600 pt-1 mt-1">
                                    <div className="flex justify-between">
                                      <span>- 공제액</span>
                                      <span className="text-red-600 dark:text-red-400">
                                        {(selectedSalary.deductions / 10000).toFixed(0)}만원
                                      </span>
                                    </div>
                                  </div>
                                  <div className="border-t-2 border-blue-300 dark:border-blue-600 pt-1 mt-1">
                                    <div className="flex justify-between font-bold text-blue-600 dark:text-blue-400">
                                      <span>= 실지급액</span>
                                      <span>{(selectedSalary.total_pay / 10000).toFixed(0)}만원</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* 공수 기준 계산 */}
                              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded p-2 text-xs">
                                <div className="text-yellow-700 dark:text-yellow-300 mb-1 font-medium">공수 기준:</div>
                                <div className="space-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">총 공수</span>
                                    <span className="text-gray-900 dark:text-gray-100">{selectedSalary.total_labor_hours?.toFixed(1) || '0.0'}공수</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">근무 날짜수</span>
                                    <span className="text-gray-900 dark:text-gray-100">{selectedSalary.work_days}일</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">공수당 단가</span>
                                    <span className="text-gray-900 dark:text-gray-100">
                                      {selectedSalary.total_labor_hours > 0 ? Math.round(selectedSalary.total_pay / selectedSalary.total_labor_hours / 1000) : 0}천원
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">시급 평균 (8시간=1공수)</span>
                                    <span className="text-gray-900 dark:text-gray-100">
                                      {selectedSalary.total_labor_hours > 0 ? Math.round(selectedSalary.total_pay / selectedSalary.total_labor_hours / 8 / 100) : 0}백원
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}