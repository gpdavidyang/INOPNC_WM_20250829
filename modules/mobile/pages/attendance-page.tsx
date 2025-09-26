'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { MobileLayout as MobileLayoutShell } from '@/modules/mobile/components/layout/MobileLayout'
import { MobileAuthGuard } from '@/modules/mobile/components/auth/mobile-auth-guard'
import { useUnifiedAuth } from '@/hooks/use-unified-auth'
import { Card, CardContent, Stack, Row } from '@/modules/shared/ui'
import { createClient } from '@/lib/supabase/client'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  isSameMonth,
  isSameWeek,
  parseISO,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import clsx from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import '@/modules/mobile/styles/attendance.css'

interface AttendanceRecord {
  id: string
  date: string
  workDate: string
  checkIn: string | null
  checkOut: string | null
  workHours: number
  laborHours: number
  overtimeHours: number
  status: string
  site_id: string | null
  siteId: string | null
  siteName: string
  raw?: Record<string, unknown>
}

interface SiteOption {
  value: string
  label: string
}

interface CalendarDaySummary {
  date: Date
  iso: string
  isCurrentMonth: boolean
  isSunday: boolean
  totalHours: number
  totalManDays: number
  sites: string[]
}

export const AttendancePage: React.FC = () => {
  return (
    <MobileAuthGuard>
      <AttendanceContent />
    </MobileAuthGuard>
  )
}

const AttendanceContent: React.FC = () => {
  const { profile } = useUnifiedAuth()
  const [activeTab, setActiveTab] = useState<'work' | 'salary'>('work')

  // Filters & UI states
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all')
  const [siteOptions, setSiteOptions] = useState<SiteOption[]>([
    { value: 'all', label: '전체 현장' },
  ])
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedYearMonth, setSelectedYearMonth] = useState(() => format(new Date(), 'yyyy-MM'))
  const [salarySiteId, setSalarySiteId] = useState<string>('all')
  const [salaryPeriod, setSalaryPeriod] = useState<'3' | '6' | '12' | '24'>('3')
  const [employmentType, setEmploymentType] = useState<'freelance' | 'daily' | 'regular'>(
    'freelance'
  )
  const [isSalaryFormOpen, setIsSalaryFormOpen] = useState(false)
  const [previewScale, setPreviewScale] = useState(100)
  const [manualBaseSalary, setManualBaseSalary] = useState('')

  // Real-time data states
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Supabase client initialization
  const supabase = useMemo(() => createClient(), [])

  const transformWorkRecord = useCallback((record: any): AttendanceRecord => {
    const rawWorkHours =
      typeof record.work_hours === 'number'
        ? record.work_hours
        : typeof record.labor_hours === 'number'
          ? record.labor_hours
          : 0

    const rawLaborHours =
      typeof record.labor_hours === 'number'
        ? record.labor_hours
        : typeof record.work_hours === 'number'
          ? record.work_hours
          : 0

    const workHoursValue = Number.isFinite(rawWorkHours) ? rawWorkHours : 0
    const laborHoursValue = Number.isFinite(rawLaborHours) ? rawLaborHours : 0

    const computedStatus = record.status
      ? record.status
      : record.check_in_time
        ? record.check_out_time
          ? 'present'
          : 'in-progress'
        : 'absent'

    return {
      id: record.id,
      date: record.work_date,
      workDate: record.work_date,
      checkIn: record.check_in_time ?? null,
      checkOut: record.check_out_time ?? null,
      workHours: Number(workHoursValue.toFixed(2)),
      laborHours: Number(laborHoursValue.toFixed(2)),
      overtimeHours: Number((record.overtime_hours ?? 0).toFixed(2)),
      status: computedStatus,
      site_id: record.site_id ?? null,
      siteId: record.site_id ?? null,
      siteName: record.sites?.name ?? '현장 미지정',
      raw: record,
    }
  }, [])

  // Load work records from Supabase
  useEffect(() => {
    if (!profile?.id) return

    const fetchWorkRecords = async () => {
      setLoading(true)

      try {
        const salaryMonths = Number(salaryPeriod)
        const calendarStart = startOfWeek(startOfMonth(currentDate), { locale: ko })
        const salaryStart = startOfMonth(addMonths(new Date(), -(salaryMonths - 1)))
        const rangeStartDate = calendarStart < salaryStart ? calendarStart : salaryStart

        const calendarEnd = endOfWeek(endOfMonth(currentDate), { locale: ko })
        const salaryEnd = endOfMonth(new Date())
        const rangeEndDate = calendarEnd > salaryEnd ? calendarEnd : salaryEnd

        const rangeStart = format(rangeStartDate, 'yyyy-MM-dd')
        const rangeEnd = format(rangeEndDate, 'yyyy-MM-dd')

        const { data, error } = await supabase
          .from('work_records')
          .select(
            `
            id,
            user_id,
            profile_id,
            site_id,
            work_date,
            check_in_time,
            check_out_time,
            work_hours,
            labor_hours,
            overtime_hours,
            status,
            notes,
            sites:sites!site_id (
              id,
              name
            )
          `
          )
          .or(`user_id.eq.${profile.id},profile_id.eq.${profile.id}`)
          .gte('work_date', rangeStart)
          .lte('work_date', rangeEnd)
          .order('work_date', { ascending: true })
          .order('check_in_time', { ascending: true })

        if (error) {
          console.error('Error fetching work records:', error)
          setAttendanceData([])
          return
        }

        const transformed = (data ?? []).map(transformWorkRecord)
        transformed.sort((a, b) => a.date.localeCompare(b.date))
        setAttendanceData(transformed)
      } catch (error) {
        console.error('Error loading work records:', error)
        setAttendanceData([])
      } finally {
        setLoading(false)
      }
    }

    fetchWorkRecords()
  }, [profile?.id, currentDate, salaryPeriod, supabase, transformWorkRecord])

  // Derive site filter options from loaded records
  useEffect(() => {
    const uniqueSites = new Map<string, string>()
    attendanceData.forEach(record => {
      if (record.site_id && record.siteName) {
        uniqueSites.set(record.site_id, record.siteName)
      }
    })

    const options: SiteOption[] = [{ value: 'all', label: '전체 현장' }]
    uniqueSites.forEach((label, id) => {
      options.push({ value: id, label })
    })

    setSiteOptions(options)

    if (selectedSiteId !== 'all' && !uniqueSites.has(selectedSiteId)) {
      setSelectedSiteId('all')
    }

    if (salarySiteId !== 'all' && !uniqueSites.has(salarySiteId)) {
      setSalarySiteId('all')
    }
  }, [attendanceData, selectedSiteId, salarySiteId])

  const filteredAttendanceData = useMemo(() => {
    return attendanceData.filter(record => {
      if (selectedSiteId !== 'all' && record.site_id && record.site_id !== selectedSiteId) {
        return false
      }
      return true
    })
  }, [attendanceData, selectedSiteId])

  const salaryAttendanceData = useMemo(() => {
    return attendanceData.filter(record => {
      if (salarySiteId !== 'all' && record.site_id && record.site_id !== salarySiteId) {
        return false
      }
      return true
    })
  }, [attendanceData, salarySiteId])

  // Real-time subscription for attendance updates
  useEffect(() => {
    if (!profile?.id) return

    const channel = supabase
      .channel(`work-records-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_records',
        },
        payload => {
          const newRecord = payload.new as Record<string, any>
          const oldRecord = payload.old as Record<string, any>

          const belongsToUser = (record: Record<string, any> | null | undefined) =>
            Boolean(record && (record.user_id === profile.id || record.profile_id === profile.id))

          if (payload.eventType === 'DELETE') {
            if (!belongsToUser(oldRecord)) return
            setAttendanceData(prev => prev.filter(r => r.id !== oldRecord?.id))
            return
          }

          if (!belongsToUser(newRecord)) return

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const transformed = transformWorkRecord(newRecord)
            setAttendanceData(prev => {
              const filtered = prev.filter(r => r.id !== transformed.id)
              const fallbackSiteName =
                transformed.siteName === '현장 미지정' && transformed.site_id
                  ? filtered.find(r => r.site_id === transformed.site_id)?.siteName || '현장 미지정'
                  : transformed.siteName

              const enriched = {
                ...transformed,
                siteName: fallbackSiteName,
              }

              return [...filtered, enriched].sort((a, b) => a.date.localeCompare(b.date))
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.id, supabase, transformWorkRecord])

  // Dynamic salary calculation helper functions
  const calculateMonthlySalary = (records: AttendanceRecord[]) => {
    if (!records || records.length === 0) {
      return {
        baseSalary: 0,
        overtimePay: 0,
        mealAllowance: 0,
        totalSalary: 0,
      }
    }

    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    // Filter attendance for current month
    const monthlyAttendance = records.filter(record => {
      const recordDate = new Date(record.date)
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear
    })

    // Base calculation parameters
    const hourlyRate = 25000 // ₩25,000 per hour base rate
    const overtimeRate = hourlyRate * 1.5
    const dailyMealAllowance = 10000 // ₩10,000 per working day

    let totalRegularHours = 0
    let totalOvertimeHours = 0
    let workingDays = 0

    monthlyAttendance.forEach(record => {
      if (
        record.status === 'present' ||
        record.status === 'late' ||
        record.status === 'in-progress'
      ) {
        workingDays++
        const regularHours = Math.min(record.workHours, 8)
        const overtimeHours = Math.max(record.workHours - 8, 0)

        totalRegularHours += regularHours
        totalOvertimeHours += overtimeHours
      }
    })

    const baseSalary = totalRegularHours * hourlyRate
    const overtimePay = totalOvertimeHours * overtimeRate
    const mealAllowance = workingDays * dailyMealAllowance
    const totalSalary = baseSalary + overtimePay + mealAllowance

    return {
      baseSalary,
      overtimePay,
      mealAllowance,
      totalSalary,
      workingDays,
      totalRegularHours,
      totalOvertimeHours,
    }
  }

  const handleYearMonthChange = (value: string) => {
    const [yearStr, monthStr] = value.split('-')
    const year = Number(yearStr)
    const month = Number(monthStr) - 1

    if (!Number.isNaN(year) && !Number.isNaN(month)) {
      setCurrentDate(new Date(year, month, 1))
    }

    setSelectedYearMonth(value)
  }

  // Calendar navigation helper functions
  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1))
  }

  const handlePreviousWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1))
  }

  const handleToggleViewMode = () => {
    setViewMode(prev => (prev === 'month' ? 'week' : 'month'))
  }

  // Get filtered attendance data based on current view
  const getFilteredAttendanceData = () => {
    if (!filteredAttendanceData) return []

    let startDate: Date
    let endDate: Date

    if (viewMode === 'month') {
      startDate = startOfMonth(currentDate)
      endDate = endOfMonth(currentDate)
    } else {
      startDate = startOfWeek(currentDate, { locale: ko })
      endDate = endOfWeek(currentDate, { locale: ko })
    }

    const results = filteredAttendanceData.filter(record => {
      const recordDate = parseISO(record.date)
      return recordDate >= startDate && recordDate <= endDate
    })

    return results.slice().sort((a, b) => b.date.localeCompare(a.date))
  }

  // Format current period for display
  const getCurrentPeriodText = () => {
    if (viewMode === 'month') {
      return format(currentDate, 'yyyy년 MM월', { locale: ko })
    } else {
      const start = startOfWeek(currentDate, { locale: ko })
      const end = endOfWeek(currentDate, { locale: ko })

      if (isSameMonth(start, end)) {
        return `${format(start, 'yyyy년 MM월', { locale: ko })} ${format(start, 'dd일', { locale: ko })} - ${format(end, 'dd일', { locale: ko })}`
      } else {
        return `${format(start, 'MM월 dd일', { locale: ko })} - ${format(end, 'MM월 dd일', { locale: ko })}`
      }
    }
  }

  const monthlyAttendance = useMemo(() => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    return filteredAttendanceData.filter(record => {
      const date = parseISO(record.date)
      return date >= start && date <= end
    })
  }, [filteredAttendanceData, currentDate])

  const monthlyStats = useMemo(() => {
    if (monthlyAttendance.length === 0) {
      return { workDays: 0, siteCount: 0, totalManDays: 0 }
    }

    const workDaySet = new Set<string>()
    const siteSet = new Set<string>()
    let totalHours = 0

    monthlyAttendance.forEach(record => {
      if (
        record.status === 'present' ||
        record.status === 'late' ||
        record.status === 'in-progress'
      ) {
        workDaySet.add(record.date)
      }
      if (record.site_id) {
        siteSet.add(record.site_id)
      }
      totalHours += record.workHours || 0
    })

    return {
      workDays: workDaySet.size,
      siteCount: siteSet.size,
      totalManDays: Number((totalHours / 8).toFixed(1)),
    }
  }, [monthlyAttendance])

  const calendarDays = useMemo(() => {
    const summarizeDay = (targetDate: Date) => {
      const iso = format(targetDate, 'yyyy-MM-dd')
      const dayRecords = filteredAttendanceData.filter(record => record.date === iso)
      const totalHours = dayRecords.reduce((sum, record) => sum + (record.workHours || 0), 0)
      const totalManDays = totalHours / 8
      const siteLabels = Array.from(
        new Set(
          dayRecords.map(record =>
            record.siteName && record.siteName.trim() ? record.siteName : '현장 미지정'
          )
        )
      )

      return {
        date: targetDate,
        iso,
        isCurrentMonth: targetDate.getMonth() === currentDate.getMonth(),
        isSunday: targetDate.getDay() === 0,
        totalHours: Number(totalHours.toFixed(1)),
        totalManDays: Number(totalManDays.toFixed(1)),
        sites: dayRecords.length > 0 ? siteLabels : [],
      }
    }

    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { locale: ko })
      return Array.from({ length: 7 }, (_, idx) => summarizeDay(addDays(start, idx)))
    }

    const start = startOfWeek(startOfMonth(currentDate), { locale: ko })
    const end = endOfWeek(endOfMonth(currentDate), { locale: ko })
    const days: CalendarDaySummary[] = []
    let cursor = start

    while (cursor <= end) {
      days.push(summarizeDay(cursor))
      cursor = addDays(cursor, 1)
    }

    return days
  }, [filteredAttendanceData, currentDate, viewMode])

  const yearMonthOptions = useMemo(() => {
    const start = subMonths(startOfMonth(currentDate), 5)

    return Array.from({ length: 12 }, (_, idx) => {
      const date = addMonths(start, idx)
      return {
        value: format(date, 'yyyy-MM'),
        label: format(date, 'yyyy년 MM월', { locale: ko }),
      }
    })
  }, [currentDate])

  const selectedYearMonthLabel = useMemo(() => {
    const matchedOption = yearMonthOptions.find(option => option.value === selectedYearMonth)
    if (matchedOption) {
      return matchedOption.label
    }

    const [yearStr, monthStr] = selectedYearMonth.split('-')
    const year = Number(yearStr)
    const month = Number(monthStr) - 1

    if (!Number.isNaN(year) && !Number.isNaN(month)) {
      return format(new Date(year, month, 1), 'yyyy년 MM월', { locale: ko })
    }

    return format(currentDate, 'yyyy년 MM월', { locale: ko })
  }, [yearMonthOptions, selectedYearMonth, currentDate])

  useEffect(() => {
    const formatted = format(currentDate, 'yyyy-MM')
    setSelectedYearMonth(prev => (prev === formatted ? prev : formatted))
  }, [currentDate])

  const selectedSiteLabel = useMemo(() => {
    return siteOptions.find(option => option.value === selectedSiteId)?.label || '전체 현장'
  }, [siteOptions, selectedSiteId])

  const salarySiteLabel = useMemo(() => {
    return siteOptions.find(option => option.value === salarySiteId)?.label || '전체 현장'
  }, [siteOptions, salarySiteId])

  const salaryStats = useMemo(() => {
    if (salaryAttendanceData.length === 0) {
      return { workDays: 0, restDays: 0, totalManDays: 0 }
    }

    const months = Number(salaryPeriod)
    const periodEnd = endOfMonth(new Date())
    const periodStart = startOfMonth(addMonths(periodEnd, -(months - 1)))

    const attendanceInPeriod = salaryAttendanceData.filter(record => {
      const recordDate = parseISO(record.date)
      return recordDate >= periodStart && recordDate <= periodEnd
    })

    const workDaySet = new Set<string>()
    let totalHours = 0

    attendanceInPeriod.forEach(record => {
      if (
        record.status === 'present' ||
        record.status === 'late' ||
        record.status === 'in-progress'
      ) {
        workDaySet.add(record.date)
      }
      totalHours += record.workHours || 0
    })

    const totalDaysInPeriod = Math.max(
      0,
      Math.floor((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    )

    const workDays = workDaySet.size
    const restDays = Math.max(totalDaysInPeriod - workDays, 0)

    return {
      workDays,
      restDays,
      totalManDays: Number((totalHours / 8).toFixed(1)),
    }
  }, [salaryAttendanceData, salaryPeriod])

  // Calculate recent salary history (last 3 months)
  const calculateRecentSalaryHistory = (records: AttendanceRecord[]) => {
    const history = []
    const now = new Date()

    for (let i = 1; i <= 3; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const month = targetDate.getMonth()
      const year = targetDate.getFullYear()

      // Filter attendance for target month
      const monthlyAttendance = records.filter(record => {
        const recordDate = new Date(record.date)
        return recordDate.getMonth() === month && recordDate.getFullYear() === year
      })

      // Calculate salary for this month
      const hourlyRate = 25000
      const overtimeRate = hourlyRate * 1.5
      const dailyMealAllowance = 10000

      let totalRegularHours = 0
      let totalOvertimeHours = 0
      let workingDays = 0

      monthlyAttendance.forEach(record => {
        if (
          record.status === 'present' ||
          record.status === 'late' ||
          record.status === 'in-progress'
        ) {
          workingDays++
          const regularHours = Math.min(record.workHours, 8)
          const overtimeHours = Math.max(record.workHours - 8, 0)

          totalRegularHours += regularHours
          totalOvertimeHours += overtimeHours
        }
      })

      const baseSalary = totalRegularHours * hourlyRate
      const overtimePay = totalOvertimeHours * overtimeRate
      const mealAllowance = workingDays * dailyMealAllowance
      const totalSalary = baseSalary + overtimePay + mealAllowance

      history.push({
        month: targetDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' }),
        paidDate: new Date(year, month + 1, 0).toISOString().split('T')[0],
        totalSalary,
        baseSalary,
        overtimePay,
        mealAllowance,
      })
    }

    return history
  }

  // Get current month salary data
  const currentSalaryData = useMemo(
    () => calculateMonthlySalary(salaryAttendanceData),
    [salaryAttendanceData]
  )
  const recentSalaryHistory = useMemo(
    () => calculateRecentSalaryHistory(salaryAttendanceData),
    [salaryAttendanceData]
  )

  // Salary chart data preparation functions
  const prepareSalaryTrendData = () => {
    return recentSalaryHistory.map(item => ({
      month: item.month,
      총급여: item.totalSalary,
      기본급: item.baseSalary,
      연장수당: item.overtimePay,
      식대: item.mealAllowance,
    }))
  }

  const prepareSalaryBreakdownData = () => {
    return [
      { name: '기본급', value: currentSalaryData.baseSalary, color: '#3b82f6' },
      { name: '연장수당', value: currentSalaryData.overtimePay, color: '#10b981' },
      { name: '식대', value: currentSalaryData.mealAllowance, color: '#f59e0b' },
    ]
  }

  const prepareSalaryComparisonData = () => {
    const thisMonth = currentSalaryData.totalSalary
    const lastMonth =
      recentSalaryHistory.length > 0 ? recentSalaryHistory[0].totalSalary : thisMonth
    const avgSalary =
      recentSalaryHistory.length > 0
        ? recentSalaryHistory.reduce((sum, item) => sum + item.totalSalary, thisMonth) /
          (recentSalaryHistory.length + 1)
        : thisMonth

    return [
      { name: '이번 달', value: thisMonth, color: '#3b82f6' },
      { name: '지난 달', value: lastMonth, color: '#6b7280' },
      { name: '평균', value: Math.round(avgSalary), color: '#10b981' },
    ]
  }

  return (
    <MobileLayoutShell>
      <div className="attendance-page w-full max-w-[480px] mx-auto px-4 pt-3 pb-6 space-y-4">
        <nav className="line-tabs">
          <button
            type="button"
            className={clsx('line-tab', activeTab === 'work' && 'active')}
            onClick={() => setActiveTab('work')}
            aria-selected={activeTab === 'work'}
          >
            출력현황
          </button>
          <button
            type="button"
            className={clsx('line-tab', activeTab === 'salary' && 'active')}
            onClick={() => setActiveTab('salary')}
            aria-selected={activeTab === 'salary'}
          >
            급여현황
          </button>
        </nav>

        {activeTab === 'work' && (
          <section className="space-y-4">
            <div className="site-filter-section grid grid-cols-2 gap-3">
              <div className="w-full">
                <CustomSelect value={selectedSiteId} onValueChange={setSelectedSiteId}>
                  <CustomSelectTrigger
                    className={clsx(
                      'calendar-filter-trigger text-[15px] font-semibold',
                      'dark:!bg-slate-900/80 dark:!text-slate-100 dark:!border-[#3a4048]'
                    )}
                    aria-label="현장 선택"
                  >
                    <CustomSelectValue>{selectedSiteLabel}</CustomSelectValue>
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    {siteOptions.map(option => (
                      <CustomSelectItem key={option.value} value={option.value}>
                        {option.label}
                      </CustomSelectItem>
                    ))}
                  </CustomSelectContent>
                </CustomSelect>
              </div>
              <div className="w-full">
                <CustomSelect value={selectedYearMonth} onValueChange={handleYearMonthChange}>
                  <CustomSelectTrigger
                    className={clsx(
                      'calendar-filter-trigger text-[15px] font-semibold',
                      'dark:!bg-slate-900/80 dark:!text-slate-100 dark:!border-[#3a4048]'
                    )}
                    aria-label="연도와 월 선택"
                  >
                    <CustomSelectValue>{selectedYearMonthLabel}</CustomSelectValue>
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    {yearMonthOptions.map(option => (
                      <CustomSelectItem key={option.value} value={option.value}>
                        {option.label}
                      </CustomSelectItem>
                    ))}
                  </CustomSelectContent>
                </CustomSelect>
              </div>
            </div>

            <section className="cal-wrap" aria-label="출력현황 달력">
              <div className="cal-head">
                <button
                  type="button"
                  className="cal-nav-button"
                  onClick={viewMode === 'month' ? handlePreviousMonth : handlePreviousWeek}
                  aria-label="이전 기간"
                >
                  <ChevronLeft className="cal-nav-icon" />
                </button>
                <button
                  type="button"
                  className="cal-title-button"
                  onClick={handleToggleViewMode}
                  aria-label={viewMode === 'month' ? '주간 보기로 전환' : '월간 보기로 전환'}
                >
                  {getCurrentPeriodText()}
                </button>
                <button
                  type="button"
                  className="cal-nav-button"
                  onClick={viewMode === 'month' ? handleNextMonth : handleNextWeek}
                  aria-label="다음 기간"
                >
                  <ChevronRight className="cal-nav-icon" />
                </button>
              </div>
              <div className="cal-grid cal-grid-header">
                {['일', '월', '화', '수', '목', '금', '토'].map((label, index) => (
                  <div key={label} className={clsx('dow', index === 0 && 'sun')}>
                    {label}
                  </div>
                ))}
              </div>
              <div className="cal-grid cal-grid-body">
                {calendarDays.map(day => (
                  <div key={day.iso} className={clsx('cal-cell', !day.isCurrentMonth && 'out')}>
                    <div className={clsx('date', day.isSunday && 'sun')}>{day.date.getDate()}</div>
                    <div className="site-name">
                      {day.sites.length > 0
                        ? day.sites.length === 1
                          ? day.sites[0]
                          : `${day.sites[0]} 외 ${day.sites.length - 1}`
                        : ''}
                    </div>
                    <div className="work-hours">
                      {day.totalManDays > 0
                        ? Number.isInteger(day.totalManDays)
                          ? `${day.totalManDays}일`
                          : `${day.totalManDays.toFixed(1)}일`
                        : ''}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="monthly-stats-section">
              <div className="stat-grid">
                <div className="stat stat-workdays">
                  <div className="num">{monthlyStats.workDays}</div>
                  <div className="label">출근(일)</div>
                </div>
                <div className="stat stat-sites">
                  <div className="num">{monthlyStats.siteCount}</div>
                  <div className="label">현장수</div>
                </div>
                <div className="stat stat-hours">
                  <div className="num">{monthlyStats.totalManDays}</div>
                  <div className="label">총공수</div>
                </div>
              </div>
            </section>
          </section>
        )}

        {activeTab === 'salary' && (
          <section className="space-y-4">
            <div className="pay-filter-section">
              <div className="flex gap-3">
                <label className="select-shell flex-1" aria-label="급여 현장 선택">
                  <div className="box text-gray-900 dark:text-white">{salarySiteLabel}</div>
                  <span className="arrow" aria-hidden="true" />
                  <select
                    value={salarySiteId}
                    onChange={event => setSalarySiteId(event.target.value)}
                  >
                    {siteOptions.map(option => (
                      <option key={`salary-${option.value}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="select-shell flex-1" aria-label="급여 기간 선택">
                  <div className="box text-gray-900 dark:text-white">최근 {salaryPeriod}개월</div>
                  <span className="arrow" aria-hidden="true" />
                  <select
                    value={salaryPeriod}
                    onChange={event =>
                      setSalaryPeriod(event.target.value as '3' | '6' | '12' | '24')
                    }
                  >
                    <option value="3">최근 3개월</option>
                    <option value="6">최근 6개월</option>
                    <option value="12">최근 12개월</option>
                    <option value="24">최근 24개월</option>
                  </select>
                </label>
              </div>
            </div>

            <section className="stat-grid">
              <div className="stat stat-workdays">
                <div className="num">{salaryStats.workDays}</div>
                <div className="label">출근(일)</div>
              </div>
              <div className="stat stat-sites">
                <div className="num">{salaryStats.restDays}</div>
                <div className="label">휴무일</div>
              </div>
              <div className="stat stat-hours">
                <div className="num">{salaryStats.totalManDays}</div>
                <div className="label">총공수</div>
              </div>
            </section>

            <Card>
              <CardContent className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="t-h3">급여 정보 입력</h3>
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => setIsSalaryFormOpen(prev => !prev)}
                  >
                    {isSalaryFormOpen ? '접기' : '펼치기'}
                  </button>
                </div>

                {isSalaryFormOpen && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label-part block mb-1">공수(자동)</label>
                        <input
                          className="w-full h-12 px-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-900/60 text-gray-900 dark:text-white rounded-xl"
                          value={salaryStats.totalManDays}
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="label-part block mb-1">휴무일(자동)</label>
                        <input
                          className="w-full h-12 px-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-900/60 text-gray-900 dark:text-white rounded-xl"
                          value={salaryStats.restDays}
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label-part block mb-1">기본급(자동)</label>
                        <input
                          className="w-full h-12 px-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-900/60 text-gray-900 dark:text-white rounded-xl"
                          value={`₩${currentSalaryData.baseSalary.toLocaleString()}`}
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="label-part block mb-1">기본급(직접입력)</label>
                        <input
                          className="w-full h-12 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-900/60 text-gray-900 dark:text-white rounded-xl"
                          placeholder="기본급 직접입력"
                          value={manualBaseSalary}
                          onChange={event => setManualBaseSalary(event.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label-part block mb-2">고용형태</label>
                      <div className="chip-group">
                        {(['freelance', 'daily', 'regular'] as const).map(type => (
                          <button
                            key={type}
                            type="button"
                            className={clsx('chip', employmentType === type && 'active')}
                            onClick={() => setEmploymentType(type)}
                          >
                            {type === 'freelance' ? '프리' : type === 'daily' ? '일용' : '상용'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 space-y-2">
                <h3 className="t-h3">이번 달 급여 현황</h3>
                <div className="pay-summary-row">
                  <span className="t-body">기본급</span>
                  <span className="t-body font-medium">
                    ₩{currentSalaryData.baseSalary.toLocaleString()}
                  </span>
                </div>
                <div className="pay-summary-row">
                  <span className="t-body">연장 수당</span>
                  <span className="t-body font-medium">
                    ₩{currentSalaryData.overtimePay.toLocaleString()}
                  </span>
                </div>
                <div className="pay-summary-row">
                  <span className="t-body">식대</span>
                  <span className="t-body font-medium">
                    ₩{currentSalaryData.mealAllowance.toLocaleString()}
                  </span>
                </div>
                <div className="pay-summary-row border-t pt-2">
                  <span className="t-body font-bold">합계</span>
                  <span className="t-body font-bold text-primary">
                    ₩{currentSalaryData.totalSalary.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 space-y-6">
                <div>
                  <h3 className="t-h3 mb-3">최근 급여 내역</h3>
                  <Stack gap="sm">
                    {recentSalaryHistory.map((salaryRecord, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg dark:bg-slate-900/40">
                        <Row justify="between">
                          <span className="t-body font-medium">{salaryRecord.month}</span>
                          <span className="t-body">지급일: {salaryRecord.paidDate}</span>
                        </Row>
                        <Row justify="between" className="mt-1">
                          <span className="t-cap text-muted-foreground">총급여</span>
                          <span className="t-body font-semibold">
                            ₩{salaryRecord.totalSalary.toLocaleString()}
                          </span>
                        </Row>
                      </div>
                    ))}
                  </Stack>
                </div>

                <div>
                  <h4 className="t-h4 mb-3">급여 추이</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={prepareSalaryTrendData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => `₩${value.toLocaleString()}`} />
                        <Line
                          type="monotone"
                          dataKey="총급여"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="기본급"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="연장수당"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h4 className="t-h4 mb-3">급여 구성</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={prepareSalaryBreakdownData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {prepareSalaryBreakdownData().map((entry, index) => (
                            <Cell key={`salary-breakdown-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `₩${value.toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h4 className="t-h4 mb-3">급여 비교</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={prepareSalaryComparisonData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={value => `₩${(value / 10000).toFixed(0)}만`}
                        />
                        <Tooltip formatter={(value: number) => `₩${value.toLocaleString()}`} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {prepareSalaryComparisonData().map((entry, index) => (
                            <Cell key={`salary-compare-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            <section className="pay-preview">
              <div className="preview-header">
                <h3 className="t-h3">급여명세서 미리보기</h3>
                <div className="preview-zoomgroup">
                  <button
                    type="button"
                    onClick={() => setPreviewScale(scale => Math.max(50, scale - 10))}
                  >
                    -
                  </button>
                  <span>{previewScale}%</span>
                  <button
                    type="button"
                    onClick={() => setPreviewScale(scale => Math.min(150, scale + 10))}
                  >
                    +
                  </button>
                </div>
              </div>
              <div
                className="preview-stage"
                style={{ transform: `scale(${previewScale / 100})`, transformOrigin: 'top left' }}
              >
                <p className="t-body text-muted-foreground text-sm">
                  A4 미리보기 콘텐츠가 여기에 표시됩니다.
                </p>
              </div>
            </section>
          </section>
        )}
      </div>
    </MobileLayoutShell>
  )
}
