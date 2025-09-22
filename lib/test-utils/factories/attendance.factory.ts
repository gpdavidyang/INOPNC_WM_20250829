import type { AttendanceRecord, AttendanceStatus, AttendanceCheckData, SalaryData } from '@/types/attendance'

// Labor hours constants
export const LABOR_HOURS_OPTIONS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5] as const
export const STANDARD_LABOR_HOUR = 1.0 // 1.0 공수
export const HOURS_PER_LABOR = 8 // 1.0 공수 = 8 hours

// Convert labor hours to work hours
export function laborHoursToWorkHours(laborHours: number): number {
  return laborHours * HOURS_PER_LABOR
}

// Convert work hours to labor hours
export function workHoursToLaborHours(workHours: number): number {
  return workHours / HOURS_PER_LABOR
}

// Create mock attendance record with labor hours (공수)
export function createMockAttendanceWithLaborHours(
  overrides?: Partial<AttendanceRecord>
): AttendanceRecord {
  const laborHours = overrides?.labor_hours ?? faker.helpers.arrayElement(LABOR_HOURS_OPTIONS)
  const workHours = laborHoursToWorkHours(laborHours)
  
  // Calculate overtime if labor hours > 1.0
  const overtimeHours = laborHours > STANDARD_LABOR_HOUR 
    ? laborHoursToWorkHours(laborHours - STANDARD_LABOR_HOUR)
    : 0

  // Use a fixed date if provided, otherwise generate a recent date
  const workDate = overrides?.date 
    ? new Date(overrides.date) 
    : faker.date.recent({ days: 30 })
  
  const checkInTime = new Date(workDate)
  checkInTime.setHours(8, faker.number.int({ min: 0, max: 30 }), 0, 0)
  
  const checkOutTime = new Date(checkInTime)
  checkOutTime.setHours(checkInTime.getHours() + Math.floor(workHours), 
    checkInTime.getMinutes() + (workHours % 1) * 60, 0, 0)

  return {
    id: faker.string.uuid(),
    date: overrides?.date || workDate.toISOString().split('T')[0],
    site_id: faker.string.uuid(),
    site_name: faker.company.name() + ' 현장',
    check_in_time: checkInTime.toISOString(),
    check_out_time: checkOutTime.toISOString(),
    work_hours: workHours,
    overtime_hours: overtimeHours,
    labor_hours: laborHours,
    status: 'present' as AttendanceStatus,
    ...overrides
  }
}

// Create mock attendance check data
export function createMockAttendanceCheckData(
  overrides?: Partial<AttendanceCheckData>
): AttendanceCheckData {
  const laborHours = overrides?.labor_hours ?? faker.helpers.arrayElement(LABOR_HOURS_OPTIONS)
  const workHours = laborHoursToWorkHours(laborHours)
  const overtimeHours = laborHours > STANDARD_LABOR_HOUR 
    ? laborHoursToWorkHours(laborHours - STANDARD_LABOR_HOUR)
    : 0

  const workDate = new Date()
  const checkInTime = new Date(workDate)
  checkInTime.setHours(8, 0, 0, 0)
  
  const checkOutTime = new Date(checkInTime)
  checkOutTime.setHours(checkInTime.getHours() + Math.floor(workHours), 
    (workHours % 1) * 60, 0, 0)

  return {
    user_id: faker.string.uuid(),
    site_id: faker.string.uuid(),
    work_date: workDate.toISOString().split('T')[0],
    check_in_time: checkInTime.toISOString(),
    check_out_time: checkOutTime.toISOString(),
    work_hours: workHours,
    overtime_hours: overtimeHours,
    labor_hours: laborHours,
    status: 'present' as AttendanceStatus,
    notes: faker.lorem.sentence(),
    ...overrides
  }
}

// Create mock payslip with labor hours calculations
export function createMockPayslip(
  month?: string,
  attendanceRecords?: AttendanceRecord[]
): SalaryData {
  const targetMonth = month || new Date().toISOString().slice(0, 7) // YYYY-MM format
  
  // If no records provided, generate realistic monthly data
  if (!attendanceRecords) {
    const workDays = faker.number.int({ min: 20, max: 23 })
    const totalLaborHours = faker.number.float({ min: 20, max: 25, fractionDigits: 2 })
    const totalWorkHours = laborHoursToWorkHours(totalLaborHours)
    const regularLaborHours = Math.min(totalLaborHours, workDays * STANDARD_LABOR_HOUR)
    const overtimeLaborHours = Math.max(0, totalLaborHours - regularLaborHours)
    
    return {
      month: targetMonth,
      regularHours: laborHoursToWorkHours(regularLaborHours),
      overtimeHours: laborHoursToWorkHours(overtimeLaborHours),
      totalHours: totalWorkHours,
      dailyRate: 150000, // 일당 15만원
      overtimeRate: 20000, // 시간당 2만원
      estimatedSalary: Math.round(
        regularLaborHours * 150000 + // 정규 공수 * 일당
        overtimeLaborHours * 8 * 20000 // 초과 공수 * 8시간 * 시간당 수당
      ),
      workDays
    }
  }
  
  // Calculate from provided records
  const monthRecords = attendanceRecords.filter(r => 
    r.date.startsWith(targetMonth) && r.status === 'present'
  )
  
  const totalLaborHours = monthRecords.reduce((sum, r) => sum + (r.labor_hours || 0), 0)
  const totalWorkHours = laborHoursToWorkHours(totalLaborHours)
  const workDays = monthRecords.length
  
  // Calculate regular labor hours (up to 1.0 per day)
  const regularLaborHours = monthRecords.reduce((sum, r) => {
    const laborHours = r.labor_hours || 0
    return sum + Math.min(laborHours, STANDARD_LABOR_HOUR)
  }, 0)
  const overtimeLaborHours = totalLaborHours - regularLaborHours
  
  return {
    month: targetMonth,
    regularHours: laborHoursToWorkHours(regularLaborHours),
    overtimeHours: laborHoursToWorkHours(overtimeLaborHours),
    totalHours: totalWorkHours,
    dailyRate: 150000,
    overtimeRate: 20000,
    estimatedSalary: Math.round(
      regularLaborHours * 150000 +
      overtimeLaborHours * 8 * 20000
    ),
    workDays
  }
}

// Create a list of attendance records for a month
export function createMockAttendanceList(
  options?: {
    userId?: string
    siteId?: string
    month?: string
    workDays?: number
  }
): AttendanceRecord[] {
  const { 
    userId = faker.string.uuid(),
    siteId = faker.string.uuid(),
    month = new Date().toISOString().slice(0, 7),
    workDays = faker.number.int({ min: 20, max: 23 })
  } = options || {}

  const siteName = faker.company.name() + ' 현장'
  const records: AttendanceRecord[] = []
  const [year, monthNum] = month.split('-').map(Number)
  
  // Generate records for the month
  const daysInMonth = new Date(year, monthNum, 0).getDate()
  
  // Get all weekdays in the month
  const weekdays: number[] = []
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthNum - 1, day)
    const dayOfWeek = date.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Saturday or Sunday
      weekdays.push(day)
    }
  }
  
  // Select workDays from available weekdays
  let selectedDays: number[]
  if (workDays <= weekdays.length) {
    // Select random weekdays
    selectedDays = faker.helpers.arrayElements(weekdays, workDays)
  } else {
    // Need to include some weekend days
    selectedDays = [...weekdays]
    const weekends: number[] = []
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthNum - 1, day)
      const dayOfWeek = date.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekends.push(day)
      }
    }
    const extraDays = workDays - weekdays.length
    selectedDays.push(...faker.helpers.arrayElements(weekends, Math.min(extraDays, weekends.length)))
  }
  
  selectedDays.sort((a, b) => a - b)

  selectedDays.forEach(day => {
    const date = new Date(year, monthNum - 1, day)
    const dayOfWeek = date.getDay()
    
    // Format date properly for the requested month
    const formattedDate = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    
    // Weekend work typically has overtime
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const laborHours = isWeekend 
      ? faker.helpers.arrayElement([1.0, 1.25, 1.5]) // Weekend work is usually overtime
      : faker.helpers.weightedArrayElement([
          { value: 1.0, weight: 7 },  // 70% chance of regular day
          { value: 0.5, weight: 1 },  // 10% chance of half day
          { value: 1.25, weight: 1 }, // 10% chance of overtime
          { value: 1.5, weight: 1 }   // 10% chance of heavy overtime
        ])
    
    records.push(createMockAttendanceWithLaborHours({
      date: formattedDate,
      site_id: siteId,
      site_name: siteName,
      labor_hours: laborHours,
      status: 'present'
    }))
  })

  return records
}

// Create mock monthly attendance summary
export function createMockMonthlyAttendanceSummary(
  month?: string,
  records?: AttendanceRecord[]
) {
  const attendanceRecords = records || createMockAttendanceList({ month })
  const payslip = createMockPayslip(month, attendanceRecords)
  
  return {
    month: payslip.month,
    records: attendanceRecords,
    summary: {
      totalDays: payslip.workDays,
      totalLaborHours: workHoursToLaborHours(payslip.totalHours),
      totalWorkHours: payslip.totalHours,
      regularLaborHours: workHoursToLaborHours(payslip.regularHours),
      overtimeLaborHours: workHoursToLaborHours(payslip.overtimeHours),
      averageLaborHoursPerDay: Number((workHoursToLaborHours(payslip.totalHours) / payslip.workDays).toFixed(2))
    },
    payslip
  }
}