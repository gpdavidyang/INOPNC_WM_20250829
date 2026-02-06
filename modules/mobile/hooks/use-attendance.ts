'use client'

import { batchUpsertMyLabor } from '@/app/actions/mobile/daily-reports'
import { useUnifiedAuth } from '@/hooks/use-unified-auth'
import { createClient } from '@/lib/supabase/client'
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  AttendanceRecord,
  CalendarDaySummary,
  SiteAssignmentRow,
  SiteOption,
} from '../types/attendance'

export const useAttendance = () => {
  const { profile, user } = useUnifiedAuth()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const userId = profile?.id ?? user?.id ?? null

  // Tabs & Navigation
  const [activeTab, setActiveTab] = useState<'work' | 'salary'>('work')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedYearMonth, setSelectedYearMonth] = useState(() => format(new Date(), 'yyyy-MM'))
  const [salarySelectedYearMonth, setSalarySelectedYearMonth] = useState(() =>
    format(new Date(), 'yyyy-MM')
  )

  // Status Filter
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'approved' | 'rejected'>(
    'all'
  )

  // Data States
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [siteOptions, setSiteOptions] = useState<SiteOption[]>([
    { value: 'all', label: '전체 현장' },
  ])
  const [allSites, setAllSites] = useState<SiteOption[]>([])
  const [assignmentOptions, setAssignmentOptions] = useState<SiteOption[]>([])
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all')

  // Detail Sheet States
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false)
  const [selectedDayISO, setSelectedDayISO] = useState<string | null>(null)

  // Batch Edit State
  // Map<siteId, hoursString> e.g. { 'site-a': '1.0', 'site-b': '0.5' }
  const [editedRecords, setEditedRecords] = useState<Record<string, string>>({})
  const [selectedDayRecords, setSelectedDayRecords] = useState<AttendanceRecord[]>([])
  const [isInputSubmitting, setIsInputSubmitting] = useState(false)

  const openDetailSheet = (dateISO: string) => {
    // Check if we have records for this day
    const dayRecords = attendanceData.filter(r => r.date === dateISO && r.status !== 'absent')

    // Privacy: Only show 'isMe' records in the detail sheet immediately?
    // The requirement says: "My Labor Only".
    // We will filter here for the state.
    const myRecords = dayRecords.filter(r => r.isMe)

    if (dayRecords.length === 0) {
      // Empty date -> Ask to create
      setEmptyDateTarget(dateISO)
      setShowEmptyDateConfirm(true)
    } else {
      // Has records -> Open detail
      setSelectedDayISO(dateISO)
      setSelectedDayRecords(myRecords) // Only my records

      // Initialize editedRecords
      const initialEdits: Record<string, string> = {}
      myRecords.forEach(r => {
        if (r.siteId) {
          initialEdits[r.siteId] = ((r.laborHours || 0) / 8).toFixed(1)
        }
      })
      setEditedRecords(initialEdits)

      setIsDetailSheetOpen(true)
    }
  }

  const closeDetailSheet = () => {
    setIsDetailSheetOpen(false)
    setSelectedDayISO(null)
    setSelectedDayRecords([])
    setEditedRecords({})
  }

  const handleLaborChange = (siteId: string, value: string) => {
    setEditedRecords(prev => ({
      ...prev,
      [siteId]: value,
    }))
  }

  const handleBatchSubmit = async () => {
    if (!selectedDayISO) return

    setIsInputSubmitting(true)
    try {
      const updates = Object.entries(editedRecords).map(([siteId, hoursStr]) => ({
        siteId,
        workDate: selectedDayISO,
        hours: parseFloat(hoursStr) * 8,
      }))

      if (updates.length === 0) {
        toast.info('변경할 내용이 없습니다.')
        setIsInputSubmitting(false)
        return
      }

      const res = await batchUpsertMyLabor(updates)

      if (res.success) {
        toast.success(res.message || '저장되었습니다.')
        closeDetailSheet()
        await fetchWorkRecords()
      } else {
        toast.error(res.error || '저장에 실패했습니다.')
      }
    } catch (error) {
      toast.error('오류가 발생했습니다.')
    } finally {
      setIsInputSubmitting(false)
    }
  }

  const handleAddSiteNavigation = () => {
    if (!selectedDayISO) return
    // Navigate to Work Log Creation with context
    // Requirement 2.4: "Calendar > Work Log Creation" flow
    const routerPath = `/mobile/worklog?mode=create&date=${selectedDayISO}`
    router.push(routerPath)
  }

  // Empty Date Confirmation
  const [showEmptyDateConfirm, setShowEmptyDateConfirm] = useState(false)
  const [emptyDateTarget, setEmptyDateTarget] = useState<string | null>(null)

  // Day Work Logs
  const [dayWorkLogs, setDayWorkLogs] = useState<any[]>([])
  const [dayWorkLogsLoading, setDayWorkLogsLoading] = useState(false)
  const [dayWorkLogsError, setDayWorkLogsError] = useState<string | null>(null)
  const [activeWorkLogId, setActiveWorkLogId] = useState<string | null>(null)

  // Salary API Data
  const [apiMonthly, setApiMonthly] = useState<any | null>(null)
  const [recentSalaryHistory, setRecentSalaryHistory] = useState<any[]>([])
  const [showAllSalaryHistory, setShowAllSalaryHistory] = useState(false)

  const transformWorkRecord = useCallback(
    (record: any): AttendanceRecord => {
      const rawWorkHours =
        typeof record.work_hours === 'number'
          ? record.work_hours
          : typeof record.man_days === 'number'
            ? record.man_days * 8
            : typeof record.labor_hours === 'number'
              ? record.labor_hours <= 3
                ? record.labor_hours * 8
                : record.labor_hours
              : 0

      const rawLaborHours =
        typeof record.man_days === 'number'
          ? record.man_days * 8
          : typeof record.labor_hours === 'number'
            ? record.labor_hours <= 3
              ? record.labor_hours * 8
              : record.labor_hours
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

      const rawDate = record.work_date || ''
      const dateOnly = typeof rawDate === 'string' ? rawDate.split(/[T ]/)[0] : rawDate

      return {
        id: record.id,
        date: dateOnly,
        workDate: dateOnly,
        workHours: Number(workHoursValue.toFixed(2)),
        laborHours: Number(laborHoursValue.toFixed(2)),
        overtimeHours: Number((record.overtime_hours ?? 0).toFixed(2)),
        status: computedStatus,
        site_id: record.site_id ?? null,
        siteId: record.site_id ?? null,
        siteName:
          record.sites?.name ||
          (Array.isArray(record.sites) ? record.sites[0]?.name : null) ||
          '현장 미지정',
        siteAddress:
          record.sites?.address ||
          (Array.isArray(record.sites) ? record.sites[0]?.address : null) ||
          null,
        workerName:
          record.profiles?.full_name ||
          (Array.isArray(record.profiles) ? record.profiles[0]?.full_name : null) ||
          null,
        notes: record.notes ?? record.additional_notes ?? null,
        raw: record,
        isMe: (userId && (record.user_id === userId || record.profile_id === userId)) || false,
      }
    },
    [userId]
  )

  const fetchWorkRecords = useCallback(async () => {
    if (!userId) return
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
  }, [userId, currentDate, salarySelectedYearMonth, transformWorkRecord])

  useEffect(() => {
    fetchWorkRecords()
  }, [fetchWorkRecords])

  const fetchAssignments = useCallback(async () => {
    if (!userId) return
    try {
      const { data, error } = await supabase
        .from('site_assignments')
        .select(
          `
          site_id,
          is_active,
          assigned_date,
          sites (id, name)
        `
        )
        .eq('user_id', userId)
        .order('assigned_date', { ascending: false })

      if (error) throw error

      const assignments = (data as SiteAssignmentRow[] | null) ?? []
      const mapped = assignments
        .map(assignment => {
          if (assignment.is_active === false) return null
          const siteId = assignment.site_id ?? assignment.sites?.id ?? null
          if (!siteId) return null
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
      setAssignmentOptions(Array.from(uniqueAssignmentsMap.values()))
    } catch (error) {
      console.error('Error fetching site assignments:', error)
    }
  }, [userId, supabase])

  const fetchAllSites = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('id, name')
        .order('name', { ascending: true })

      if (error) throw error
      if (Array.isArray(data)) {
        const mapped = data.map(s => ({ value: s.id, label: s.name }))
        setAllSites(mapped)
        setSiteOptions([{ value: 'all', label: '전체 현장' }, ...mapped])
      }
    } catch (error) {
      console.error('Error fetching all sites:', error)
    }
  }, [supabase])

  useEffect(() => {
    fetchAssignments()
    fetchAllSites()
  }, [fetchAssignments, fetchAllSites])

  const handleSyncCalendar = async () => {
    const targetUserId = userId
    if (!targetUserId) {
      toast.error('사용자 정보가 없습니다.')
      return
    }
    setIsSyncing(true)
    toast.info('데이터 분석 및 동기화 중...')

    try {
      const start = startOfMonth(subMonths(currentDate, 12)).toISOString()
      const end = endOfMonth(addMonths(currentDate, 12)).toISOString()

      const { data: reports, error } = await supabase
        .from('worker_assignments')
        .select(
          `
          daily_report_id,
          hours,
          labor_hours,
          daily_report:daily_reports!inner (id, work_date, site_id, status)
        `
        )
        .eq('profile_id', targetUserId)
        .gte('daily_report.work_date', start)
        .lte('daily_report.work_date', end)

      const { data: authoredReports } = await supabase
        .from('daily_reports')
        .select('id, work_date, site_id, status')
        .eq('created_by', targetUserId)
        .gte('work_date', start)
        .lte('work_date', end)

      if (error) throw error

      const combinedReports = [...(reports || [])]
      authoredReports?.forEach(ar => {
        const exists = combinedReports.find((r: any) => r.daily_report?.id === ar.id)
        if (!exists) {
          combinedReports.push({
            daily_report_id: ar.id,
            hours: 0,
            labor_hours: 1,
            daily_report: ar,
          } as any)
        }
      })

      if (combinedReports.length === 0) {
        toast.info('동기화할 데이터가 없습니다.')
        setIsSyncing(false)
        return
      }

      let restoredCount = 0
      for (const row of combinedReports) {
        const report = (row as any).daily_report
        const rawHours = (row as any).hours || ((row as any).labor_hours || 0) * 8
        const hours = rawHours || 8

        const { data: existing } = await supabase
          .from('work_records')
          .select('id')
          .eq('daily_report_id', report.id)
          .eq('user_id', targetUserId)
          .maybeSingle()

        if (!existing) {
          const { error: insertError } = await supabase.from('work_records').insert({
            user_id: targetUserId,
            profile_id: targetUserId,
            daily_report_id: report.id,
            site_id: report.site_id,
            work_date: report.work_date,
            work_hours: hours,
            labor_hours: hours / 8,
            status: 'submitted',
          })
          if (!insertError) restoredCount++
        }
      }

      if (restoredCount > 0) {
        toast.success(`${restoredCount}건의 데이터를 복구했습니다.`)
        fetchWorkRecords()
      } else {
        toast.success('데이터가 이미 최신 상태입니다.')
      }
    } catch (e: any) {
      toast.error('동기화 실패')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleYearMonthChange = (value: string) => {
    setSelectedYearMonth(value)
    const [year, month] = value.split('-').map(Number)
    const newDate = new Date(year, month - 1, 1)
    setCurrentDate(newDate)
  }

  const handleSalaryYearMonthChange = (value: string) => {
    setSalarySelectedYearMonth(value)
  }

  const handleWorkLogClick = (logId: string) => {
    setActiveWorkLogId(logId)
  }

  const handleWorkLogDetailClose = () => {
    setActiveWorkLogId(null)
  }

  // Effect for day work logs
  useEffect(() => {
    if (isDetailSheetOpen && selectedDayISO) {
      setDayWorkLogsLoading(true)
      setDayWorkLogsError(null)
      const siteId = selectedSiteId !== 'all' ? selectedSiteId : undefined

      const { WorkLogService } = require('../services/work-log.service')
      WorkLogService.getWorkLogs({ siteId, dateFrom: selectedDayISO, dateTo: selectedDayISO })
        .then((logs: any[]) => {
          const mapped = logs.map(log => ({
            id: log.id,
            siteName: log.siteName || '현장 미지정',
            status: log.status,
            workProcesses: log.workProcesses || [],
            materials: log.materials || [],
            notes: log.notes,
          }))
          setDayWorkLogs(mapped)
        })
        .catch((err: Error) => {
          setDayWorkLogsError(err.message)
        })
        .finally(() => {
          setDayWorkLogsLoading(false)
        })
    }
  }, [isDetailSheetOpen, selectedDayISO, selectedSiteId])

  // Salary Data Fetching
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

  // Memoized values for UI
  const siteLabelsById = useMemo(() => {
    return new Map(siteOptions.map(opt => [opt.value, opt.label]))
  }, [siteOptions])

  const filteredAttendanceData = useMemo(() => {
    let data = attendanceData

    if (selectedSiteId !== 'all') {
      data = data.filter(record => record.siteId === selectedSiteId)
    }

    if (statusFilter !== 'all') {
      data = data.filter(record => {
        if (statusFilter === 'approved') return ['approved', 'present'].includes(record.status)
        if (statusFilter === 'submitted')
          return ['submitted', 'in-progress'].includes(record.status)
        if (statusFilter === 'rejected') return record.status === 'rejected'
        return true
      })
    }

    return data
  }, [attendanceData, selectedSiteId, statusFilter])

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
        ['present', 'late', 'in-progress', 'submitted', 'completed'].includes(record.status) ||
        record.workHours > 0
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
    if (!compact) return '미지'
    const normalized = compact.normalize('NFC')
    return normalized.length >= 2 ? normalized.slice(0, 2) : normalized
  }, [])

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

  const calendarDays = useMemo(() => {
    const summarizeDay = (targetDate: Date) => {
      const iso = format(targetDate, 'yyyy-MM-dd')
      const dayRecords = filteredAttendanceData.filter(record => record.date === iso)
      const totalHours = dayRecords.reduce((sum, record) => sum + (record.workHours || 0), 0)
      const uniqueSiteLabels: string[] = []
      dayRecords.forEach(record => {
        const name =
          record.siteName ||
          (record.site_id ? siteLabelsById.get(record.site_id) : '미지정') ||
          '미지정'
        const label = formatSiteLabelForCalendar(name)
        if (label && !uniqueSiteLabels.includes(label)) uniqueSiteLabels.push(label)
      })
      const approvedLabor = dayRecords
        .filter(r => ['approved', 'present'].includes(r.status))
        .reduce((s, r) => s + (r.laborHours || 0), 0)
      const submittedLabor = dayRecords
        .filter(r => ['submitted', 'in-progress'].includes(r.status))
        .reduce((s, r) => s + (r.laborHours || 0), 0)
      const rejectedLabor = dayRecords
        .filter(r => r.status === 'rejected')
        .reduce((s, r) => s + (r.laborHours || 0), 0)

      return {
        date: targetDate,
        iso,
        isCurrentMonth: targetDate.getMonth() === currentDate.getMonth(),
        isSunday: targetDate.getDay() === 0,
        totalHours,
        totalManDays: totalHours / 8,
        approvedManDays: approvedLabor / 8,
        submittedManDays: submittedLabor / 8,
        rejectedManDays: rejectedLabor / 8,
        sites: uniqueSiteLabels,
        hasRecords: dayRecords.length > 0,
      } as CalendarDaySummary
    }

    const start = startOfWeek(startOfMonth(currentDate), {
      locale: ko,
    })
    const end = endOfWeek(endOfMonth(currentDate), {
      locale: ko,
    })
    const days: CalendarDaySummary[] = []
    let cursor = start
    while (cursor <= end) {
      days.push(summarizeDay(cursor))
      cursor = addDays(cursor, 1)
    }
    return days
  }, [filteredAttendanceData, currentDate, formatSiteLabelForCalendar, siteLabelsById])

  const selectedYearMonthLabel = useMemo(() => {
    const opt = yearMonthOptions.find(o => o.value === selectedYearMonth)
    if (opt) return opt.label
    const [y, m] = selectedYearMonth.split('-').map(Number)
    return format(new Date(y, m - 1, 1), 'yyyy년 MM월', { locale: ko })
  }, [yearMonthOptions, selectedYearMonth])

  const getCurrentPeriodText = () => {
    return selectedYearMonthLabel
  }

  const handleProceedWithEmptyDate = () => {
    if (!emptyDateTarget) return
    setShowEmptyDateConfirm(false)
    const routerPath = `/mobile/worklog?mode=create&date=${emptyDateTarget}${selectedSiteId !== 'all' ? `&siteId=${selectedSiteId}` : ''}`
    router.push(routerPath)
  }

  const handleNextMonth = () => {
    const newDate = addMonths(currentDate, 1)
    setCurrentDate(newDate)
    setSelectedYearMonth(format(newDate, 'yyyy-MM'))
  }

  const handlePreviousMonth = () => {
    const newDate = addMonths(currentDate, -1)
    setCurrentDate(newDate)
    setSelectedYearMonth(format(newDate, 'yyyy-MM'))
  }

  const handleNextWeek = () => {
    // not used
  }
  const handlePreviousWeek = () => {
    // not used
  }

  return {
    profile,
    user,
    userId,
    activeTab,
    setActiveTab,
    currentDate,
    setCurrentDate,
    selectedYearMonth,
    handleYearMonthChange,
    salarySelectedYearMonth,
    handleSalaryYearMonthChange,
    attendanceData,
    loading,
    isSyncing,
    handleSyncCalendar,
    siteOptions,
    selectedSiteId,
    setSelectedSiteId,
    assignmentOptions,
    allSites,
    isDetailSheetOpen,
    setIsDetailSheetOpen,
    selectedDayISO,
    selectedDayRecords,

    // Updated props for Batch Edits
    editedRecords,
    handleLaborChange,
    handleBatchSubmit,
    isInputSubmitting,
    handleAddSiteNavigation,

    showEmptyDateConfirm,
    setShowEmptyDateConfirm,
    emptyDateTarget,
    dayWorkLogs,
    dayWorkLogsLoading,
    dayWorkLogsError,
    apiMonthly,
    recentSalaryHistory,
    showAllSalaryHistory,
    setShowAllSalaryHistory,
    openDetailSheet,
    router,
    fetchWorkRecords,
    monthlyStats,
    calendarDays,
    yearMonthOptions,
    selectedYearMonthLabel,
    getCurrentPeriodText,
    handleNextMonth,
    handlePreviousMonth,
    handleNextWeek,
    handlePreviousWeek,
    filteredAttendanceData,
    handleProceedWithEmptyDate,
    closeDetailSheet,
  }
}
