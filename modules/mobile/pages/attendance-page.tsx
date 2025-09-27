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
// charts removed – recharts import not needed
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

type SiteAssignmentRow = {
  site_id: string | null
  is_active: boolean | null
  sites?: {
    id?: string | null
    name?: string | null
  } | null
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

// MonthlySalaryApi interface removed with summary section

export const AttendancePage: React.FC = () => {
  return (
    <MobileAuthGuard>
      <AttendanceContent />
    </MobileAuthGuard>
  )
}

const AttendanceContent: React.FC = () => {
  const { profile, user } = useUnifiedAuth()
  const [activeTab, setActiveTab] = useState<'work' | 'salary'>('work')

  // Filters & UI states
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all')
  const [siteOptions, setSiteOptions] = useState<SiteOption[]>([
    { value: 'all', label: '전체 현장' },
  ])
  const [assignmentOptions, setAssignmentOptions] = useState<SiteOption[]>([])
  const [allSites, setAllSites] = useState<SiteOption[]>([])
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedYearMonth, setSelectedYearMonth] = useState(() => format(new Date(), 'yyyy-MM'))
  // 급여 탭은 월 합산 관점으로 단순화: 현장 선택 제거
  const [salarySiteId, setSalarySiteId] = useState<string>('all')
  const [salarySelectedYearMonth, setSalarySelectedYearMonth] = useState(() =>
    format(new Date(), 'yyyy-MM')
  )
  // preview scale removed with summary/preview sections

  const userId = profile?.id ?? user?.id ?? null

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
    if (!userId) return

    const fetchWorkRecords = async () => {
      setLoading(true)

      try {
        const salaryMonths = 12
        const selectedSalaryDate = parseISO(`${salarySelectedYearMonth}-01`)
        const calendarStart = startOfWeek(startOfMonth(currentDate), { locale: ko })
        const salaryStart = startOfMonth(addMonths(selectedSalaryDate, -(salaryMonths - 1)))
        const rangeStartDate = calendarStart < salaryStart ? calendarStart : salaryStart

        const calendarEnd = endOfWeek(endOfMonth(currentDate), { locale: ko })
        const salaryEnd = endOfMonth(new Date())
        const rangeEndDate = calendarEnd > salaryEnd ? calendarEnd : salaryEnd

        const rangeStart = format(rangeStartDate, 'yyyy-MM-dd')
        const rangeEnd = format(rangeEndDate, 'yyyy-MM-dd')

        const params = new URLSearchParams({
          start_date: rangeStart,
          end_date: rangeEnd,
          limit: '1000',
        })

        const response = await fetch(`/api/mobile/work-records?${params.toString()}`, {
          cache: 'no-store',
        })

        const payload = await response.json().catch(() => null)

        if (!response.ok || payload?.success === false) {
          const message = payload?.error || response.statusText
          console.error('Error fetching work records:', message)
          setAttendanceData([])
          return
        }

        const rows: any[] = Array.isArray(payload?.data) ? payload.data : []
        const transformed = rows.map(transformWorkRecord)
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
  }, [userId, currentDate, salarySelectedYearMonth, transformWorkRecord])

  // Load assigned sites so filters include current user's 현장 목록
  useEffect(() => {
    if (!userId) return

    let isCancelled = false

    const fetchAssignments = async () => {
      try {
        const { data, error } = await supabase
          .from('site_assignments')
          .select(
            `
            site_id,
            is_active,
            assigned_date,
            sites (
              id,
              name
            )
          `
          )
          .eq('user_id', userId)
          .order('assigned_date', { ascending: false })

        if (error) {
          console.error('Error fetching site assignments:', error)
          return
        }

        if (isCancelled) return

        const assignments = (data as SiteAssignmentRow[] | null) ?? []
        const mapped = assignments
          .map(assignment => {
            if (assignment.is_active === false) {
              return null
            }

            const siteId = assignment.site_id ?? assignment.sites?.id ?? null
            if (!siteId) {
              return null
            }

            const siteName = assignment.sites?.name?.trim()
            return {
              value: siteId,
              label: siteName && siteName.length > 0 ? siteName : '현장 미지정',
            }
          })
          .filter((option): option is SiteOption => option !== null)

        const uniqueAssignmentsMap = new Map<string, SiteOption>(
          mapped.map(option => [option.value, option])
        )

        const role = profile?.role
        const shouldLoadAllSites = role
          ? ['worker', 'site_manager', 'admin', 'system_admin', 'customer_manager'].includes(role)
          : false

        if (shouldLoadAllSites) {
          try {
            const { data: allSites, error: allSitesError } = await supabase
              .from('sites')
              .select('id, name')
              .order('name', { ascending: true })

            if (!allSitesError && Array.isArray(allSites)) {
              allSites.forEach(site => {
                if (!site?.id) return
                const label = site.name && site.name.trim().length > 0 ? site.name : '현장 미지정'
                uniqueAssignmentsMap.set(site.id, { value: site.id, label })
              })
            }
          } catch (allSitesErr) {
            console.error('Error loading full site list:', allSitesErr)
          }
        }

        if (uniqueAssignmentsMap.size === 0 && profile?.site_id) {
          try {
            const { data: siteRecord, error: siteError } = await supabase
              .from('sites')
              .select('id, name')
              .eq('id', profile.site_id)
              .maybeSingle()

            if (!siteError && siteRecord?.id) {
              uniqueAssignmentsMap.set(siteRecord.id, {
                value: siteRecord.id,
                label:
                  siteRecord.name && siteRecord.name.trim().length > 0
                    ? siteRecord.name
                    : '현장 미지정',
              })
            }
          } catch (siteFetchError) {
            console.error('Error loading fallback site:', siteFetchError)
          }
        }

        if (profile?.organization_id) {
          try {
            const response = await fetch(
              `/api/sites/by-partner?partner_company_id=${encodeURIComponent(profile.organization_id)}`,
              { cache: 'no-store' }
            )

            if (response.ok) {
              const partnerSites = await response.json()
              const siteArray = Array.isArray(partnerSites)
                ? partnerSites
                : Array.isArray(partnerSites?.data)
                  ? partnerSites.data
                  : []

              siteArray.forEach(site => {
                if (!site?.id) return
                const label = site.name && site.name.trim().length > 0 ? site.name : '현장 미지정'
                uniqueAssignmentsMap.set(site.id, { value: site.id, label })
              })
            }
          } catch (partnerSiteError) {
            console.error('Error fetching partner sites:', partnerSiteError)
          }
        }

        setAssignmentOptions(Array.from(uniqueAssignmentsMap.values()))
      } catch (err) {
        console.error('Error loading site assignments:', err)
      }
    }

    fetchAssignments()

    return () => {
      isCancelled = true
    }
  }, [userId, profile?.site_id, profile?.role, profile?.organization_id, supabase])

  // Fetch full site list via service-role API
  useEffect(() => {
    const controller = new AbortController()

    const fetchAllSites = async () => {
      try {
        const response = await fetch('/api/mobile/sites/list', {
          cache: 'no-store',
          signal: controller.signal,
        })

        if (!response.ok) {
          console.error('Failed to load site list:', response.statusText)
          return
        }

        const payload = await response.json().catch(() => null)
        if (!payload || payload.success === false) {
          console.error('Failed to load site list:', payload?.error)
          return
        }

        const sitesArray = Array.isArray(payload?.data) ? payload.data : []
        const options = sitesArray
          .filter(site => site?.id)
          .map(site => ({
            value: site.id,
            label: site.name && site.name.trim().length > 0 ? site.name : '현장 미지정',
          }))

        setAllSites(options)
      } catch (error) {
        if (controller.signal.aborted) return
        console.error('Unexpected error loading site list:', error)
      }
    }

    fetchAllSites()

    return () => controller.abort()
  }, [])

  // Derive site filter options from loaded records
  useEffect(() => {
    const uniqueSites = new Map<string, string>()

    allSites.forEach(option => {
      if (option.value) {
        uniqueSites.set(option.value, option.label)
      }
    })

    assignmentOptions.forEach(option => {
      if (option.value && option.value !== 'all') {
        uniqueSites.set(option.value, option.label)
      }
    })

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
  }, [attendanceData, assignmentOptions, allSites, selectedSiteId, salarySiteId])

  const siteLabelsById = useMemo(() => {
    const map = new Map<string, string>()

    allSites.forEach(option => {
      if (option.value && option.value !== 'all') {
        map.set(option.value, option.label)
      }
    })

    assignmentOptions.forEach(option => {
      if (option.value && option.value !== 'all' && !map.has(option.value)) {
        map.set(option.value, option.label)
      }
    })

    attendanceData.forEach(record => {
      if (
        record.site_id &&
        record.siteName &&
        record.siteName.trim() &&
        record.siteName.trim() !== '현장 미지정'
      ) {
        map.set(record.site_id, record.siteName.trim())
      }
    })

    return map
  }, [allSites, assignmentOptions, attendanceData])

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
    if (!userId) return

    const channel = supabase
      .channel(`work-records-${userId}`)
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
            Boolean(record && (record.user_id === userId || record.profile_id === userId))

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
  const calculateMonthlySalary = (records: AttendanceRecord[], targetYearMonth: string) => {
    if (!records || records.length === 0) {
      return {
        baseSalary: 0,
        overtimePay: 0,
        mealAllowance: 0,
        totalSalary: 0,
      }
    }

    const targetDate = parseISO(`${targetYearMonth}-01`)
    const targetMonth = targetDate.getMonth()
    const targetYear = targetDate.getFullYear()

    // Filter attendance for target month
    const monthlyAttendance = records.filter(record => {
      const recordDate = new Date(record.date)
      return recordDate.getMonth() === targetMonth && recordDate.getFullYear() === targetYear
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

  const handleSalaryYearMonthChange = (value: string) => {
    setSalarySelectedYearMonth(value)
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

  const formatSiteLabelForCalendar = useCallback((rawName: string) => {
    const base = rawName ?? ''
    const cleaned = base
      .replace(/\[[^\]]*\]/g, ' ')
      .replace(/\([^)]*\)/g, ' ')
      .replace(/현장|사업장|사이트|지점|공사|프로젝트/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    const compact = cleaned.replace(/\s+/g, '').trim()

    if (!compact) {
      return '미지'
    }

    const normalized = compact.normalize('NFC')
    return normalized.length >= 2 ? normalized.slice(0, 2) : normalized
  }, [])

  const calendarDays = useMemo(() => {
    const summarizeDay = (targetDate: Date) => {
      const iso = format(targetDate, 'yyyy-MM-dd')
      const dayRecords = filteredAttendanceData.filter(record => record.date === iso)
      const totalHours = dayRecords.reduce((sum, record) => sum + (record.workHours || 0), 0)
      const totalManDays = totalHours / 8
      const uniqueSiteLabels: string[] = []
      dayRecords
        .map(record => {
          const normalizedName = (() => {
            if (
              record.siteName &&
              record.siteName.trim() &&
              record.siteName.trim() !== '현장 미지정'
            ) {
              return record.siteName.trim()
            }
            if (record.site_id) {
              const candidate = siteLabelsById.get(record.site_id)
              if (candidate && candidate.trim()) {
                return candidate.trim()
              }
            }
            return '미지정'
          })()

          return formatSiteLabelForCalendar(normalizedName)
        })
        .forEach(label => {
          if (label && !uniqueSiteLabels.includes(label)) {
            uniqueSiteLabels.push(label)
          }
        })

      if (uniqueSiteLabels.length > 1 && uniqueSiteLabels[0] === '미지') {
        const firstValidIndex = uniqueSiteLabels.findIndex(label => label !== '미지')
        if (firstValidIndex > 0) {
          const [firstValid] = uniqueSiteLabels.splice(firstValidIndex, 1)
          uniqueSiteLabels.unshift(firstValid)
        }
      }

      return {
        date: targetDate,
        iso,
        isCurrentMonth: targetDate.getMonth() === currentDate.getMonth(),
        isSunday: targetDate.getDay() === 0,
        totalHours: Number(totalHours.toFixed(1)),
        totalManDays: Number(totalManDays.toFixed(1)),
        sites: dayRecords.length > 0 ? uniqueSiteLabels : [],
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
  }, [filteredAttendanceData, currentDate, viewMode, formatSiteLabelForCalendar, siteLabelsById])

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

  const salaryYearMonthOptions = yearMonthOptions

  const salarySelectedYearMonthLabel = useMemo(() => {
    const matchedOption = salaryYearMonthOptions.find(
      option => option.value === salarySelectedYearMonth
    )

    if (matchedOption) {
      return matchedOption.label
    }

    const [yearStr, monthStr] = salarySelectedYearMonth.split('-')
    const year = Number(yearStr)
    const month = Number(monthStr) - 1

    if (!Number.isNaN(year) && !Number.isNaN(month)) {
      return format(new Date(year, month, 1), 'yyyy년 MM월', { locale: ko })
    }

    return format(new Date(), 'yyyy년 MM월', { locale: ko })
  }, [salaryYearMonthOptions, salarySelectedYearMonth])

  // 현장 라벨은 사용하지 않음(드롭다운 제거)
  const salarySiteLabel = useMemo(() => '전체 현장', [])

  const salaryStats = useMemo(() => {
    if (salaryAttendanceData.length === 0) {
      return { workDays: 0, siteCount: 0, totalManDays: 0 }
    }

    const targetDate = parseISO(`${salarySelectedYearMonth}-01`)
    const monthStart = startOfMonth(targetDate)
    const monthEnd = endOfMonth(targetDate)

    const attendanceInPeriod = salaryAttendanceData.filter(record => {
      const recordDate = parseISO(record.date)
      return recordDate >= monthStart && recordDate <= monthEnd
    })

    const workDaySet = new Set<string>()
    const siteSet = new Set<string>()
    let totalHours = 0

    attendanceInPeriod.forEach(record => {
      if (
        record.status === 'present' ||
        record.status === 'late' ||
        record.status === 'in-progress'
      ) {
        workDaySet.add(record.date)
      }
      if (record.site_id) siteSet.add(record.site_id)
      totalHours += record.workHours || 0
    })

    return {
      workDays: workDaySet.size,
      siteCount: siteSet.size,
      totalManDays: Number((totalHours / 8).toFixed(1)),
    }
  }, [salaryAttendanceData, salarySelectedYearMonth])

  // Removed monthly salary summary fetch (UI section removed)

  // Calculate recent salary history (last 3 months)
  const calculateRecentSalaryHistory = (records: AttendanceRecord[], targetYearMonth: string) => {
    const history = []
    const baseDate = parseISO(`${targetYearMonth}-01`)

    for (let i = 0; i < 3; i++) {
      const targetDate = addMonths(baseDate, -i)
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
        yearNumber: year,
        monthNumber: month + 1,
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
    () => calculateMonthlySalary(salaryAttendanceData, salarySelectedYearMonth),
    [salaryAttendanceData, salarySelectedYearMonth]
  )
  const recentSalaryHistory = useMemo(
    () => calculateRecentSalaryHistory(salaryAttendanceData, salarySelectedYearMonth),
    [salaryAttendanceData, salarySelectedYearMonth]
  )

  const salaryTaxInfo = useMemo(() => {
    const gross = currentSalaryData.totalSalary
    const incomeTax = Math.round(gross * 0.033)
    const localTax = Math.round(gross * 0.003)
    const netPay = Math.max(gross - incomeTax - localTax, 0)

    return {
      incomeTax,
      localTax,
      netPay,
    }
  }, [currentSalaryData.totalSalary])

  // charts removed – related helper functions deleted

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
            <div className="grid grid-cols-2 gap-3">
              <div className="w-full">
                <CustomSelect value={selectedSiteId} onValueChange={setSelectedSiteId}>
                  <CustomSelectTrigger
                    className={clsx(
                      'calendar-filter-trigger text-[15px] font-semibold w-full',
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
                      'calendar-filter-trigger text-[15px] font-semibold w-full',
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
                      {day.totalManDays > 0 ? day.totalManDays.toFixed(1) : ''}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="monthly-stats-section">
              <div className="stat-grid">
                <div className="stat stat-sites">
                  <div className="num">{monthlyStats.siteCount}</div>
                  <div className="label">현장수</div>
                </div>
                <div className="stat stat-hours">
                  <div className="num">{monthlyStats.totalManDays}</div>
                  <div className="label">공수</div>
                </div>
                <div className="stat stat-workdays">
                  <div className="num">{monthlyStats.workDays}</div>
                  <div className="label">근무일</div>
                </div>
              </div>
            </section>
          </section>
        )}

        {activeTab === 'salary' && (
          <section className="space-y-4">
            <div className="pay-filter-section">
              <div className="grid grid-cols-1 gap-3">
                <div className="w-full">
                  <CustomSelect
                    value={salarySelectedYearMonth}
                    onValueChange={handleSalaryYearMonthChange}
                  >
                    <CustomSelectTrigger
                      className={clsx(
                        'calendar-filter-trigger text-[15px] font-semibold w-full',
                        'dark:!bg-slate-900/80 dark:!text-slate-100 dark:!border-[#3a4048]'
                      )}
                      aria-label="연도와 월 선택"
                    >
                      <CustomSelectValue>{salarySelectedYearMonthLabel}</CustomSelectValue>
                    </CustomSelectTrigger>
                    <CustomSelectContent>
                      {salaryYearMonthOptions.map(option => (
                        <CustomSelectItem key={`salary-month-${option.value}`} value={option.value}>
                          {option.label}
                        </CustomSelectItem>
                      ))}
                    </CustomSelectContent>
                  </CustomSelect>
                </div>
              </div>
            </div>

            {/* '이번 달 급여 요약' 섹션 제거됨 */}

            <section className="stat-grid">
              <div className="stat stat-sites">
                <div className="num">{salaryStats.siteCount}</div>
                <div className="label">현장수</div>
              </div>
              <div className="stat stat-hours">
                <div className="num">
                  {Number.isInteger(salaryStats.totalManDays)
                    ? salaryStats.totalManDays
                    : salaryStats.totalManDays.toFixed(1)}
                </div>
                <div className="label">공수</div>
              </div>
              <div className="stat stat-workdays">
                <div className="num">{salaryStats.workDays}</div>
                <div className="label">근무일</div>
              </div>
            </section>

            <Card>
              <CardContent className="p-3 space-y-2">
                <div className="pay-summary-row">
                  <span className="t-body">기본급</span>
                  <span className="t-body font-medium">
                    ₩{currentSalaryData.baseSalary.toLocaleString()}
                  </span>
                </div>
                <div className="pay-summary-row">
                  <span className="t-body">출근(일)</span>
                  <span className="t-body font-medium">{salaryStats.workDays}일</span>
                </div>
                <div className="pay-summary-row">
                  <span className="t-body">휴무</span>
                  <span className="t-body font-medium">{salaryStats.restDays}일</span>
                </div>
                <div className="pay-summary-row">
                  <span className="t-body">실제 공수</span>
                  <span className="t-body font-medium">
                    {Number.isInteger(salaryStats.totalManDays)
                      ? `${salaryStats.totalManDays}공수`
                      : `${salaryStats.totalManDays.toFixed(1)}공수`}
                  </span>
                </div>
                <div className="pay-summary-row">
                  <span className="t-body">소득세 (3.3%)</span>
                  <span className="t-body font-medium text-[#dc2626]">
                    -₩{salaryTaxInfo.incomeTax.toLocaleString()}
                  </span>
                </div>
                <div className="pay-summary-row">
                  <span className="t-body">지방소득세 (0.3%)</span>
                  <span className="t-body font-medium text-[#dc2626]">
                    -₩{salaryTaxInfo.localTax.toLocaleString()}
                  </span>
                </div>
                <div className="pay-summary-row border-t pt-2">
                  <span className="t-body font-bold">실수령액</span>
                  <span className="t-body font-bold text-primary">
                    ₩{salaryTaxInfo.netPay.toLocaleString()}
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
                      <div
                        key={index}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (!userId) return
                          const y = (salaryRecord as any).yearNumber
                          const m = (salaryRecord as any).monthNumber
                          if (y && m) {
                            window.open(`/payslip/${userId}/${y}/${m}`, '_blank')
                          }
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            if (!userId) return
                            const y = (salaryRecord as any).yearNumber
                            const m = (salaryRecord as any).monthNumber
                            if (y && m) {
                              window.open(`/payslip/${userId}/${y}/${m}`, '_blank')
                            }
                          }
                        }}
                        className="p-3 bg-gray-50 rounded-lg dark:bg-slate-900/40 cursor-pointer"
                      >
                        <Row justify="between" className="items-center">
                          <span className="t-body font-medium">{salaryRecord.month}</span>
                          <span className="inline-flex items-center gap-3">
                            <span className="t-cap text-muted-foreground">
                              지급일: {salaryRecord.paidDate}
                            </span>
                            <span className="t-ctl text-[#0068FE]">보기</span>
                          </span>
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

                {/* '급여 추이', '급여 구성', '급여 비교' 섹션 제거 */}
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </MobileLayoutShell>
  )
}
