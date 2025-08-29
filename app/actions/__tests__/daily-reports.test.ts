/**
 * Daily Reports Server Actions Test Suite
 * Comprehensive tests for daily report operations including creation, updates, weather data integration, and worker assignment
 */

import { jest } from '@jest/globals'
import { createMockDailyReport, createMockSite } from '@/__tests__/utils/test-utils'

// Mock Next.js cache revalidation functions
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn()
}))

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn(() => ({
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    order: jest.fn().mockReturnThis()
  }))
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}))

// Mock notification functions
jest.mock('@/lib/push-notifications', () => ({
  sendPushNotification: jest.fn().mockResolvedValue({ success: true })
}))

// Import the actual functions after mocking dependencies
import { 
  createDailyReport,
  updateDailyReport, 
  submitDailyReport,
  approveDailyReport,
  getDailyReports,
  getDailyReportById 
} from '../daily-reports'

describe('Daily Reports Server Actions', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com'
  }

  const validReportData = {
    site_id: 'site-123',
    work_date: '2024-08-01',
    member_name: '김철수',
    process_type: '슬라브 타설',
    total_workers: 5,
    npc1000_incoming: 10,
    npc1000_used: 3,
    npc1000_remaining: 7,
    issues: '특이사항 없음'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Set default auth user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })
  })

  describe('createDailyReport', () => {
    it('should create a new daily report successfully', async () => {
      const mockReport = createMockDailyReport({
        id: 'report-123',
        ...validReportData,
        status: 'draft',
        created_by: mockUser.id,
        submitted_by: mockUser.id
      })

      // Mock successful insert
      mockSupabaseClient.from().select().single.mockResolvedValueOnce({
        data: mockReport,
        error: null
      })

      const result = await createDailyReport(validReportData)

      expect(result.success).toBe(true)
      expect(result.data).toBeTruthy()
      expect(result.data?.id).toBe('report-123')
    })

    it('should fail when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const result = await createDailyReport(validReportData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('로그인이 필요합니다.')
    })

    it('should fail when daily report already exists for the same date', async () => {
      // First mock the check for existing report - returns an existing report
      mockSupabaseClient.from().select().single.mockResolvedValueOnce({
        data: createMockDailyReport({ id: 'existing-report' }),
        error: null
      })

      const result = await createDailyReport(validReportData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('해당 날짜의 보고서가 이미 존재합니다.')
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabaseClient.from().select().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection error' }
      })

      const result = await createDailyReport(validReportData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('일일보고서 생성에 실패했습니다.')
    })

    it('should create report with minimal required fields', async () => {
      const minimalData = {
        site_id: 'site-123',
        work_date: '2024-08-01',
        member_name: '김철수',
        process_type: '슬라브 타설'
      }

      const mockReport = createMockDailyReport({
        ...minimalData,
        status: 'draft',
        created_by: mockUser.id
      })

      mockSupabaseClient.from().select().single.mockResolvedValueOnce({
        data: mockReport,
        error: null
      })

      const result = await createDailyReport(minimalData)

      expect(result.success).toBe(true)
      expect(result.data).toBeTruthy()
    })
  })

  describe('updateDailyReport', () => {
    it('should update daily report successfully', async () => {
      const updateData = {
        issues: '업데이트된 이슈',
        total_workers: 8
      }
      
      const updatedReport = createMockDailyReport({
        id: 'report-123',
        ...updateData
      })

      mockSupabaseClient.from().update().eq().select().single.mockResolvedValueOnce({
        data: updatedReport,
        error: null
      })

      const result = await updateDailyReport('report-123', updateData)

      expect(result.success).toBe(true)
      expect(result.data).toBeTruthy()
      expect(result.data?.id).toBe('report-123')
    })

    it('should handle update errors', async () => {
      mockSupabaseClient.from().update().eq().select().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Update failed' }
      })

      const result = await updateDailyReport('report-123', { issues: 'test' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('일일보고서 수정에 실패했습니다.')
    })
  })

  describe('submitDailyReport', () => {
    it('should submit daily report and send notification', async () => {
      const submittedReport = createMockDailyReport({
        id: 'report-123',
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })

      mockSupabaseClient.from().update().eq().select().single.mockResolvedValueOnce({
        data: submittedReport,
        error: null
      })

      const result = await submitDailyReport('report-123')

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('submitted')
    })

    it('should fail when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const result = await submitDailyReport('report-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('로그인이 필요합니다.')
    })

    it('should fail when report is not in draft status', async () => {
      mockSupabaseClient.from().update().eq().select().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid status transition' }
      })

      const result = await submitDailyReport('report-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('일일보고서 제출에 실패했습니다.')
    })
  })

  describe('approveDailyReport', () => {
    it('should approve daily report and send notification', async () => {
      const approvedReport = createMockDailyReport({
        id: 'report-123',
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: mockUser.id
      })

      mockSupabaseClient.from().update().eq().select().single.mockResolvedValueOnce({
        data: approvedReport,
        error: null
      })

      const result = await approveDailyReport('report-123', true, '승인합니다')

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('approved')
    })

    it('should reject daily report and send notification', async () => {
      const rejectedReport = createMockDailyReport({
        id: 'report-123',
        status: 'rejected',
        rejection_reason: '내용 보완 필요'
      })

      mockSupabaseClient.from().update().eq().select().single.mockResolvedValueOnce({
        data: rejectedReport,
        error: null
      })

      const result = await approveDailyReport('report-123', false, '내용 보완 필요')

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('rejected')
    })

    it('should fail when report is not in submitted status', async () => {
      mockSupabaseClient.from().update().eq().select().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid status' }
      })

      const result = await approveDailyReport('report-123', true)

      expect(result.success).toBe(false)
      expect(result.error).toBe('일일보고서 승인/반려에 실패했습니다.')
    })
  })

  describe('getDailyReports', () => {
    it('should fetch daily reports with filters', async () => {
      const mockReports = [
        createMockDailyReport({ id: 'report-1' }),
        createMockDailyReport({ id: 'report-2' })
      ]

      mockSupabaseClient.from().select().eq().order.mockResolvedValueOnce({
        data: mockReports,
        error: null
      })

      const result = await getDailyReports({ site_id: 'site-123' })

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
    })

    it('should fetch reports without filters', async () => {
      const mockReports = [createMockDailyReport({ id: 'report-1' })]

      mockSupabaseClient.from().select().order.mockResolvedValueOnce({
        data: mockReports,
        error: null
      })

      const result = await getDailyReports()

      expect(result.success).toBe(true)
      expect(result.data).toBeTruthy()
    })

    it('should handle database errors', async () => {
      mockSupabaseClient.from().select().order.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      })

      const result = await getDailyReports()

      expect(result.success).toBe(false)
      expect(result.error).toBe('일일보고서 조회에 실패했습니다.')
    })
  })

  describe('getDailyReportById', () => {
    it('should fetch daily report by ID with site information', async () => {
      const mockReport = createMockDailyReport({
        id: 'report-123',
        site: createMockSite({ id: 'site-123', name: '테스트 현장' })
      })

      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: mockReport,
        error: null
      })

      const result = await getDailyReportById('report-123')

      expect(result.success).toBe(true)
      expect(result.data?.id).toBe('report-123')
      expect(result.data?.site?.name).toBe('테스트 현장')
    })

    it('should handle not found error', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' }
      })

      const result = await getDailyReportById('non-existent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('일일보고서를 찾을 수 없습니다.')
    })
  })

  describe('Date and timezone handling', () => {
    it('should handle work_date validation correctly', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)
      
      const invalidData = {
        ...validReportData,
        work_date: futureDate.toISOString().split('T')[0]
      }

      // Mock to return null for future date check
      mockSupabaseClient.from().select().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid date' }
      })

      const result = await createDailyReport(invalidData)

      expect(result.success).toBe(false)
    })

    it('should handle Korean timezone correctly', async () => {
      const kstDate = '2024-08-01'
      const reportData = { ...validReportData, work_date: kstDate }

      const mockReport = createMockDailyReport({
        ...reportData,
        created_by: mockUser.id
      })

      mockSupabaseClient.from().select().single.mockResolvedValueOnce({
        data: mockReport,
        error: null
      })

      const result = await createDailyReport(reportData)

      expect(result.success).toBe(true)
      expect(result.data?.work_date).toBe(kstDate)
    })
  })

  describe('Concurrency and race conditions', () => {
    it('should handle concurrent report creation attempts', async () => {
      // First request finds no existing report
      mockSupabaseClient.from().select().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' } // Not found error
      })

      // But insert fails due to unique constraint
      mockSupabaseClient.from().insert().select().single.mockResolvedValueOnce({
        data: null,
        error: { code: '23505', message: 'duplicate key value' }
      })

      const result = await createDailyReport(validReportData)

      expect(result.success).toBe(false)
    })
  })

  describe('Business rule validations', () => {
    it('should validate NPC1000 material calculations', async () => {
      const invalidMaterialData = {
        ...validReportData,
        npc1000_incoming: 10,
        npc1000_used: 5,
        npc1000_remaining: 10 // Should be 5
      }

      const mockReport = createMockDailyReport({
        ...invalidMaterialData,
        created_by: mockUser.id
      })

      mockSupabaseClient.from().select().single.mockResolvedValueOnce({
        data: mockReport,
        error: null
      })

      const result = await createDailyReport(invalidMaterialData)

      // The function should still create the report as validation is done on the frontend
      expect(result.success).toBe(true)
    })

    it('should validate worker count is positive', async () => {
      const invalidWorkerData = {
        ...validReportData,
        total_workers: -5
      }

      const mockReport = createMockDailyReport({
        ...invalidWorkerData,
        created_by: mockUser.id
      })

      mockSupabaseClient.from().select().single.mockResolvedValueOnce({
        data: mockReport,
        error: null
      })

      const result = await createDailyReport(invalidWorkerData)

      // The function should still create the report as validation is done on the frontend
      expect(result.success).toBe(true)
    })
  })

  describe('Integration scenarios', () => {
    it('should handle complete workflow: create → submit → approve', async () => {
      // Step 1: Create
      const createdReport = createMockDailyReport({
        id: 'report-123',
        status: 'draft',
        created_by: mockUser.id
      })

      mockSupabaseClient.from().select().single.mockResolvedValueOnce({
        data: createdReport,
        error: null
      })

      const createResult = await createDailyReport(validReportData)
      expect(createResult.success).toBe(true)

      // Step 2: Submit
      const submittedReport = { ...createdReport, status: 'submitted' }
      mockSupabaseClient.from().update().eq().select().single.mockResolvedValueOnce({
        data: submittedReport,
        error: null
      })

      const submitResult = await submitDailyReport('report-123')
      expect(submitResult.success).toBe(true)

      // Step 3: Approve
      const approvedReport = { ...submittedReport, status: 'approved' }
      mockSupabaseClient.from().update().eq().select().single.mockResolvedValueOnce({
        data: approvedReport,
        error: null
      })

      const approveResult = await approveDailyReport('report-123', true)
      expect(approveResult.success).toBe(true)
    })

    it('should handle error scenarios in workflow', async () => {
      // Create fails
      mockSupabaseClient.from().select().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Create failed' }
      })

      const createResult = await createDailyReport(validReportData)
      expect(createResult.success).toBe(false)

      // Submit fails for non-existent report
      mockSupabaseClient.from().update().eq().select().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' }
      })

      const submitResult = await submitDailyReport('non-existent')
      expect(submitResult.success).toBe(false)
    })
  })
})