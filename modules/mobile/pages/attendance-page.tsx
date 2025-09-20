'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { MobileLayout as MobileLayoutShell } from '@/modules/mobile/components/layout/MobileLayout'
import { MobileAuthGuard } from '@/modules/mobile/components/auth/mobile-auth-guard'
import { useUnifiedAuth } from '@/hooks/use-unified-auth'
import { Card, CardContent, Button, Stack, Chip, Badge, Row } from '@/modules/shared/ui'
import { createClient } from '@/lib/supabase/client'
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
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [checkInTime, setCheckInTime] = useState<string | null>(null)
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'work' | 'salary'>('work')

  // Filters & UI states
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all')
  const [siteOptions, setSiteOptions] = useState<SiteOption[]>([{ value: 'all', label: '전체 현장' }])
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [salarySiteId, setSalarySiteId] = useState<string>('all')
  const [salaryPeriod, setSalaryPeriod] = useState<'3' | '6' | '12' | '24'>('3')
  const [employmentType, setEmploymentType] = useState<'freelance' | 'daily' | 'regular'>('freelance')
  const [isSalaryFormOpen, setIsSalaryFormOpen] = useState(false)
  const [previewScale, setPreviewScale] = useState(100)
  const [manualBaseSalary, setManualBaseSalary] = useState('')

  // Real-time data states
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Supabase client initialization
  const supabase = useMemo(() => createClient(), [])

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

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

  const todayRecord = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return attendanceData.find(record => record.date === today) ?? null
  }, [attendanceData])

  useEffect(() => {
    if (todayRecord) {
      setCheckInTime(todayRecord.checkIn)
      setCheckOutTime(todayRecord.checkOut)
      setIsCheckedIn(!!todayRecord.checkIn && !todayRecord.checkOut)
    } else {
      setCheckInTime(null)
      setCheckOutTime(null)
      setIsCheckedIn(false)
    }
  }, [todayRecord])

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
            Boolean(
              record &&
              (record.user_id === profile.id ||
                record.profile_id === profile.id)
            )

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

  const handleCheckIn = () => {
    const now = new Date()
    setIsCheckedIn(true)
    setCheckInTime(now.toTimeString().slice(0, 5))
  }

  const handleCheckOut = () => {
    const now = new Date()
    setCheckOutTime(now.toTimeString().slice(0, 5))
    setIsCheckedIn(false)
  }

  const formattedCurrentDate = currentTime.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  const currentTimeString = currentTime.toTimeString().slice(0, 8)

  // Calculate work hours for today
  const calculateWorkHours = (checkIn: string | null, checkOut: string | null): string => {
    if (!checkIn) return '-'
    if (!checkOut) return '진행 중'

    const inTime = new Date(`1970-01-01T${checkIn}:00`)
    const outTime = new Date(`1970-01-01T${checkOut}:00`)
    const diffMs = outTime.getTime() - inTime.getTime()
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    return minutes > 0 ? `${hours}시간 ${minutes}분` : `${hours}시간`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'tag1'
      case 'late':
        return 'tag4'
      case 'early':
        return 'tag3'
      case 'absent':
        return 'tag2'
      case 'in-progress':
        return 'tag3'
      default:
        return 'tag1'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present':
        return '정상'
      case 'late':
        return '지각'
      case 'early':
        return '조퇴'
      case 'absent':
        return '결근'
      case 'in-progress':
        return '진행 중'
      default:
        return '정상'
    }
  }

  // Format work hours for display
  const formatWorkHours = (workHours: number): string => {
    if (workHours === 0) return '-'
    const hours = Math.floor(workHours)
    const minutes = Math.round((workHours - hours) * 60)
    return minutes > 0 ? `${hours}시간 ${minutes}분` : `${hours}시간`
  }

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

  const handleViewModeChange = (mode: 'month' | 'week') => {
    setViewMode(mode)
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

    return results
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
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

  // Chart data preparation helper functions - memoized to prevent re-renders
  const attendanceTrendData = useMemo(() => {
    if (filteredAttendanceData.length === 0) return []

    if (viewMode === 'month') {
      const daysInMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      ).getDate()

      return Array.from({ length: daysInMonth }, (_, idx) => {
        const dateStr = format(
          new Date(currentDate.getFullYear(), currentDate.getMonth(), idx + 1),
          'yyyy-MM-dd'
        )
        const dayAttendance = filteredAttendanceData.filter(record => record.date === dateStr)
        const totalHours = dayAttendance.reduce((sum, record) => sum + (record.workHours || 0), 0)

        return {
          date: `${idx + 1}일`,
          hours: Number(totalHours.toFixed(1)),
          records: dayAttendance.length,
        }
      })
    }

    const startWeek = startOfWeek(currentDate, { locale: ko })
    return Array.from({ length: 7 }, (_, idx) => {
      const currentDay = addDays(startWeek, idx)
      const dateStr = format(currentDay, 'yyyy-MM-dd')
      const dayAttendance = filteredAttendanceData.filter(record => record.date === dateStr)
      const totalHours = dayAttendance.reduce((sum, record) => sum + (record.workHours || 0), 0)

      return {
        date: format(currentDay, 'E', { locale: ko }),
        hours: Number(totalHours.toFixed(1)),
        records: dayAttendance.length,
      }
    })
  }, [viewMode, currentDate, filteredAttendanceData])

  const attendanceStatusData = useMemo(() => {
    const statusCounts = filteredAttendanceData.reduce(
      (acc, record) => {
        acc[record.status] = (acc[record.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const statusLabels = {
      present: '출근',
      absent: '결근',
      late: '지각',
      early_leave: '조퇴',
      'in-progress': '진행 중',
      vacation: '휴가',
    }

    const colors = {
      present: '#10b981',
      absent: '#ef4444',
      late: '#f59e0b',
      early_leave: '#f97316',
      'in-progress': '#f97316',
      vacation: '#6366f1',
    }

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: statusLabels[status as keyof typeof statusLabels] || status,
      value: count,
      color: colors[status as keyof typeof colors] || '#6b7280',
    }))
  }, [filteredAttendanceData])

  const weeklyComparisonData = useMemo(() => {
    const comparisonData = [] as Array<{ week: string; hours: number; workDays: number; avgHours: number }>
    const currentWeekStart = startOfWeek(currentDate, { locale: ko })

    for (let i = 0; i < 4; i++) {
      const weekStart = addDays(currentWeekStart, -7 * i)
      const weekEnd = endOfWeek(weekStart, { locale: ko })

      const weekAttendance = filteredAttendanceData.filter(record => {
        const recordDate = parseISO(record.date)
        return recordDate >= weekStart && recordDate <= weekEnd
      })

      const totalHours = weekAttendance.reduce((sum, record) => sum + (record.workHours || 0), 0)
      const workDays = weekAttendance.filter(
        record =>
          record.status === 'present' ||
          record.status === 'late' ||
          record.status === 'in-progress'
      ).length

      comparisonData.unshift({
        week: i === 0 ? '이번주' : `${i}주 전`,
        hours: Number(totalHours.toFixed(1)),
        workDays,
        avgHours: workDays > 0 ? Number((totalHours / workDays).toFixed(1)) : 0,
      })
    }

    return comparisonData
  }, [filteredAttendanceData, currentDate])

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
      if (record.status === 'present' || record.status === 'late' || record.status === 'in-progress') {
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
      if (record.status === 'present' || record.status === 'late' || record.status === 'in-progress') {
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
      <div className="attendance-page w-full max-w-[480px] mx-auto px-4 pb-6 space-y-4">
        <header className="flex items-center justify-between pt-2">
          <h1 className="t-h2">출력정보</h1>
        </header>
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
            <div className="site-filter-section">
              <label className="select-shell" aria-label="현장 선택">
                <div className="box text-gray-900 dark:text-white">{selectedSiteLabel}</div>
                <span className="arrow" aria-hidden="true" />
                <select
                  value={selectedSiteId}
                  onChange={event => setSelectedSiteId(event.target.value)}
                >
                  {siteOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <section className="cal-wrap" aria-label="출력현황 달력">
              <div className="cal-head">
                <button
                  type="button"
                  className="cal-head-button"
                  onClick={viewMode === 'month' ? handlePreviousMonth : handlePreviousWeek}
                  aria-label="이전 기간"
                >
                  ‹
                </button>
                <div className="flex items-center gap-2">
                  <span className="cal-title">{getCurrentPeriodText()}</span>
                  <div className="flex gap-1">
                    <Button
                      variant={viewMode === 'month' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleViewModeChange('month')}
                    >
                      월
                    </Button>
                    <Button
                      variant={viewMode === 'week' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleViewModeChange('week')}
                    >
                      주
                    </Button>
                  </div>
                </div>
                <button
                  type="button"
                  className="cal-head-button"
                  onClick={viewMode === 'month' ? handleNextMonth : handleNextWeek}
                  aria-label="다음 기간"
                >
                  ›
                </button>
              </div>
              <div className="cal-grid pt-0 pb-2">
                {['일', '월', '화', '수', '목', '금', '토'].map((label, index) => (
                  <div key={label} className={clsx('dow', index === 0 && 'sun')}>
                    {label}
                  </div>
                ))}
              </div>
              <div className="cal-grid pb-4">
                {calendarDays.map(day => (
                  <div
                    key={day.iso}
                    className={clsx('calendar-cell', !day.isCurrentMonth && 'out')}
                  >
                    <span className={clsx('calendar-date', day.isSunday && 'sun')}>
                      {day.date.getDate()}
                    </span>
                    <div className="cell-data">
                      {day.sites.length > 0 ? (
                        <>
                          <span className="site-name">{day.sites[0]?.slice(0, 2)}</span>
                          {day.sites.length > 1 && (
                            <span className="site-name">외 {day.sites.length - 1}</span>
                          )}
                        </>
                      ) : null}
                      <span className="work-hours">
                        {day.totalManDays > 0 ? day.totalManDays : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="monthly-stats-section">
              <div className="stat-head">
                <span className="stat-title">월간 통계</span>
              </div>
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

            <Card>
              <CardContent className="p-3">
                <Stack gap="md">
                  <div className="text-center">
                    <h2 className="t-h1 mb-2">{currentTimeString}</h2>
                    <p className="t-body text-muted-foreground">{formattedCurrentDate}</p>
                  </div>

                  <div className="text-center space-y-2">
                    {!isCheckedIn && !checkInTime ? (
                      <Button
                        variant="primary"
                        size="lg"
                        className="w-full h-16 text-lg"
                        onClick={handleCheckIn}
                      >
                        📋 출근 체크
                      </Button>
                    ) : isCheckedIn && checkInTime ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2">
                          <Badge variant="tag1" />
                          <span className="t-body font-medium">출근 완료: {checkInTime}</span>
                        </div>
                        <Button
                          variant="gray"
                          size="lg"
                          className="w-full h-16 text-lg"
                          onClick={handleCheckOut}
                        >
                          🚪 퇴근 체크
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Badge variant="tag3" />
                        <span className="t-body font-medium">
                          {checkInTime} ~ {checkOutTime} (완료)
                        </span>
                      </div>
                    )}
                  </div>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <h3 className="t-h3 mb-3">오늘의 근무 현황</h3>
                <Stack gap="sm">
                  <Row justify="between">
                    <span className="t-body">출근 시간</span>
                    <span className="t-body font-medium">{checkInTime || '-'}</span>
                  </Row>
                  <Row justify="between">
                    <span className="t-body">퇴근 시간</span>
                    <span className="t-body font-medium">{checkOutTime || '-'}</span>
                  </Row>
                  <Row justify="between">
                    <span className="t-body">근무 시간</span>
                    <span className="t-body font-medium">
                      {calculateWorkHours(checkInTime, checkOutTime)}
                    </span>
                  </Row>
                  <Row justify="between">
                    <span className="t-body">상태</span>
                    <Chip variant="tag1">정상</Chip>
                  </Row>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 space-y-6">
                <div>
                  <h3 className="t-h3 mb-3">출근 현황 분석</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={attendanceTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip
                          labelFormatter={label => `날짜: ${label}`}
                          formatter={(value, name) => [
                            value,
                            name === 'hours' ? '근무시간' : '출근일수',
                          ]}
                        />
                        <Line
                          type="monotone"
                          dataKey="hours"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                          name="hours"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h4 className="t-h4 mb-3">출근 상태 분포</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={attendanceStatusData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {attendanceStatusData.map((entry, index) => (
                            <Cell key={`status-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`${value}일`, '일수']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h4 className="t-h4 mb-3">주간 비교</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip
                          formatter={(value, name) => {
                            if (name === 'hours') return [`${value}시간`, '총 근무시간']
                            if (name === 'workDays') return [`${value}일`, '출근일수']
                            if (name === 'avgHours') return [`${value}시간`, '평균 근무시간']
                            return [value, name]
                          }}
                        />
                        <Bar dataKey="hours" fill="#10b981" name="hours" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <h3 className="t-h3 mb-3">{viewMode === 'month' ? '월별' : '주별'} 출근 기록</h3>
                <Stack gap="sm">
                  {getFilteredAttendanceData().map((record, index) => (
                    <div
                      key={`${record.date}-${index}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-slate-900/40"
                    >
                      <div className="flex-1">
                        <p className="t-body font-medium">
                          {new Date(record.date).toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                            weekday: 'short',
                          })}
                        </p>
                        <p className="t-cap text-muted-foreground">
                          {record.checkIn} ~ {record.checkOut} ({record.workHours}h)
                        </p>
                      </div>
                      <Chip variant={getStatusColor(record.status) as any}>
                        {getStatusText(record.status)}
                      </Chip>
                    </div>
                  ))}
                </Stack>
              </CardContent>
            </Card>
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
                    onChange={event => setSalaryPeriod(event.target.value as '3' | '6' | '12' | '24')}
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
                  <span className="t-body font-medium">₩{currentSalaryData.baseSalary.toLocaleString()}</span>
                </div>
                <div className="pay-summary-row">
                  <span className="t-body">연장 수당</span>
                  <span className="t-body font-medium">₩{currentSalaryData.overtimePay.toLocaleString()}</span>
                </div>
                <div className="pay-summary-row">
                  <span className="t-body">식대</span>
                  <span className="t-body font-medium">₩{currentSalaryData.mealAllowance.toLocaleString()}</span>
                </div>
                <div className="pay-summary-row border-t pt-2">
                  <span className="t-body font-bold">합계</span>
                  <span className="t-body font-bold text-primary">₩{currentSalaryData.totalSalary.toLocaleString()}</span>
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
                          <span className="t-body font-semibold">₩{salaryRecord.totalSalary.toLocaleString()}</span>
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
                        <Line type="monotone" dataKey="총급여" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="기본급" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="연장수당" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
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
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
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
                  <button type="button" onClick={() => setPreviewScale(scale => Math.max(50, scale - 10))}>
                    -
                  </button>
                  <span>{previewScale}%</span>
                  <button type="button" onClick={() => setPreviewScale(scale => Math.min(150, scale + 10))}>
                    +
                  </button>
                </div>
              </div>
              <div
                className="preview-stage"
                style={{ transform: `scale(${previewScale / 100})`, transformOrigin: 'top left' }}
              >
                <p className="t-body text-muted-foreground text-sm">A4 미리보기 콘텐츠가 여기에 표시됩니다.</p>
              </div>
            </section>
          </section>
        )}
      </div>
    </MobileLayoutShell>
  )
}
