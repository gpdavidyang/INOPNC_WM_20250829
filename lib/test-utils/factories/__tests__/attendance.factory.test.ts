import {
  createMockAttendanceWithLaborHours,
  createMockAttendanceCheckData,
  createMockPayslip,
  createMockAttendanceList,
  createMockMonthlyAttendanceSummary,
  laborHoursToWorkHours,
  workHoursToLaborHours,
  LABOR_HOURS_OPTIONS,
  STANDARD_LABOR_HOUR,
  HOURS_PER_LABOR
} from '../attendance.factory'

describe('Attendance Factory', () => {
  describe('Labor Hours Conversion', () => {
    it('converts labor hours to work hours correctly', () => {
      expect(laborHoursToWorkHours(1.0)).toBe(8)
      expect(laborHoursToWorkHours(0.5)).toBe(4)
      expect(laborHoursToWorkHours(1.5)).toBe(12)
      expect(laborHoursToWorkHours(0.25)).toBe(2)
    })

    it('converts work hours to labor hours correctly', () => {
      expect(workHoursToLaborHours(8)).toBe(1.0)
      expect(workHoursToLaborHours(4)).toBe(0.5)
      expect(workHoursToLaborHours(12)).toBe(1.5)
      expect(workHoursToLaborHours(2)).toBe(0.25)
    })
  })

  describe('createMockAttendanceWithLaborHours', () => {
    it('creates attendance record with valid labor hours', () => {
      const attendance = createMockAttendanceWithLaborHours()
      
      expect(attendance.id).toBeDefined()
      expect(attendance.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(attendance.site_id).toBeDefined()
      expect(attendance.site_name).toContain('현장')
      expect(LABOR_HOURS_OPTIONS).toContain(attendance.labor_hours)
      expect(attendance.work_hours).toBe(laborHoursToWorkHours(attendance.labor_hours!))
      expect(attendance.status).toBe('present')
    })

    it('calculates overtime correctly for labor hours > 1.0', () => {
      const attendance = createMockAttendanceWithLaborHours({ labor_hours: 1.5 })
      
      expect(attendance.labor_hours).toBe(1.5)
      expect(attendance.work_hours).toBe(12)
      expect(attendance.overtime_hours).toBe(4) // 0.5 공수 = 4 hours overtime
    })

    it('sets no overtime for labor hours <= 1.0', () => {
      const attendance = createMockAttendanceWithLaborHours({ labor_hours: 0.75 })
      
      expect(attendance.labor_hours).toBe(0.75)
      expect(attendance.work_hours).toBe(6)
      expect(attendance.overtime_hours).toBe(0)
    })

    it('allows custom overrides', () => {
      const customDate = '2025-08-01'
      const customSiteName = 'Custom Construction Site'
      
      const attendance = createMockAttendanceWithLaborHours({
        date: customDate,
        site_name: customSiteName,
        labor_hours: 1.0
      })
      
      expect(attendance.date).toBe(customDate)
      expect(attendance.site_name).toBe(customSiteName)
      expect(attendance.labor_hours).toBe(1.0)
    })
  })

  describe('createMockPayslip', () => {
    it('creates payslip with default values', () => {
      const payslip = createMockPayslip()
      
      expect(payslip.month).toMatch(/^\d{4}-\d{2}$/)
      expect(payslip.workDays).toBeGreaterThanOrEqual(20)
      expect(payslip.workDays).toBeLessThanOrEqual(23)
      expect(payslip.totalHours).toBe(payslip.regularHours + payslip.overtimeHours)
      expect(payslip.dailyRate).toBe(150000)
      expect(payslip.overtimeRate).toBe(20000)
      expect(payslip.estimatedSalary).toBeGreaterThan(0)
    })

    it('calculates payslip from attendance records', () => {
      const records = [
        createMockAttendanceWithLaborHours({ 
          date: '2025-08-01', 
          labor_hours: 1.0,
          status: 'present'
        }),
        createMockAttendanceWithLaborHours({ 
          date: '2025-08-02', 
          labor_hours: 1.25,
          status: 'present'
        }),
        createMockAttendanceWithLaborHours({ 
          date: '2025-08-03', 
          labor_hours: 0.5,
          status: 'present'
        })
      ]
      
      const payslip = createMockPayslip('2025-08', records)
      
      expect(payslip.month).toBe('2025-08')
      expect(payslip.workDays).toBe(3)
      expect(payslip.totalHours).toBe(22) // (1.0 + 1.25 + 0.5) * 8 = 22
      expect(payslip.regularHours).toBe(20) // 2.5 * 8 = 20
      expect(payslip.overtimeHours).toBe(2) // 0.25 * 8 = 2
      
      // Salary calculation:
      // Regular: 2.5 공수 * 150,000 = 375,000
      // Overtime: 0.25 공수 * 8 hours * 20,000 = 40,000
      // Total: 415,000
      expect(payslip.estimatedSalary).toBe(415000)
    })

    it('filters records by month and status', () => {
      const records = [
        createMockAttendanceWithLaborHours({ 
          date: '2025-08-01', 
          labor_hours: 1.0,
          status: 'present'
        }),
        createMockAttendanceWithLaborHours({ 
          date: '2025-07-31', // Different month
          labor_hours: 1.0,
          status: 'present'
        }),
        createMockAttendanceWithLaborHours({ 
          date: '2025-08-02', 
          labor_hours: 1.0,
          status: 'absent' // Not present
        })
      ]
      
      const payslip = createMockPayslip('2025-08', records)
      
      expect(payslip.workDays).toBe(1) // Only one valid record
      expect(payslip.totalHours).toBe(8)
    })
  })

  describe('createMockAttendanceList', () => {
    it('creates a list of attendance records for a month', () => {
      const records = createMockAttendanceList({
        month: '2025-08',
        workDays: 20
      })
      
      expect(records).toHaveLength(20)
      records.forEach(record => {
        expect(record.date).toMatch(/^2025-08-\d{2}$/)
        expect(record.status).toBe('present')
        expect(LABOR_HOURS_OPTIONS).toContain(record.labor_hours)
      })
    })

    it('uses consistent site information', () => {
      const siteId = 'test-site-id'
      const records = createMockAttendanceList({
        siteId,
        workDays: 5
      })
      
      const siteName = records[0].site_name
      records.forEach(record => {
        expect(record.site_id).toBe(siteId)
        expect(record.site_name).toBe(siteName)
      })
    })
  })

  describe('createMockMonthlyAttendanceSummary', () => {
    it('creates comprehensive monthly summary', () => {
      const summary = createMockMonthlyAttendanceSummary('2025-08')
      
      expect(summary.month).toBe('2025-08')
      expect(summary.records).toBeDefined()
      expect(summary.summary.totalDays).toBe(summary.payslip.workDays)
      expect(summary.summary.totalLaborHours).toBeCloseTo(
        workHoursToLaborHours(summary.payslip.totalHours),
        2
      )
      expect(summary.summary.averageLaborHoursPerDay).toBeGreaterThan(0)
      expect(summary.payslip).toBeDefined()
    })

    it('calculates summary from provided records', () => {
      const records = [
        createMockAttendanceWithLaborHours({ 
          date: '2025-08-01', 
          labor_hours: 1.0,
          status: 'present'
        }),
        createMockAttendanceWithLaborHours({ 
          date: '2025-08-02', 
          labor_hours: 1.0,
          status: 'present'
        })
      ]
      
      const summary = createMockMonthlyAttendanceSummary('2025-08', records)
      
      expect(summary.records).toEqual(records)
      expect(summary.summary.totalDays).toBe(2)
      expect(summary.summary.totalLaborHours).toBe(2.0)
      expect(summary.summary.averageLaborHoursPerDay).toBe(1.0)
    })
  })
})