import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function debugRequiredDocumentsId() {
  console.log('🔍 디버깅: document_requirements 테이블 ID 형식 확인\n')
  
  try {
    // 1. document_requirements 테이블 확인
    console.log('1️⃣ document_requirements 테이블 데이터:')
    const { data: requirements, error } = await supabase
      .from('document_requirements')
      .select('*')
      .limit(5)
    
    if (error) {
      console.error('❌ Error:', error)
      return
    }
    
    if (requirements && requirements.length > 0) {
      requirements.forEach(req => {
        console.log('\n📋 Requirement:')
        console.log('  ID:', req.id)
        console.log('  ID Type:', typeof req.id)
        console.log('  ID Length:', req.id?.length)
        console.log('  Is UUID?:', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.id))
        console.log('  Name:', req.requirement_name)
        console.log('  Document Type:', req.document_type)
        console.log('  Is Active:', req.is_active)
      })
    }
    
    // 2. API에서 반환하는 형식 확인
    console.log('\n2️⃣ /api/required-document-types가 반환하는 형식:')
    const apiResponse = await fetch('http://localhost:3015/api/required-document-types')
    if (apiResponse.ok) {
      const apiData = await apiResponse.json()
      if (apiData.required_documents && apiData.required_documents.length > 0) {
        const firstDoc = apiData.required_documents[0]
        console.log('  Sample document from API:')
        console.log('    ID:', firstDoc.id)
        console.log('    ID Type:', typeof firstDoc.id)
        console.log('    Name:', firstDoc.name_ko)
      }
    }
    
    // 3. 테스트: 특정 ID로 조회
    console.log('\n3️⃣ 특정 ID로 조회 테스트:')
    
    // 첫 번째 requirement의 ID로 테스트
    if (requirements && requirements.length > 0) {
      const testId = requirements[0].id
      console.log('  Testing with ID:', testId)
      
      const { data: testData, error: testError } = await supabase
        .from('document_requirements')
        .select('*')
        .eq('id', testId)
        .single()
      
      if (testError) {
        console.error('  ❌ Query failed:', testError)
      } else {
        console.log('  ✅ Query succeeded:', testData?.requirement_name)
      }
    }
    
    // 4. documents 테이블의 document_type 제약 확인
    console.log('\n4️⃣ documents 테이블 document_type 허용값:')
    console.log('  - personal')
    console.log('  - shared')
    console.log('  - blueprint')
    console.log('  - report')
    console.log('  - certificate')
    console.log('  - other')
    
    console.log('\n5️⃣ 결론:')
    console.log('  필수서류 업로드 시:')
    console.log('  - documentType: "other" (고정)')
    console.log('  - requirementId: requirement의 실제 ID')
    console.log('  - isRequired: "true"')
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugRequiredDocumentsId().catch(console.error)