'use client'

import React, { useState, useEffect } from 'react'
import { MobileLayout } from '@/modules/mobile/components/layout/mobile-layout'
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
import { TabSystem, TabPanel, type Tab } from '@/modules/mobile/components/ui/TabSystem'

interface AttendanceRecord {
  id?: string
  date: string
  checkIn: string | null
  checkOut: string | null
  workHours: number
  status: 'present' | 'absent' | 'late' | 'early'
  site_id?: string
  user_id?: string
  created_at?: string
}

interface SalaryInfo {
  month: string
  baseSalary: number
  overtimePay: number
  mealAllowance: number
  totalSalary: number
  paidDate: string
}

export const AttendancePage: React.FC = () => {
  return (
    <MobileAuthGuard>
      <AttendanceContent />
    </MobileAuthGuard>
  )
}

const AttendanceContent: React.FC = () => {
  const { profile, isWorker, isSiteManager } = useUnifiedAuth()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [checkInTime, setCheckInTime] = useState<string | null>(null)
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'output' | 'salary'>('output')

  // 탭 구성
  const tabs: Tab[] = [
    { id: 'output', label: '출력현황' },
    { id: 'salary', label: '급여현황' },
  ]

  // Calendar view states
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())

  // Real-time data states
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [salaryData, setSalaryData] = useState<SalaryInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null)

  // Supabase client initialization
  const supabase = createClient()

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Load initial attendance data
  useEffect(() => {
    const loadAttendanceData = async () => {
      if (!profile?.id) return

      try {
        setLoading(true)

        // Fetch recent attendance records
        const { data: records, error: recordsError } = await supabase
          .from('attendance_records')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (recordsError) {
          console.error('Error fetching attendance records:', recordsError)
        } else {
          setAttendanceData(records || [])
        }

        // Check today's attendance record
        const today = new Date().toISOString().split('T')[0]
        const { data: todayData, error: todayError } = await supabase
          .from('attendance_records')
          .select('*')
          .eq('user_id', profile.id)
          .eq('date', today)
          .single()

        if (todayError && todayError.code !== 'PGRST116') {
          console.error('Error fetching today record:', todayError)
        } else if (todayData) {
          setTodayRecord(todayData)
          setIsCheckedIn(!!todayData.checkIn && !todayData.checkOut)
          setCheckInTime(todayData.checkIn)
          setCheckOutTime(todayData.checkOut)
        }
      } catch (error) {
        console.error('Error loading attendance data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAttendanceData()
  }, [profile?.id])

  // Real-time subscription for attendance updates
  useEffect(() => {
    if (!profile?.id) return

    const subscription = supabase
      .channel('attendance_records')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records',
          filter: `user_id=eq.${profile.id}`,
        },
        payload => {
          console.log('Real-time attendance update:', payload)

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const record = payload.new as AttendanceRecord

            // Update attendance data list
            setAttendanceData(prev => {
              const filtered = prev.filter(r => r.id !== record.id)
              return [record, ...filtered].slice(0, 10)
            })

            // Update today's record if it's today
            const today = new Date().toISOString().split('T')[0]
            if (record.date === today) {
              setTodayRecord(record)
              setIsCheckedIn(!!record.checkIn && !record.checkOut)
              setCheckInTime(record.checkIn)
              setCheckOutTime(record.checkOut)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [profile?.id])

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

  // Get display data - use real data if available, fallback to loading state
  const displayAttendance = loading ? [] : attendanceData.slice(0, 5)

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
  const calculateMonthlySalary = () => {
    if (!attendanceData || attendanceData.length === 0) {
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
    const monthlyAttendance = attendanceData.filter(record => {
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
      if (record.status === 'present' || record.status === 'late') {
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
    if (!attendanceData) return []

    let startDate: Date
    let endDate: Date

    if (viewMode === 'month') {
      startDate = startOfMonth(currentDate)
      endDate = endOfMonth(currentDate)
    } else {
      startDate = startOfWeek(currentDate, { locale: ko })
      endDate = endOfWeek(currentDate, { locale: ko })
    }

    return attendanceData.filter(record => {
      const recordDate = parseISO(record.date)
      return recordDate >= startDate && recordDate <= endDate
    })
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

  // Chart data preparation helper functions
  const prepareAttendanceTrendData = () => {
    if (viewMode === 'monthly') {
      // Group attendance by days of the month
      const daysInMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      ).getDate()
      const trendData = []

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = format(
          new Date(currentDate.getFullYear(), currentDate.getMonth(), day),
          'yyyy-MM-dd'
        )
        const dayAttendance = filteredAttendance.filter(record => record.date === dateStr)
        const totalHours = dayAttendance.reduce((sum, record) => sum + record.hours, 0)

        trendData.push({
          date: `${day}일`,
          hours: totalHours,
          records: dayAttendance.length,
        })
      }
      return trendData
    } else {
      // Weekly view - show days of the week
      const startWeek = startOfWeek(currentDate, { locale: ko })
      const trendData = []

      for (let i = 0; i < 7; i++) {
        const currentDay = addDays(startWeek, i)
        const dateStr = format(currentDay, 'yyyy-MM-dd')
        const dayAttendance = filteredAttendance.filter(record => record.date === dateStr)
        const totalHours = dayAttendance.reduce((sum, record) => sum + record.hours, 0)

        trendData.push({
          date: format(currentDay, 'E', { locale: ko }),
          hours: totalHours,
          records: dayAttendance.length,
        })
      }
      return trendData
    }
  }

  const prepareAttendanceStatusData = () => {
    const statusCounts = filteredAttendance.reduce(
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
      vacation: '휴가',
    }

    const colors = {
      present: '#10b981',
      absent: '#ef4444',
      late: '#f59e0b',
      early_leave: '#f97316',
      vacation: '#6366f1',
    }

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: statusLabels[status as keyof typeof statusLabels] || status,
      value: count,
      color: colors[status as keyof typeof colors] || '#6b7280',
    }))
  }

  const prepareWeeklyComparisonData = () => {
    // Compare current week with previous weeks (last 4 weeks)
    const comparisonData = []
    const currentWeekStart = startOfWeek(currentDate, { locale: ko })

    for (let i = 0; i < 4; i++) {
      const weekStart = addDays(currentWeekStart, -7 * i)
      const weekEnd = endOfWeek(weekStart, { locale: ko })

      const weekAttendance = attendanceData.filter(record => {
        const recordDate = new Date(record.date)
        return recordDate >= weekStart && recordDate <= weekEnd
      })

      const totalHours = weekAttendance.reduce((sum, record) => sum + record.hours, 0)
      const workDays = weekAttendance.filter(record => record.status === 'present').length

      comparisonData.unshift({
        week: i === 0 ? '이번주' : `${i}주 전`,
        hours: totalHours,
        workDays: workDays,
        avgHours: workDays > 0 ? Number((totalHours / workDays).toFixed(1)) : 0,
      })
    }

    return comparisonData
  }

  // Calculate recent salary history (last 3 months)
  const calculateRecentSalaryHistory = () => {
    const history = []
    const now = new Date()

    for (let i = 1; i <= 3; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const month = targetDate.getMonth()
      const year = targetDate.getFullYear()

      // Filter attendance for target month
      const monthlyAttendance = attendanceData.filter(record => {
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
        if (record.status === 'present' || record.status === 'late') {
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
        paidDate: new Date(year, month + 1, 0).toISOString().split('T')[0], // Last day of month
        totalSalary,
      })
    }

    return history
  }

  // Get current month salary data
  const currentSalaryData = calculateMonthlySalary()
  const recentSalaryHistory = calculateRecentSalaryHistory()

  // Salary chart data preparation functions
  const prepareSalaryTrendData = () => {
    return recentSalaryHistory.map(item => ({
      month: format(item.month, 'MM월', { locale: ko }),
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
    <MobileLayout
      title="출력정보"
      userRole={profile?.role as 'worker' | 'site_manager'}
      showBack={true}
    >
      {/* Main container matching reference HTML structure */}
      <main className="w-full max-w-[480px] mx-auto px-4 pb-6">
        {/* 탭 네비게이션 */}
        <div className="sticky top-0 z-10 mb-4">
          <TabSystem
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={tabId => setActiveTab(tabId as 'output' | 'salary')}
            variant="line"
          />
        </div>

        <div className="space-y-3">
          {/* 출력현황 탭 */}
          {activeTab === 'output' && (
            <>
              {/* Calendar Navigation */}
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="t-h2">{getCurrentPeriodText()}</h3>
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
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={viewMode === 'month' ? handlePreviousMonth : handlePreviousWeek}
                      >
                        ‹
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={viewMode === 'month' ? handleNextMonth : handleNextWeek}
                      >
                        ›
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Current Status */}
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
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-2">
                            <Badge variant="tag3" />
                            <span className="t-body font-medium">
                              {checkInTime} ~ {checkOutTime} (완료)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </Stack>
                </CardContent>
              </Card>

              {/* Today's Summary */}
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
                        {checkInTime && checkOutTime ? '8시간' : isCheckedIn ? '진행 중' : '-'}
                      </span>
                    </Row>
                    <Row justify="between">
                      <span className="t-body">상태</span>
                      <Chip variant="tag1">정상</Chip>
                    </Row>
                  </Stack>
                </CardContent>
              </Card>

              {/* Chart Visualizations */}
              <Card>
                <CardContent className="p-3">
                  <h3 className="t-h3 mb-4">출근 현황 분석</h3>

                  {/* Attendance Trend Chart */}
                  <div className="mb-6">
                    <h4 className="t-h4 mb-3">
                      {viewMode === 'monthly' ? '월별' : '주별'} 출근 추이
                    </h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={prepareAttendanceTrendData()}>
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

                  {/* Attendance Status Distribution */}
                  <div className="mb-6">
                    <h4 className="t-h4 mb-3">출근 상태 분포</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={prepareAttendanceStatusData()}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {prepareAttendanceStatusData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value, name) => [`${value}일`, '일수']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Weekly Comparison Chart */}
                  <div className="mb-4">
                    <h4 className="t-h4 mb-3">주간 비교</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={prepareWeeklyComparisonData()}>
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

              {/* Filtered Attendance Records */}
              <Card>
                <CardContent className="p-3">
                  <h3 className="t-h3 mb-3">{viewMode === 'month' ? '월별' : '주별'} 출근 기록</h3>
                  <Stack gap="sm">
                    {getFilteredAttendanceData().map((record, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
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

              {/* Weekly Summary */}
              <Card>
                <CardContent className="p-3">
                  <h3 className="t-h3 mb-3">주간 요약</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="t-h2 font-bold text-blue-600">5/5</p>
                      <p className="t-cap">출근일</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="t-h2 font-bold text-green-600">42.5h</p>
                      <p className="t-cap">총 근무시간</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <p className="t-h2 font-bold text-orange-600">1</p>
                      <p className="t-cap">지각</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="t-h2 font-bold text-purple-600">1</p>
                      <p className="t-cap">조퇴</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* 급여현황 탭 */}
          {activeTab === 'salary' && (
            <>
              <Card>
                <CardContent className="p-3">
                  <h3 className="t-h3 mb-3">이번 달 급여 현황</h3>
                  <Stack gap="sm">
                    <Row justify="between">
                      <span className="t-body">기본급</span>
                      <span className="t-body font-medium">
                        ₩{currentSalaryData.baseSalary.toLocaleString()}
                      </span>
                    </Row>
                    <Row justify="between">
                      <span className="t-body">연장 수당</span>
                      <span className="t-body font-medium">
                        ₩{currentSalaryData.overtimePay.toLocaleString()}
                      </span>
                    </Row>
                    <Row justify="between">
                      <span className="t-body">식대</span>
                      <span className="t-body font-medium">
                        ₩{currentSalaryData.mealAllowance.toLocaleString()}
                      </span>
                    </Row>
                    <div className="border-t pt-3">
                      <Row justify="between">
                        <span className="t-body font-bold">합계</span>
                        <span className="t-body font-bold text-primary">
                          ₩{currentSalaryData.totalSalary.toLocaleString()}
                        </span>
                      </Row>
                    </div>
                  </Stack>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <h3 className="t-h3 mb-3">최근 급여 내역</h3>
                  <Stack gap="sm">
                    {recentSalaryHistory.map((salaryRecord, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <Row justify="between">
                          <div>
                            <p className="t-body font-medium">{salaryRecord.month}</p>
                            <p className="t-cap text-muted-foreground">
                              {new Date(salaryRecord.paidDate).toLocaleDateString('ko-KR')} 지급
                            </p>
                          </div>
                          <span className="t-body font-bold">
                            ₩{salaryRecord.totalSalary.toLocaleString()}
                          </span>
                        </Row>
                      </div>
                    ))}
                  </Stack>
                </CardContent>
              </Card>

              {/* 급여 시각화 차트 */}
              <Card>
                <CardContent className="p-3">
                  <h3 className="t-h3 mb-3">급여 동향 분석</h3>
                  <div className="space-y-6">
                    {/* 급여 트렌드 차트 */}
                    <div>
                      <h4 className="t-h4 mb-3">최근 급여 추이</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={prepareSalaryTrendData()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="month"
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
                            <Tooltip
                              formatter={(value: number, name: string) => [
                                `₩${value.toLocaleString()}`,
                                name,
                              ]}
                              labelStyle={{ color: '#374151' }}
                              contentStyle={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                              }}
                            />
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

                    {/* 급여 구성 비율 차트 */}
                    <div>
                      <h4 className="t-h4 mb-3">이번 달 급여 구성</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={prepareSalaryBreakdownData()}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) =>
                                `${name} ${(percent * 100).toFixed(0)}%`
                              }
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {prepareSalaryBreakdownData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => `₩${value.toLocaleString()}`}
                              contentStyle={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* 급여 비교 차트 */}
                    <div>
                      <h4 className="t-h4 mb-3">급여 비교 분석</h4>
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
                            <Tooltip
                              formatter={(value: number) => `₩${value.toLocaleString()}`}
                              contentStyle={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                              }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                              {prepareSalaryComparisonData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </MobileLayout>
  )
}
