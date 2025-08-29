import { createClient } from '@/lib/supabase/server'
import { 
  approveWorkflow,
  rejectWorkflow,
  handleConcurrentEdit,
  cascadeDeleteSite,
  createAuditLog,
  rollbackTransaction
} from '../workflows'
import { createDailyReport, updateDailyReport } from '../daily-reports'
import { assignUserToSite } from '../site-info'
import type { DailyReport, Profile, Site } from '@/types'

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

describe('Complex Business Workflows', () => {
  let mockSupabase: any
  
  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null
        })
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      rpc: jest.fn().mockReturnThis()
    }
    
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })
  
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Multi-step Approval Workflows', () => {
    it('should handle daily report approval workflow with role-based progression', async () => {
      // Setup: Create report -> Worker submits -> Site Manager approves -> Admin final approval
      const reportId = 'test-report-id'
      
      // Mock worker creating report
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: reportId, status: 'draft', created_by: 'worker-id' },
          error: null
        })
      })
      
      // Test approval chain
      const approvalSteps = [
        { role: 'worker', action: 'submit', nextStatus: 'pending_approval' },
        { role: 'site_manager', action: 'approve', nextStatus: 'approved_by_manager' },
        { role: 'admin', action: 'approve', nextStatus: 'final_approved' }
      ]
      
      for (const step of approvalSteps) {
        mockSupabase.from.mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { 
              id: reportId, 
              status: step.role === 'worker' ? 'draft' : approvalSteps[approvalSteps.indexOf(step) - 1].nextStatus 
            },
            error: null
          })
        })
        
        mockSupabase.from.mockReturnValueOnce({
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: reportId, status: step.nextStatus },
            error: null
          })
        })
        
        const result = await approveWorkflow(reportId, step.role)
        expect(result.success).toBe(true)
        expect(result.data?.status).toBe(step.nextStatus)
      }
    })

    it('should reject workflow and reset to previous state', async () => {
      const reportId = 'test-report-id'
      
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: reportId, status: 'pending_approval' },
          error: null
        })
      })
      
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: reportId, status: 'rejected', rejection_reason: 'Incomplete data' },
          error: null
        })
      })
      
      const result = await rejectWorkflow(reportId, 'site_manager', 'Incomplete data')
      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('rejected')
      expect(result.data?.rejection_reason).toBe('Incomplete data')
    })
  })

  describe('Concurrent Edit Handling', () => {
    it('should detect and handle concurrent edits using optimistic locking', async () => {
      const reportId = 'test-report-id'
      const version1 = 1
      const version2 = 2
      
      // User 1 loads report
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: reportId, version: version1, content: 'Original content' },
          error: null
        })
      })
      
      // User 2 updates report (incrementing version)
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: reportId, version: version2, content: 'User 2 content' },
          error: null
        })
      })
      
      // User 1 tries to update with old version
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: reportId, version: version2 }, // Current version is now 2
          error: null
        })
      })
      
      const result = await handleConcurrentEdit(reportId, version1, { content: 'User 1 content' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('concurrent edit')
    })

    it('should successfully update when version matches', async () => {
      const reportId = 'test-report-id'
      const currentVersion = 1
      
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: reportId, version: currentVersion },
          error: null
        })
      })
      
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: reportId, version: currentVersion + 1, content: 'Updated content' },
          error: null
        })
      })
      
      const result = await handleConcurrentEdit(reportId, currentVersion, { content: 'Updated content' })
      expect(result.success).toBe(true)
      expect(result.data?.version).toBe(currentVersion + 1)
    })
  })

  describe('Cross-Entity Data Consistency', () => {
    it('should cascade delete site and all related entities', async () => {
      const siteId = 'test-site-id'
      
      // Mock checking for related entities
      const relatedEntities = {
        daily_reports: [{ id: 'report-1' }, { id: 'report-2' }],
        attendance_records: [{ id: 'attendance-1' }, { id: 'attendance-2' }],
        documents: [{ id: 'doc-1' }, { id: 'doc-2' }],
        site_workers: [{ id: 'worker-1' }, { id: 'worker-2' }]
      }
      
      // Mock queries for each entity type
      Object.entries(relatedEntities).forEach(([table, records]) => {
        mockSupabase.from.mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({
            data: records,
            error: null
          })
        })
      })
      
      // Mock deletion of each entity type
      Object.keys(relatedEntities).forEach(() => {
        mockSupabase.from.mockReturnValueOnce({
          delete: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      })
      
      // Mock site deletion
      mockSupabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: siteId },
          error: null
        })
      })
      
      const result = await cascadeDeleteSite(siteId)
      expect(result.success).toBe(true)
      expect(result.data?.deletedEntities).toEqual({
        daily_reports: 2,
        attendance_records: 2,
        documents: 2,
        site_workers: 2
      })
    })

    it('should maintain referential integrity when deleting fails', async () => {
      const siteId = 'test-site-id'
      
      // Mock successful check for related entities
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [{ id: 'report-1' }],
          error: null
        })
      })
      
      // Mock failed deletion
      mockSupabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Foreign key constraint violation' }
        })
      })
      
      const result = await cascadeDeleteSite(siteId)
      expect(result.success).toBe(false)
      expect(result.error).toContain('constraint')
    })
  })

  describe('Audit Trail Generation', () => {
    it('should create audit logs for all business operations', async () => {
      const auditData = {
        entity_type: 'daily_report',
        entity_id: 'test-report-id',
        action: 'update',
        user_id: 'test-user-id',
        changes: {
          status: { from: 'draft', to: 'submitted' },
          weather: { from: 'sunny', to: 'rainy' }
        },
        metadata: {
          ip_address: '127.0.0.1',
          user_agent: 'Test Browser'
        }
      }
      
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'audit-log-id',
            ...auditData,
            created_at: new Date().toISOString()
          },
          error: null
        })
      })
      
      const result = await createAuditLog(auditData)
      expect(result.success).toBe(true)
      expect(result.data?.entity_type).toBe('daily_report')
      expect(result.data?.changes).toEqual(auditData.changes)
    })

    it('should capture all required fields in audit logs', async () => {
      const requiredFields = [
        'entity_type',
        'entity_id',
        'action',
        'user_id',
        'changes',
        'created_at'
      ]
      
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockImplementation(async () => {
          // Verify all required fields are present
          const insertCall = mockSupabase.from.mock.calls[0]
          const insertData = mockSupabase.insert.mock.calls[0][0]
          
          requiredFields.forEach(field => {
            expect(insertData).toHaveProperty(field)
          })
          
          return {
            data: { id: 'audit-log-id', ...insertData },
            error: null
          }
        })
      })
      
      await createAuditLog({
        entity_type: 'site',
        entity_id: 'site-id',
        action: 'create',
        user_id: 'user-id',
        changes: { name: { from: null, to: 'New Site' } }
      })
    })
  })

  describe('Transaction Rollback', () => {
    it('should rollback all operations on partial failure', async () => {
      // Simulate a multi-step operation that fails partway through
      const operations = [
        { table: 'daily_reports', action: 'insert', data: { id: 'report-1' } },
        { table: 'attendance_records', action: 'insert', data: { id: 'attendance-1' } },
        { table: 'notifications', action: 'insert', data: { id: 'notification-1' } }
      ]
      
      // Mock successful first operation
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: operations[0].data,
          error: null
        })
      })
      
      // Mock failed second operation
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Constraint violation' }
        })
      })
      
      // Mock rollback operations
      mockSupabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })
      
      const result = await rollbackTransaction(operations)
      expect(result.success).toBe(false)
      expect(result.error).toContain('rolled back')
      expect(mockSupabase.delete).toHaveBeenCalled()
    })

    it('should successfully complete all operations in a transaction', async () => {
      const operations = [
        { table: 'daily_reports', action: 'insert', data: { id: 'report-1' } },
        { table: 'attendance_records', action: 'insert', data: { id: 'attendance-1' } }
      ]
      
      operations.forEach(op => {
        mockSupabase.from.mockReturnValueOnce({
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: op.data,
            error: null
          })
        })
      })
      
      const result = await rollbackTransaction(operations)
      expect(result.success).toBe(true)
      expect(result.data?.completed).toBe(operations.length)
    })
  })
})