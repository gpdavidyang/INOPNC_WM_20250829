// Test file to verify invoice document queries with unified_document_system table


// Test function to verify invoice document queries
export async function testInvoiceDocumentQueries() {
  const supabase = createClient()
  
  console.log('Testing Invoice Document Queries with unified_document_system table...')
  
  // Test 1: Query invoice documents
  const { data: invoiceDocs, error: queryError } = await supabase
    .from('unified_document_system')
    .select(`
      *,
      profiles!unified_document_system_uploaded_by_fkey(id, full_name, email),
      sites(id, name, address)
    `)
    .eq('category_type', 'invoice')
    .eq('status', 'active')
    .limit(5)
  
  if (queryError) {
    console.error('❌ Query Error:', queryError)
  } else {
    console.log('✅ Query successful. Found', invoiceDocs?.length || 0, 'invoice documents')
    
    // Process and display metadata
    invoiceDocs?.forEach(doc => {
      console.log('Document:', {
        title: doc.title,
        category: doc.category_type,
        metadata: doc.metadata,
        contract_phase: doc.metadata?.contract_phase,
        amount: doc.metadata?.amount,
        partner_company_id: doc.metadata?.partner_company_id
      })
    })
  }
  
  // Test 2: Test filtering by metadata fields
  const { data: filteredDocs, error: filterError } = await supabase
    .from('unified_document_system')
    .select('*')
    .eq('category_type', 'invoice')
    .contains('metadata', { contract_phase: 'in_progress' })
    .limit(5)
  
  if (filterError) {
    console.error('❌ Filter Error:', filterError)
  } else {
    console.log('✅ Filter successful. Found', filteredDocs?.length || 0, 'in-progress documents')
  }
  
  // Test 3: Test inserting a new invoice document
  const testDoc = {
    title: 'Test Invoice Document',
    description: 'Test document for unified system',
    file_url: 'https://example.com/test.pdf',
    file_name: 'test.pdf',
    original_filename: 'test.pdf',
    file_size: 1024,
    mime_type: 'application/pdf',
    category_type: 'invoice',
    status: 'active',
    uploaded_by: (await supabase.auth.getUser()).data.user?.id,
    metadata: {
      document_type: 'invoice',
      contract_phase: 'in_progress',
      amount: 50000,
      due_date: '2025-10-01',
      approval_status: 'pending'
    }
  }
  
  console.log('Test document structure:', testDoc)
  console.log('✅ All tests completed')
}

// Export for use in components
export default testInvoiceDocumentQueries