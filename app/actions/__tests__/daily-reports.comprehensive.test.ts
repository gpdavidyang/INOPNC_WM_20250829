/**
 * Comprehensive Unit Tests for Daily Reports Actions
 */

import {
  createDailyReport,
  updateDailyReport,
  submitDailyReport,
  approveDailyReport,
  rejectDailyReport,
  getDailyReports,
  getDailyReportById,
  deleteDailyReport,
} from '../daily-reports'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}))

jest.mock('@/lib/notifications/triggers', () => ({
  notifyDailyReportSubmitted: jest.fn(),
  notifyDailyReportApproved: jest.fn(),
  notifyDailyReportRejected: jest.fn(),
}))

describe('Daily Reports Actions', () => {
  let mockSupabaseClient: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup mock Supabase client
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123', email: 'test@example.com' } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
      })),
      storage: {
        from: jest.fn(() => ({
          upload: jest.fn(),
          remove: jest.fn(),
          getPublicUrl: jest.fn(),
        })),
      },
    }
    
    ;(createClient as jest.Mock).mockReturnValue(mockSupabaseClient)
  })

  describe('createDailyReport', () => {
    const mockReportData = {
      site_id: 'site-123',
      work_date: '2025-08-30',
      member_name: 'Test Worker',
      process_type: 'construction',
      total_workers: 10,
      npc1000_incoming: 100,
      npc1000_used: 50,
      npc1000_remaining: 50,
      issues: 'No issues',
    }

    it('should create a new daily report successfully', async () => {
      const mockReport = { id: 'report-123', ...mockReportData }
      
      // No existing report
      mockSupabaseClient.from().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }, // Not found error
      })
      
      // Insert new report
      mockSupabaseClient.from().single.mockResolvedValueOnce({
        data: mockReport,
        error: null,
      })

      const result = await createDailyReport(mockReportData)

      expect(result).toEqual({ success: true, data: mockReport })
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('daily_reports')
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/daily-reports')
    })

    it('should update existing report instead of creating duplicate', async () => {
      const existingReport = { id: 'existing-123', status: 'draft' }
      const updatedReport = { id: 'existing-123', ...mockReportData }
      
      // Existing report found
      mockSupabaseClient.from().single.mockResolvedValueOnce({
        data: existingReport,
        error: null,
      })
      
      // Update existing report
      mockSupabaseClient.from().single.mockResolvedValueOnce({
        data: updatedReport,
        error: null,
      })

      const result = await createDailyReport(mockReportData)

      expect(result).toEqual({ success: true, data: updatedReport })
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockReportData,
          updated_at: expect.any(String),
        })
      )
    })

    it('should handle authentication errors', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const result = await createDailyReport(mockReportData)

      expect(result).toEqual({
        success: false,
        error: '로그인이 필요합니다.',
      })
    })

    it('should handle database errors', async () => {
      mockSupabaseClient.from().single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const result = await createDailyReport(mockReportData)

      expect(result).toEqual({
        success: false,
        error: '일일보고서 생성에 실패했습니다.',
      })
    })
  })

  describe('updateDailyReport', () => {
    it('should update an existing daily report', async () => {
      const reportId = 'report-123'
      const updateData = {
        total_workers: 15,
        issues: 'Updated issues',
      }
      const updatedReport = { id: reportId, ...updateData }

      mockSupabaseClient.from().single.mockResolvedValue({
        data: updatedReport,
        error: null,
      })

      const result = await updateDailyReport(reportId, updateData)

      expect(result).toEqual({ success: true, data: updatedReport })
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updateData,
          updated_at: expect.any(String),
        })
      )
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/daily-reports')
    })

    it('should handle update errors', async () => {
      mockSupabaseClient.from().single.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      })

      const result = await updateDailyReport('report-123', { issues: 'test' })

      expect(result).toEqual({
        success: false,
        error: '일일보고서 수정에 실패했습니다.',
      })
    })
  })

  describe('submitDailyReport', () => {
    it('should submit a draft report for approval', async () => {
      const reportId = 'report-123'
      const submittedReport = { 
        id: reportId, 
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      }

      mockSupabaseClient.from().single.mockResolvedValue({
        data: submittedReport,
        error: null,
      })

      const result = await submitDailyReport(reportId)

      expect(result).toEqual({ success: true, data: submittedReport })
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
        status: 'submitted',
        submitted_at: expect.any(String),
        updated_at: expect.any(String),
      })
    })

    it('should trigger notification on submission', async () => {
      const { notifyDailyReportSubmitted } = require('@/lib/notifications/triggers')
      const reportId = 'report-123'
      const submittedReport = { id: reportId, status: 'submitted' }

      mockSupabaseClient.from().single.mockResolvedValue({
        data: submittedReport,
        error: null,
      })

      await submitDailyReport(reportId)

      expect(notifyDailyReportSubmitted).toHaveBeenCalledWith(
        reportId,
        'user-123'
      )
    })
  })

  describe('approveDailyReport', () => {
    it('should approve a submitted report', async () => {
      const reportId = 'report-123'
      const approvedReport = { 
        id: reportId, 
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: 'user-123',
      }

      mockSupabaseClient.from().single.mockResolvedValue({
        data: approvedReport,
        error: null,
      })

      const result = await approveDailyReport(reportId, 'Good work!')

      expect(result).toEqual({ success: true, data: approvedReport })
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
        status: 'approved',
        approved_at: expect.any(String),
        approved_by: 'user-123',
        approval_comment: 'Good work!',
        updated_at: expect.any(String),
      })
    })

    it('should trigger notification on approval', async () => {
      const { notifyDailyReportApproved } = require('@/lib/notifications/triggers')
      const reportId = 'report-123'
      const approvedReport = { 
        id: reportId, 
        status: 'approved',
        created_by: 'worker-123',
      }

      mockSupabaseClient.from().single.mockResolvedValue({
        data: approvedReport,
        error: null,
      })

      await approveDailyReport(reportId)

      expect(notifyDailyReportApproved).toHaveBeenCalledWith(
        reportId,
        'worker-123'
      )
    })
  })

  describe('rejectDailyReport', () => {
    it('should reject a submitted report with reason', async () => {
      const reportId = 'report-123'
      const rejectedReport = { 
        id: reportId, 
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: 'user-123',
        rejection_reason: 'Missing information',
      }

      mockSupabaseClient.from().single.mockResolvedValue({
        data: rejectedReport,
        error: null,
      })

      const result = await rejectDailyReport(reportId, 'Missing information')

      expect(result).toEqual({ success: true, data: rejectedReport })
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
        status: 'rejected',
        rejected_at: expect.any(String),
        rejected_by: 'user-123',
        rejection_reason: 'Missing information',
        updated_at: expect.any(String),
      })
    })

    it('should require rejection reason', async () => {
      const result = await rejectDailyReport('report-123', '')

      expect(result).toEqual({
        success: false,
        error: '반려 사유를 입력해주세요.',
      })
    })
  })

  describe('getDailyReports', () => {
    it('should fetch daily reports with filters', async () => {
      const mockReports = [
        { id: 'report-1', work_date: '2025-08-30' },
        { id: 'report-2', work_date: '2025-08-29' },
      ]

      mockSupabaseClient.from().select.mockResolvedValue({
        data: mockReports,
        error: null,
      })

      const result = await getDailyReports({
        site_id: 'site-123',
        start_date: '2025-08-01',
        end_date: '2025-08-31',
        status: 'approved',
      })

      expect(result).toEqual({ success: true, data: mockReports })
      expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('site_id', 'site-123')
      expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('status', 'approved')
      expect(mockSupabaseClient.from().gte).toHaveBeenCalledWith('work_date', '2025-08-01')
      expect(mockSupabaseClient.from().lte).toHaveBeenCalledWith('work_date', '2025-08-31')
    })

    it('should handle empty results', async () => {
      mockSupabaseClient.from().select.mockResolvedValue({
        data: [],
        error: null,
      })

      const result = await getDailyReports({ site_id: 'site-123' })

      expect(result).toEqual({ success: true, data: [] })
    })
  })

  describe('getDailyReportById', () => {
    it('should fetch a single daily report with related data', async () => {
      const mockReport = {
        id: 'report-123',
        work_date: '2025-08-30',
        photos: [{ id: 'photo-1' }],
        work_logs: [{ id: 'log-1' }],
        materials: [{ id: 'material-1' }],
      }

      mockSupabaseClient.from().single.mockResolvedValue({
        data: mockReport,
        error: null,
      })

      const result = await getDailyReportById('report-123')

      expect(result).toEqual({ success: true, data: mockReport })
      expect(mockSupabaseClient.from().select).toHaveBeenCalledWith('*, photos(*), work_logs(*), materials(*)')
    })

    it('should handle not found errors', async () => {
      mockSupabaseClient.from().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      const result = await getDailyReportById('non-existent')

      expect(result).toEqual({
        success: false,
        error: '일일보고서를 찾을 수 없습니다.',
      })
    })
  })

  describe('deleteDailyReport', () => {
    it('should delete a draft report', async () => {
      const reportId = 'report-123'
      
      // Check report status
      mockSupabaseClient.from().single.mockResolvedValueOnce({
        data: { id: reportId, status: 'draft' },
        error: null,
      })
      
      // Delete report
      mockSupabaseClient.from().eq.mockResolvedValueOnce({
        error: null,
      })

      const result = await deleteDailyReport(reportId)

      expect(result).toEqual({ success: true })
      expect(mockSupabaseClient.from().delete).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/daily-reports')
    })

    it('should not delete approved reports', async () => {
      mockSupabaseClient.from().single.mockResolvedValue({
        data: { id: 'report-123', status: 'approved' },
        error: null,
      })

      const result = await deleteDailyReport('report-123')

      expect(result).toEqual({
        success: false,
        error: '승인된 보고서는 삭제할 수 없습니다.',
      })
      expect(mockSupabaseClient.from().delete).not.toHaveBeenCalled()
    })
  })
})