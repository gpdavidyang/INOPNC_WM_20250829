import { faker } from '@faker-js/faker'
import {
  createMockDocumentFile,
  createMockDailyReport,
  createMockApprovalDocument,
  createMockMaterialDocument,
  createMockMarkupDocument,
  createMockDocumentCard,
  createMockDocumentCardList,
  getFileTypeInfo,
  FILE_TYPE_COLORS,
  isDailyReport,
  isApprovalDocument,
  isMaterialDocument,
  isMarkupDocument
} from '../documents.factory'

describe('Documents Factory', () => {
  beforeEach(() => {
    faker.seed(12345) // Consistent random data for tests
  })

  describe('getFileTypeInfo', () => {
    it('should return correct file type info for different mime types', () => {
      expect(getFileTypeInfo('application/pdf')).toEqual(FILE_TYPE_COLORS['pdf'])
      expect(getFileTypeInfo('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toEqual(FILE_TYPE_COLORS['word'])
      expect(getFileTypeInfo('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toEqual(FILE_TYPE_COLORS['excel'])
      expect(getFileTypeInfo('image/jpeg')).toEqual(FILE_TYPE_COLORS['image'])
      expect(getFileTypeInfo('text/plain')).toEqual(FILE_TYPE_COLORS['file'])
    })

    it('should prioritize document type over mime type', () => {
      expect(getFileTypeInfo('application/pdf', 'markup-document')).toEqual(FILE_TYPE_COLORS['markup-document'])
    })

    it('should handle null/undefined mime types', () => {
      expect(getFileTypeInfo(null)).toEqual(FILE_TYPE_COLORS['file'])
      expect(getFileTypeInfo(undefined)).toEqual(FILE_TYPE_COLORS['file'])
    })
  })

  describe('createMockDocumentFile', () => {
    it('should create a document file with default values', () => {
      const doc = createMockDocumentFile()
      
      expect(doc).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        description: expect.any(String),
        file_url: expect.stringMatching(/^\/documents\//),
        file_name: expect.any(String),
        file_size: expect.any(Number),
        mime_type: expect.any(String),
        document_type: expect.stringMatching(/^(personal|shared|blueprint|report|certificate|other)$/),
        folder_path: expect.any(String),
        owner_id: expect.any(String),
        is_public: expect.any(Boolean),
        site_id: expect.any(String),
        created_at: expect.any(String),
        updated_at: expect.any(String),
        cardUI: expect.objectContaining({
          bg: expect.any(String),
          text: expect.any(String),
          border: expect.any(String),
          label: expect.any(String)
        })
      })
    })

    it('should accept overrides', () => {
      const overrides = {
        title: 'Custom Title',
        mime_type: 'application/pdf',
        file_size: 5000000
      }
      
      const doc = createMockDocumentFile(overrides)
      
      expect(doc.title).toBe('Custom Title')
      expect(doc.mime_type).toBe('application/pdf')
      expect(doc.file_size).toBe(5000000)
      expect(doc.cardUI).toEqual(FILE_TYPE_COLORS['pdf'])
    })
  })

  describe('createMockDailyReport', () => {
    it('should create a daily report with valid data', () => {
      const report = createMockDailyReport()
      
      expect(report).toMatchObject({
        id: expect.any(String),
        site_id: expect.any(String),
        work_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        member_name: expect.stringMatching(/^(슬라브|거더|기둥|벽체|기타)$/),
        process_type: expect.stringMatching(/^(균열보수|면처리|마감작업|철근조립|콘크리트타설)$/),
        total_workers: expect.any(Number),
        npc1000_incoming: expect.any(Number),
        npc1000_used: expect.any(Number),
        npc1000_remaining: expect.any(Number),
        receipt_total_amount: expect.any(Number),
        status: expect.stringMatching(/^(draft|submitted)$/),
        created_at: expect.any(String),
        created_by: expect.any(String),
        updated_at: expect.any(String)
      })
    })

    it('should handle optional fields correctly', () => {
      const report = createMockDailyReport()
      
      // Optional fields should be either null or string
      expect(typeof report.issues === 'string' || report.issues === null).toBe(true)
      expect(typeof report.request_from_hq === 'string' || report.request_from_hq === null).toBe(true)
      expect(typeof report.notes === 'string' || report.notes === null).toBe(true)
      expect(typeof report.submitted_at === 'string' || report.submitted_at === null).toBe(true)
    })
  })

  describe('createMockApprovalDocument', () => {
    it('should create an approval document with attached files', () => {
      const approval = createMockApprovalDocument()
      
      expect(approval).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        description: expect.any(String),
        document_type: 'approval',
        status: expect.stringMatching(/^(pending|approved|rejected|revision_requested)$/),
        approver_id: expect.any(String),
        approver_name: expect.any(String),
        requester_id: expect.any(String),
        requester_name: expect.any(String),
        requested_at: expect.any(String),
        attached_files: expect.any(Array),
        created_at: expect.any(String),
        updated_at: expect.any(String)
      })
      
      // Check attached files
      if (approval.attached_files.length > 0) {
        approval.attached_files.forEach((file: any) => {
          expect(file).toHaveProperty('id')
          expect(file).toHaveProperty('cardUI')
        })
      }
    })
  })

  describe('createMockMaterialDocument', () => {
    it('should create a material document with correct properties', () => {
      const material = createMockMaterialDocument()
      
      expect(material).toMatchObject({
        id: expect.any(String),
        title: expect.stringContaining('입출고 현황'),
        document_type: 'material',
        material_type: expect.any(String),
        transaction_type: expect.stringMatching(/^(incoming|outgoing|inventory)$/),
        quantity: expect.any(Number),
        unit: expect.stringMatching(/^(kg|ton|m³|ea)$/),
        supplier: expect.stringContaining('건설자재'),
        price_per_unit: expect.any(Number),
        total_price: expect.any(Number),
        transaction_date: expect.any(String),
        warehouse_location: expect.any(String),
        created_by: expect.any(String),
        created_at: expect.any(String),
        updated_at: expect.any(String)
      })
    })
  })

  describe('createMockMarkupDocument', () => {
    it('should create a markup document with markup data', () => {
      const markup = createMockMarkupDocument()
      
      expect(markup).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        description: expect.any(String),
        original_blueprint_url: expect.stringMatching(/^\/blueprints\//),
        original_blueprint_filename: expect.stringContaining('blueprint_'),
        markup_data: expect.any(Array),
        preview_image_url: expect.stringMatching(/^\/previews\//),
        location: expect.stringMatching(/^(personal|shared)$/),
        created_by: expect.any(String),
        created_at: expect.any(String),
        updated_at: expect.any(String),
        site_id: expect.any(String),
        is_deleted: false,
        file_size: expect.any(Number),
        markup_count: expect.any(Number)
      })
      
      // Check markup data structure
      expect(markup.markup_data.length).toBeGreaterThan(0)
      markup.markup_data.forEach((item: any) => {
        expect(item).toMatchObject({
          id: expect.any(String),
          type: expect.stringMatching(/^(box|text|drawing)$/),
          x: expect.any(Number),
          y: expect.any(Number),
          width: expect.any(Number),
          height: expect.any(Number),
          color: expect.stringMatching(/^(red|blue|green)$/)
        })
      })
    })
  })

  describe('createMockDocumentCard', () => {
    it('should create document cards for all types', () => {
      const types = ['daily_report', 'approval', 'material', 'markup', 'file'] as const
      
      types.forEach(type => {
        const card = createMockDocumentCard({ type })
        
        expect(card).toMatchObject({
          id: expect.any(String),
          title: expect.any(String),
          category: expect.any(String),
          fileType: expect.any(String),
          fileTypeColor: expect.objectContaining({
            bg: expect.any(String),
            text: expect.any(String),
            border: expect.any(String),
            label: expect.any(String)
          }),
          size: expect.any(Number),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          createdBy: expect.any(String),
          location: expect.stringMatching(/^(personal|shared)$/)
        })
      })
    })

    it('should create daily report card with status badge', () => {
      const card = createMockDocumentCard({ type: 'daily_report' })
      
      expect(card.category).toBe('work-reports')
      expect(card.statusBadge).toBeDefined()
      expect(card.statusBadge).toMatchObject({
        label: expect.stringMatching(/^(제출완료|작성중)$/),
        color: expect.any(String)
      })
    })

    it('should create material document card with transaction icon', () => {
      const card = createMockDocumentCard({ type: 'material' })
      
      expect(card.category).toBe('material-docs')
      expect(card.icon).toBeDefined()
      expect(card.icon).toMatch(/^(📥|📤|📊)$/)
    })

    it('should create markup document card with preview URL', () => {
      const card = createMockDocumentCard({ type: 'markup' })
      
      expect(card.category).toBe('construction-docs')
      expect(card.previewUrl).toBeDefined()
      expect(card.url).toContain('/dashboard/markup?open=')
      expect(card.statusBadge).toMatchObject({
        label: expect.stringContaining('마킹'),
        color: 'bg-purple-100 text-purple-700'
      })
    })
  })

  describe('createMockDocumentCardList', () => {
    it('should create a list of mixed document cards', () => {
      const cards = createMockDocumentCardList({ count: 10 })
      
      expect(cards).toHaveLength(10)
      expect(cards[0].createdAt).toBeDefined()
      
      // Should be sorted by date (newest first)
      for (let i = 1; i < cards.length; i++) {
        const prevDate = new Date(cards[i - 1].createdAt).getTime()
        const currDate = new Date(cards[i].createdAt).getTime()
        expect(prevDate).toBeGreaterThanOrEqual(currDate)
      }
    })

    it('should filter by document types', () => {
      const cards = createMockDocumentCardList({ 
        count: 20, 
        types: ['daily_report', 'material'] 
      })
      
      cards.forEach(card => {
        expect(['work-reports', 'material-docs']).toContain(card.category)
      })
    })

    it('should respect location parameter', () => {
      // When location is specified, all cards should have that location
      const personalCards = createMockDocumentCardList({ count: 5, location: 'personal' })
      personalCards.forEach(card => expect(card.location).toBe('personal'))
      
      const sharedCards = createMockDocumentCardList({ count: 5, location: 'shared' })
      sharedCards.forEach(card => expect(card.location).toBe('shared'))
    })
  })

  describe('Type Guards', () => {
    it('isDailyReport should correctly identify daily reports', () => {
      const dailyReport = createMockDailyReport()
      const otherDoc = createMockDocumentFile()
      
      expect(isDailyReport(dailyReport)).toBe(true)
      expect(isDailyReport(otherDoc)).toBe(false)
      expect(isDailyReport(null)).toBe(false)
      expect(isDailyReport(undefined)).toBe(false)
    })

    it('isApprovalDocument should correctly identify approval documents', () => {
      const approval = createMockApprovalDocument()
      const otherDoc = createMockDocumentFile()
      
      expect(isApprovalDocument(approval)).toBe(true)
      expect(isApprovalDocument(otherDoc)).toBe(false)
    })

    it('isMaterialDocument should correctly identify material documents', () => {
      const material = createMockMaterialDocument()
      const otherDoc = createMockDocumentFile()
      
      expect(isMaterialDocument(material)).toBe(true)
      expect(isMaterialDocument(otherDoc)).toBe(false)
    })

    it('isMarkupDocument should correctly identify markup documents', () => {
      const markup = createMockMarkupDocument()
      const otherDoc = createMockDocumentFile()
      
      expect(isMarkupDocument(markup)).toBe(true)
      expect(isMarkupDocument(otherDoc)).toBe(false)
    })
  })
})

