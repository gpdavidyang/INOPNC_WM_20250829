import {
  createMockSupabaseClient,
  createMockAttendanceWithLaborHours,
  createMockAttendanceList,
  createMockPayslip,
  laborHoursToWorkHours,
  STANDARD_LABOR_HOUR
} from '@/lib/test-utils'

describe('Labor Hours (공수) System Example', () => {
  it('demonstrates attendance record with labor hours', () => {
    // Create attendance with 1.25 labor hours (10 hours work)
    const attendance = createMockAttendanceWithLaborHours({
      date: '2025-08-01',
      labor_hours: 1.25,
      site_name: 'Seoul Tower Construction Site'
    })
    
    expect(attendance.labor_hours).toBe(1.25)
    expect(attendance.work_hours).toBe(10) // 1.25 * 8 = 10 hours
    expect(attendance.overtime_hours).toBe(2) // 0.25 * 8 = 2 hours overtime
    expect(attendance.site_name).toBe('Seoul Tower Construction Site')
  })

  it('demonstrates monthly attendance records generation', () => {
    // Generate a month of attendance records
    const records = createMockAttendanceList({
      month: '2025-08',
      workDays: 22,
      siteId: 'site-123'
    })
    
    expect(records).toHaveLength(22)
    
    // All records should be for the same site
    const siteName = records[0].site_name
    records.forEach(record => {
      expect(record.site_id).toBe('site-123')
      expect(record.site_name).toBe(siteName)
      expect(record.date).toMatch(/^2025-08-/)
    })
    
    // Check labor hours distribution
    const regularDays = records.filter(r => r.labor_hours === 1.0).length
    const halfDays = records.filter(r => r.labor_hours === 0.5).length
    const overtimeDays = records.filter(r => r.labor_hours! > 1.0).length
    
    console.log(`Regular days (1.0 공수): ${regularDays}`)
    console.log(`Half days (0.5 공수): ${halfDays}`)
    console.log(`Overtime days (>1.0 공수): ${overtimeDays}`)
    
    // Most days should be regular (1.0 공수)
    expect(regularDays).toBeGreaterThan(records.length * 0.5)
  })

  it('demonstrates payslip calculation from attendance records', () => {
    // Create specific attendance records
    const records = [
      createMockAttendanceWithLaborHours({ 
        date: '2025-08-01', 
        labor_hours: 1.0 // Regular day
      }),
      createMockAttendanceWithLaborHours({ 
        date: '2025-08-02', 
        labor_hours: 1.0 // Regular day
      }),
      createMockAttendanceWithLaborHours({ 
        date: '2025-08-03', 
        labor_hours: 1.5 // Overtime day
      }),
      createMockAttendanceWithLaborHours({ 
        date: '2025-08-05', 
        labor_hours: 0.5 // Half day
      })
    ]
    
    // Calculate payslip
    const payslip = createMockPayslip('2025-08', records)
    
    expect(payslip.month).toBe('2025-08')
    expect(payslip.workDays).toBe(4)
    
    // Total: 1.0 + 1.0 + 1.5 + 0.5 = 4.0 공수
    expect(payslip.totalHours).toBe(32) // 4.0 * 8 = 32 hours
    
    // Regular: 1.0 + 1.0 + 1.0 + 0.5 = 3.5 공수 (max 1.0 per day)
    expect(payslip.regularHours).toBe(28) // 3.5 * 8 = 28 hours
    
    // Overtime: 0.5 공수 (from the 1.5 day)
    expect(payslip.overtimeHours).toBe(4) // 0.5 * 8 = 4 hours
    
    // Salary calculation
    // Regular: 3.5 공수 * 150,000원 = 525,000원
    // Overtime: 0.5 공수 * 8시간 * 20,000원 = 80,000원
    // Total: 605,000원
    expect(payslip.estimatedSalary).toBe(605000)
  })

  it('demonstrates integration with Supabase mock', async () => {
    const supabase = createMockSupabaseClient()
    
    // Create mock attendance data
    const mockAttendance = createMockAttendanceList({
      month: '2025-08',
      workDays: 20
    })
    
    // Mock the query response
    const queryBuilder = supabase.from('attendance_records')
    queryBuilder.select.mockImplementation(() => {
      (queryBuilder as any).__promise = Promise.resolve({ 
        data: mockAttendance, 
        error: null 
      })
      return queryBuilder
    })
    
    // Simulate fetching attendance records
    const { data, error } = await queryBuilder
      .select('*')
      .eq('user_id', 'user-123')
      .gte('date', '2025-08-01')
      .lte('date', '2025-08-31')
    
    expect(error).toBeNull()
    expect(data).toHaveLength(20)
    
    // Calculate total labor hours for the month
    const totalLaborHours = data!.reduce((sum, record) => 
      sum + (record.labor_hours || 0), 0
    )
    const totalWorkHours = laborHoursToWorkHours(totalLaborHours)
    
    console.log(`Total labor hours (공수): ${totalLaborHours}`)
    console.log(`Total work hours: ${totalWorkHours}`)
    
    expect(totalLaborHours).toBeGreaterThan(15) // At least 15 공수
    expect(totalLaborHours).toBeLessThan(30) // At most 30 공수
  })

  it('demonstrates calendar view color coding logic', () => {
    // Different labor hour scenarios for calendar display
    const scenarios = [
      { labor_hours: 1.5, expectedColor: 'green', description: 'Overtime (초과근무)' },
      { labor_hours: 1.0, expectedColor: 'green', description: 'Full day (정규근무)' },
      { labor_hours: 0.75, expectedColor: 'yellow', description: 'Almost full day' },
      { labor_hours: 0.5, expectedColor: 'yellow', description: 'Half day (반일)' },
      { labor_hours: 0.25, expectedColor: 'orange', description: 'Quarter day' },
      { labor_hours: 0, expectedColor: 'gray', description: 'No work/Holiday' }
    ]
    
    scenarios.forEach(({ labor_hours, expectedColor, description }) => {
      const attendance = createMockAttendanceWithLaborHours({ labor_hours })
      
      // Calendar color logic (as per the original system)
      let color: string
      if (labor_hours >= STANDARD_LABOR_HOUR) {
        color = 'green'
      } else if (labor_hours >= 0.5) {
        color = 'yellow'
      } else if (labor_hours > 0) {
        color = 'orange'
      } else {
        color = 'gray'
      }
      
      expect(color).toBe(expectedColor)
      console.log(`${labor_hours} 공수 (${description}): ${color}`)
    })
  })
})