/**
 * Documents Testing Examples
 * 
 * This file demonstrates how to use the documents factory for testing
 * the unified documents system with card-based UI.
 */

import { 
  createMockDocumentFile,
  createMockDailyReport,
  createMockApprovalDocument,
  createMockMaterialDocument,
  createMockMarkupDocument,
  createMockDocumentCard,
  createMockDocumentCardList,
  getFileTypeInfo,
  FILE_TYPE_COLORS
} from '@/lib/test-utils'

// Example 1: Testing document upload functionality
export function testDocumentUpload() {
  const mockFile = createMockDocumentFile({
    title: 'Q3 2024 안전점검표.pdf',
    mime_type: 'application/pdf',
    file_size: 2048576, // 2MB
    document_type: 'shared',
    folder_path: '/안전관리'
  })

  // The document includes cardUI information for rendering
  console.log('File type badge:', mockFile.cardUI.label) // 'PDF'
  console.log('Badge colors:', mockFile.cardUI) // { bg: 'bg-red-100', text: 'text-red-700', ... }
}

// Example 2: Testing unified document list view
export function testUnifiedDocumentsList() {
  // Create a mixed list of documents as they appear in the unified tab
  const documents = createMockDocumentCardList({
    count: 20,
    location: 'personal',
    types: ['daily_report', 'approval', 'material', 'markup', 'file']
  })

  // Documents are pre-sorted by date (newest first)
  documents.forEach(doc => {
    console.log(`[${doc.fileType}] ${doc.title} - ${doc.createdAt}`)
    
    // Each document has UI-specific properties
    if (doc.statusBadge) {
      console.log(`  Status: ${doc.statusBadge.label}`)
    }
    if (doc.icon) {
      console.log(`  Icon: ${doc.icon}`)
    }
  })
}

// Example 3: Testing daily report cards
export function testDailyReportCard() {
  const reportCard = createMockDocumentCard({ type: 'daily_report' })
  
  // Daily reports have specific properties
  expect(reportCard.category).toBe('work-reports')
  expect(reportCard.fileTypeColor).toEqual(FILE_TYPE_COLORS['pdf'])
  expect(reportCard.statusBadge).toBeDefined()
  expect(['제출완료', '작성중']).toContain(reportCard.statusBadge?.label)
}

// Example 4: Testing markup document cards
export function testMarkupDocumentCard() {
  const markupCard = createMockDocumentCard({ type: 'markup' })
  
  // Markup documents have special properties
  expect(markupCard.category).toBe('construction-docs')
  expect(markupCard.fileTypeColor.label).toBe('도면')
  expect(markupCard.previewUrl).toBeDefined()
  expect(markupCard.url).toContain('/dashboard/markup?open=')
  expect(markupCard.statusBadge?.label).toContain('마킹')
}

// Example 5: Testing document filtering and search
export function testDocumentFiltering() {
  // Create documents with specific properties for filtering
  const personalDocs = createMockDocumentCardList({ 
    count: 10, 
    location: 'personal' 
  })
  
  const sharedDocs = createMockDocumentCardList({ 
    count: 10, 
    location: 'shared' 
  })
  
  // Filter by type
  const onlyReports = personalDocs.filter(doc => doc.category === 'work-reports')
  const onlyMarkups = personalDocs.filter(doc => doc.fileType === 'markup')
  
  // Search simulation
  const searchTerm = '안전'
  const searchResults = personalDocs.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  )
}

// Example 6: Testing approval workflow
export function testApprovalWorkflow() {
  // Create approval document with different statuses
  const pendingApproval = createMockApprovalDocument({
    status: 'pending',
    title: '추가공사 승인요청'
  })
  
  const approvedDoc = createMockApprovalDocument({
    status: 'approved',
    approved_at: new Date().toISOString()
  })
  
  // Convert to card format for UI
  const pendingCard = createMockDocumentCard({ type: 'approval' })
  expect(pendingCard.statusBadge?.label).toBe('대기중')
  
  const approvedCard = createMockDocumentCard({ type: 'approval' })
  // Status badge will be randomly assigned, but we can check it exists
  expect(['승인', '반려', '수정요청', '대기중']).toContain(approvedCard.statusBadge?.label)
}

// Example 7: Testing material document with transactions
export function testMaterialTransactions() {
  // Create incoming material document
  const incomingMaterial = createMockMaterialDocument({
    material_type: 'NPC-1000',
    transaction_type: 'incoming',
    quantity: 500,
    unit: 'kg'
  })
  
  // Create card representation
  const materialCard = createMockDocumentCard({ type: 'material' })
  
  // Material cards have transaction icons
  expect(['📥', '📤', '📊']).toContain(materialCard.icon)
  expect(materialCard.fileTypeColor).toEqual(FILE_TYPE_COLORS['excel'])
}

// Example 8: Testing file type detection
export function testFileTypeDetection() {
  const testCases = [
    { mime: 'application/pdf', expected: 'PDF' },
    { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', expected: 'DOC' },
    { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', expected: 'XLS' },
    { mime: 'image/jpeg', expected: 'IMG' },
    { mime: 'text/plain', expected: 'FILE' }
  ]
  
  testCases.forEach(({ mime, expected }) => {
    const fileInfo = getFileTypeInfo(mime)
    expect(fileInfo.label).toBe(expected)
  })
  
  // Special case: markup documents override mime type
  const markupInfo = getFileTypeInfo('application/pdf', 'markup-document')
  expect(markupInfo.label).toBe('도면')
}

// Example 9: Testing document list component
export function testDocumentListComponent() {
  // Simulate loading documents for the unified tab
  const mockDocuments = createMockDocumentCardList({ count: 50 })
  
  // Group by category
  const grouped = mockDocuments.reduce((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = []
    acc[doc.category].push(doc)
    return acc
  }, {} as Record<string, typeof mockDocuments>)
  
  // Display counts by category
  Object.entries(grouped).forEach(([category, docs]) => {
    console.log(`${category}: ${docs.length} documents`)
  })
}

// Example 10: Integration test with Supabase mock
export async function testDocumentCRUD() {
  const { createMockSupabaseClient } = await import('@/lib/test-utils')
  const supabase = createMockSupabaseClient()
  
  // Create a new document
  const newDoc = createMockDocumentFile({
    title: '2024년 하반기 시공계획서',
    document_type: 'shared'
  })
  
  // Mock insert
  const { data, error } = await supabase
    .from('documents')
    .insert(newDoc)
    .select()
    .single()
  
  expect(error).toBeNull()
  expect(data).toMatchObject(newDoc)
  
  // Mock fetch with markup documents
  const markupDocs = Array.from({ length: 5 }, () => createMockMarkupDocument())
  
  const { data: allDocs } = await supabase
    .from('markup_documents')
    .select('*')
    .eq('location', 'personal')
  
  expect(allDocs).toHaveLength(5)
}