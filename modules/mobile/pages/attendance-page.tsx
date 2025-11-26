'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { MobileLayout as MobileLayoutShell } from '@/modules/mobile/components/layout/MobileLayout'
import { MobileAuthGuard } from '@/modules/mobile/components/auth/mobile-auth-guard'
import { useUnifiedAuth } from '@/hooks/use-unified-auth'
import { Card, CardContent, Stack, Row } from '@/modules/shared/ui'
import { createClient } from '@/lib/supabase/client'
import { BottomSheet } from '@/modules/mobile/components/ui/BottomSheet'
import { WorkLogService } from '@/modules/mobile/services/work-log.service'
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
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react'
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
  siteAddress?: string | null
  workerName?: string | null
  notes?: string | null
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
  hasRecords: boolean
}

const extractWorkProcesses = (log: any): string[] => {
  if (Array.isArray(log?.workProcesses)) return log.workProcesses
  const workContent = log?.work_content
  if (workContent) {
    if (Array.isArray(workContent.workProcesses)) return workContent.workProcesses
    if (Array.isArray(workContent.memberTypes)) return workContent.memberTypes
  }
  return []
}

const extractMaterials = (log: any): any[] => {
  if (Array.isArray(log?.materials)) return log.materials
  if (Array.isArray(log?.material_usage)) return log.material_usage
  return []
}

// MonthlySalaryApi interface removed with summary section

const formatManDays = (value?: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '0'
  const hasFraction = Math.abs(value % 1) > 0
  return hasFraction
    ? value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    : value.toLocaleString()
}

export const AttendancePage: React.FC = () => {
  return (
    <MobileAuthGuard>
      <AttendanceContent />
    </MobileAuthGuard>
  )
}

const AttendanceContent: React.FC = () => {
  const { profile, user } = useUnifiedAuth()
  const router = useRouter()
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
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false)
  const [selectedDayISO, setSelectedDayISO] = useState<string | null>(null)
  const [selectedDayRecords, setSelectedDayRecords] = useState<AttendanceRecord[]>([])
  const [dayWorkLogs, setDayWorkLogs] = useState<any[]>([])
  const [dayWorkLogsLoading, setDayWorkLogsLoading] = useState(false)
  const [dayWorkLogsError, setDayWorkLogsError] = useState<string | null>(null)

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
      siteAddress: record.sites?.address ?? null,
      workerName: record.profiles?.full_name ?? null,
      notes: record.notes ?? record.additional_notes ?? null,
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

  // Fetch full site list via service-role API (partners: skip, partner 전용 목록 사용)
  useEffect(() => {
    // 파트너/고객관리자 역할은 전체 현장 목록을 불러오지 않음
    if (profile?.role === 'customer_manager' || profile?.role === 'partner') {
      setAllSites([])
      return
    }
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
  }, [profile?.role])

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

  const closeDetailSheet = useCallback(() => {
    setIsDetailSheetOpen(false)
    setSelectedDayISO(null)
    setSelectedDayRecords([])
    setDayWorkLogs([])
    setDayWorkLogsError(null)
    setDayWorkLogsLoading(false)
  }, [])

  const openDetailSheetForDay = useCallback(
    (isoDate: string) => {
      const recordsForDay = filteredAttendanceData.filter(record => record.date === isoDate)
      if (recordsForDay.length === 0) return
      setSelectedDayISO(isoDate)
      setSelectedDayRecords(recordsForDay)
      setIsDetailSheetOpen(true)
      setDayWorkLogs([])
      setDayWorkLogsError(null)

      const siteIdForDay = recordsForDay[0]?.site_id
      if (!siteIdForDay) {
        setDayWorkLogsLoading(false)
        setDayWorkLogsError('현장 정보가 없어 작업일지를 불러올 수 없습니다.')
        return
      }

      setDayWorkLogsLoading(true)

      const mapWorkLogSummary = (log: any) => ({
        id: String(log?.id || ''),
        date: log?.date || log?.work_date || isoDate,
        siteName: log?.siteName || log?.site_name || recordsForDay[0]?.siteName || '작업일지',
        workProcesses: extractWorkProcesses(log),
        materials: extractMaterials(log),
        notes: log?.notes || log?.additional_notes || null,
        status: log?.status || 'draft',
      })

      const loadWorkLogs = async () => {
        try {
          const params = new URLSearchParams({
            site_id: siteIdForDay,
            start_date: isoDate,
            end_date: isoDate,
            limit: '5',
          })
          const response = await fetch(`/api/mobile/daily-reports?${params.toString()}`, {
            cache: 'no-store',
          })
          if (!response.ok) {
            throw new Error(`daily-reports fetch failed: ${response.status}`)
          }
          const payload = await response.json().catch(() => null)
          const reports = Array.isArray(payload?.data?.reports) ? payload.data.reports : []
          const summaries = reports.map(report => {
            const workContent = report?.work_content || {}
            const processes = Array.isArray(workContent.workProcesses)
              ? workContent.workProcesses
              : Array.isArray(workContent.memberTypes)
                ? workContent.memberTypes
                : []
            return {
              id: String(report?.id || ''),
              date: report?.work_date || isoDate,
              siteName: report?.sites?.name || recordsForDay[0]?.siteName || '작업일지',
              workProcesses: processes,
              materials: Array.isArray(report?.material_usage) ? report.material_usage : [],
              notes: report?.additional_notes || report?.notes || null,
              status: report?.status || '',
            }
          })
          if (summaries.length > 0) {
            return summaries
          }
          console.info('No daily reports found for day, attempting work log fallback.')
        } catch (error) {
          console.warn('Primary fetch for daily reports failed, falling back to work logs:', error)
        }

        const logs = await WorkLogService.getWorkLogs(
          { siteId: siteIdForDay, dateFrom: isoDate, dateTo: isoDate },
          { field: 'date', order: 'desc' }
        )
        return logs.slice(0, 5).map(mapWorkLogSummary)
      }

      loadWorkLogs()
        .then(data => {
          setDayWorkLogs(data)
          setDayWorkLogsError(null)
        })
        .catch(error => {
          console.error('Failed to load work logs for day:', error)
          setDayWorkLogs([])
          setDayWorkLogsError('작업일지를 불러오지 못했습니다.')
        })
        .finally(() => {
          setDayWorkLogsLoading(false)
        })
    },
    [filteredAttendanceData]
  )

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
        hasRecords: dayRecords.length > 0,
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

  const selectedDaySummary = useMemo(() => {
    const totalManDays = selectedDayRecords.reduce((sum, record) => {
      const hours = Number(record.workHours ?? 0)
      return sum + hours / 8
    }, 0)
    const memberMap = selectedDayRecords.reduce((map, record) => {
      const key = record.workerName || record.id
      const existing = map.get(key) || {
        name: record.workerName || '작업자',
        hours: 0,
      }
      const hours = Number(record.workHours ?? 0)
      existing.hours += Number.isFinite(hours) ? hours : 0
      map.set(key, existing)
      return map
    }, new Map<string, { name: string; hours: number }>())
    return { totalManDays, teamMembers: Array.from(memberMap.values()) }
  }, [selectedDayRecords])
  const totalSelectedManDaysRaw = Number(selectedDaySummary?.totalManDays ?? 0)
  const totalSelectedManDays = Number.isFinite(totalSelectedManDaysRaw)
    ? totalSelectedManDaysRaw
    : 0
  const selectedTeamMembers = Array.isArray(selectedDaySummary?.teamMembers)
    ? selectedDaySummary.teamMembers
    : []

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
  // API 기반 월 급여 데이터
  const [apiMonthly, setApiMonthly] = useState<any | null>(null)
  const [showAllSalaryHistory, setShowAllSalaryHistory] = useState(false)
  const [recentSalaryHistory, setRecentSalaryHistory] = useState<any[]>([])
  const [isSalarySummaryHidden, setIsSalarySummaryHidden] = useState(false)

  // 현재 선택 월 API 호출
  useEffect(() => {
    const [y, m] = salarySelectedYearMonth.split('-')
    const year = Number(y)
    const month = Number(m)
    if (!year || !month) return
    fetch(`/api/salary/monthly?year=${year}&month=${month}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(j => setApiMonthly(j?.data || null))
      .catch(() => setApiMonthly(null))
  }, [salarySelectedYearMonth])

  // 최근 N개월 내역 API 호출
  useEffect(() => {
    const months = showAllSalaryHistory ? 12 : 3
    const base = parseISO(`${salarySelectedYearMonth}-01`)
    const tasks = Array.from({ length: months }, (_, i) => {
      const d = addMonths(base, -i)
      const y = d.getFullYear()
      const m = d.getMonth() + 1
      return fetch(`/api/salary/monthly?year=${y}&month=${m}`, { cache: 'no-store' })
        .then(r => r.json())
        .then(j => ({
          label: d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' }),
          yearNumber: y,
          monthNumber: m,
          paidDate: new Date(y, m, 0).toISOString().split('T')[0],
          salary: j?.data?.salary || null,
        }))
        .catch(() => null)
    })
    Promise.all(tasks).then(arr => setRecentSalaryHistory(arr.filter(Boolean) as any[]))
  }, [salarySelectedYearMonth, showAllSalaryHistory])

  // charts removed – related helper functions deleted

  return (
    <MobileLayoutShell>
      <div className="attendance-page w-full max-w-[480px] mx-auto px-4 pt-0 pb-6 space-y-4">
        <nav
          className="line-tabs"
          style={{ width: 'calc(100% + 32px)', marginLeft: '-16px', marginRight: '-16px' }}
        >
          <button
            type="button"
            className={clsx('line-tab', activeTab === 'work' && 'active')}
            onClick={() => setActiveTab('work')}
            aria-pressed={activeTab === 'work'}
          >
            출력현황
          </button>
          <button
            type="button"
            className={clsx('line-tab', activeTab === 'salary' && 'active')}
            onClick={() => setActiveTab('salary')}
            aria-pressed={activeTab === 'salary'}
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
                  <div
                    key={day.iso}
                    className={clsx(
                      'cal-cell',
                      !day.isCurrentMonth && 'out',
                      day.hasRecords && 'cal-cell--clickable'
                    )}
                    role={day.hasRecords ? 'button' : undefined}
                    tabIndex={day.hasRecords ? 0 : -1}
                    onClick={() => day.hasRecords && openDetailSheetForDay(day.iso)}
                    onKeyDown={event => {
                      if (!day.hasRecords) return
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        openDetailSheetForDay(day.iso)
                      }
                    }}
                    aria-label={
                      day.hasRecords
                        ? `${format(day.date, 'M월 d일', { locale: ko })} 상세 보기`
                        : undefined
                    }
                  >
                    <div className={clsx('date', day.isSunday && 'sun')}>{day.date.getDate()}</div>
                    <div className="site-name">
                      {day.sites.length > 0
                        ? day.sites.length === 1
                          ? day.sites[0]
                          : `${day.sites[0]}+${day.sites.length - 1}`
                        : ''}
                    </div>
                    <div className="work-hours">
                      {day.totalManDays > 0 ? day.totalManDays.toFixed(1) : ''}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="stat-grid">
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
                <div className="num">{apiMonthly?.siteCount ?? 0}</div>
                <div className="label">현장수</div>
              </div>
              <div className="stat stat-hours">
                <div className="num">{apiMonthly?.totalManDays ?? 0}</div>
                <div className="label">공수</div>
              </div>
              <div className="stat stat-workdays">
                <div className="num">{apiMonthly?.workDays ?? 0}</div>
                <div className="label">근무일</div>
              </div>
            </section>

            <Card>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="t-body font-semibold text-[var(--text)]">급여 요약</span>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-sm font-medium text-[#1a254f]"
                    onClick={() => setIsSalarySummaryHidden(prev => !prev)}
                    aria-pressed={isSalarySummaryHidden}
                    aria-label={isSalarySummaryHidden ? '급여 요약 표시' : '급여 요약 숨김'}
                  >
                    {isSalarySummaryHidden ? (
                      <>
                        <Eye className="w-4 h-4" />
                        보기
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4" />
                        숨김
                      </>
                    )}
                  </button>
                </div>
                {isSalarySummaryHidden ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    급여 요약이 숨겨져 있습니다.
                  </div>
                ) : (
                  <>
                    <div className="pay-summary-row">
                      <span className="t-body">총 공수</span>
                      <span className="t-body font-medium">
                        {formatManDays(apiMonthly?.totalManDays)} 공수
                      </span>
                    </div>
                    <div className="pay-summary-row">
                      <span className="t-body">총지급액</span>
                      <span className="t-body font-medium">
                        ₩{(apiMonthly?.salary?.total_gross_pay ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="pay-summary-row">
                      <span className="t-body">총 공제</span>
                      <span className="t-body font-medium text-[#dc2626]">
                        -₩
                        {(
                          apiMonthly?.salary?.total_deductions ??
                          apiMonthly?.salary?.tax_deduction ??
                          0
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="pay-summary-row border-t pt-2">
                      <span className="t-body font-bold">실수령액</span>
                      <span className="t-body font-bold text-primary">
                        ₩{(apiMonthly?.salary?.net_pay ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 space-y-6">
                <div>
                  <h3 className="t-h3 mb-3">최근 급여 내역</h3>
                  <Stack gap="sm">
                    {recentSalaryHistory.map((salaryRecord: any, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          if (salaryRecord.yearNumber && salaryRecord.monthNumber) {
                            router.push(
                              `/mobile/payslip/${salaryRecord.yearNumber}/${salaryRecord.monthNumber}`
                            )
                          }
                        }}
                        className="card hover-lift p-3 w-full text-left transition-colors"
                      >
                        <Row justify="between" className="items-center recent-salary-item">
                          <span className="t-body font-medium text-[var(--text)] dark:text-[var(--text)]">
                            {salaryRecord.label}
                          </span>
                          <span className="inline-flex items-center gap-3">
                            <span className="t-cap text-muted-foreground label">지급일:</span>
                            <span className="t-cap text-muted-foreground value">
                              {salaryRecord.paidDate}
                            </span>
                            <span className="t-ctl text-[var(--nav-text-active)]">보기</span>
                          </span>
                        </Row>
                        <Row justify="between" className="mt-1">
                          <span className="t-cap text-muted-foreground label">총급여</span>
                          <span className="t-body font-semibold text-gray-900 dark:text-white">
                            ₩{(salaryRecord?.salary?.net_pay ?? 0).toLocaleString()}
                          </span>
                        </Row>
                      </button>
                    ))}
                  </Stack>
                  <div className="mt-3 space-y-2">
                    {!showAllSalaryHistory ? (
                      <button
                        type="button"
                        className="btn btn--outline w-full"
                        onClick={() => setShowAllSalaryHistory(true)}
                      >
                        더보기
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn--outline w-full"
                        onClick={() => setShowAllSalaryHistory(false)}
                      >
                        접기
                      </button>
                    )}
                    <a
                      href="/mobile/attendance/history"
                      className="btn btn--outline w-full"
                      role="button"
                    >
                      전체 급여 내역
                    </a>
                  </div>
                </div>

                {/* '급여 추이', '급여 구성', '급여 비교' 섹션 제거 */}
              </CardContent>
            </Card>
          </section>
        )}
      </div>
      <BottomSheet
        isOpen={isDetailSheetOpen}
        onClose={closeDetailSheet}
        className="attendance-detail-sheet"
      >
        {selectedDayISO ? (
          <div className="attendance-detail">
            <header className="attendance-detail-header">
              <div>
                <p className="detail-date">
                  {format(parseISO(selectedDayISO), 'yyyy년 M월 d일 (EEE)', { locale: ko })}
                </p>
                <p className="detail-site">{selectedDayRecords[0]?.siteName || '현장 미지정'}</p>
                <p className="detail-address">
                  {selectedDayRecords[0]?.siteAddress || '주소 정보 없음'}
                </p>
              </div>
              <div className="detail-mandays">
                <span>총 공수</span>
                <strong>{totalSelectedManDays.toFixed(1)}</strong>
              </div>
            </header>

            <section className="detail-section">
              <h3 className="detail-section-title">함께 근무한 팀원</h3>
              {selectedTeamMembers.length === 0 ? (
                <p className="detail-empty">출석 정보가 없습니다.</p>
              ) : (
                <ul className="team-list">
                  {selectedTeamMembers.map((member, index) => (
                    <li key={`${selectedDayISO}-${member.name || index}`} className="team-item">
                      <div>
                        <p className="team-name">{member.name}</p>
                        <p className="team-hours">
                          {Number(member.hours ?? 0).toFixed(1)}시간 근무
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="detail-section">
              <h3 className="detail-section-title">같은날 작업일지</h3>
              {dayWorkLogsLoading && <p className="detail-empty">작업일지를 불러오는 중...</p>}
              {!dayWorkLogsLoading && dayWorkLogsError && (
                <p className="detail-empty text-red-500">{dayWorkLogsError}</p>
              )}
              {!dayWorkLogsLoading && !dayWorkLogsError && dayWorkLogs.length === 0 && (
                <p className="detail-empty">등록된 작업일지가 없습니다.</p>
              )}
              {!dayWorkLogsLoading && dayWorkLogs.length > 0 && (
                <ul className="worklog-list">
                  {dayWorkLogs.map(log => (
                    <li key={log.id} className="worklog-item">
                      <div className="worklog-header">
                        <div>
                          <p className="worklog-title">{log.siteName}</p>
                          <p className="worklog-status">
                            {log.status === 'approved' ? '승인완료' : '작성중'}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="worklog-link"
                          onClick={() => router.push(`/mobile/worklog/${log.id}`)}
                        >
                          상세보기
                        </button>
                      </div>
                      {Array.isArray(log.workProcesses) && log.workProcesses.length > 0 && (
                        <div className="worklog-tags">
                          {log.workProcesses.map((process: string) => (
                            <span key={process} className="worklog-tag">
                              {process}
                            </span>
                          ))}
                        </div>
                      )}
                      {Array.isArray(log.materials) && log.materials.length > 0 && (
                        <div className="worklog-materials">
                          <span className="worklog-material-label">자재</span>
                          <p className="worklog-material-text">
                            {log.materials
                              .map((material: any) => {
                                const qty = material.quantity ? ` ${material.quantity}` : ''
                                const unit = material.unit ? `${material.unit}` : ''
                                return `${material.material_type || '자재'}${qty}${unit}`
                              })
                              .join(', ')}
                          </p>
                        </div>
                      )}
                      {log.notes && <p className="worklog-notes">{log.notes}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : (
          <div className="attendance-detail">
            <p className="detail-empty">선택된 날짜가 없습니다.</p>
          </div>
        )}
      </BottomSheet>
    </MobileLayoutShell>
  )
}
