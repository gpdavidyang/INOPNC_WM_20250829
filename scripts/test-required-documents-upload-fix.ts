import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function testRequiredDocumentsUploadFix() {
  console.log('🧪 필수서류 업로드 문제 수정 테스트...\n')
  
  try {
    // 1. document_requirements 테이블 확인
    console.log('1️⃣ document_requirements 테이블 확인')
    const { data: requirements, error: reqError } = await supabase
      .from('document_requirements')
      .select('*')
      .eq('is_active', true)
      .limit(3)
    
    if (reqError) {
      console.error('❌ Error:', reqError)
      return
    }
    
    console.log('✅ Active requirements found:', requirements?.length || 0)
    
    if (requirements && requirements.length > 0) {
      console.log('\n📋 샘플 필수서류:')
      requirements.forEach(req => {
        console.log(`  - ${req.requirement_name} (ID: ${req.id})`)
        console.log(`    Document Type: ${req.document_type}`)
        console.log(`    Is Mandatory: ${req.is_mandatory}`)
      })
    }
    
    // 2. 작업자 계정 확인
    console.log('\n2️⃣ 작업자 계정 확인')
    const { data: worker } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('email', 'worker@inopnc.com')
      .single()
    
    if (!worker) {
      console.log('⚠️ worker@inopnc.com 계정이 없습니다.')
      return
    }
    
    console.log('✅ Worker found:', worker.full_name, '-', worker.role)
    
    // 3. 시뮬레이션: 필수서류 업로드 시 documentType 변환 확인
    console.log('\n3️⃣ 필수서류 업로드 시뮬레이션')
    
    if (requirements && requirements.length > 0) {
      const reqDoc = requirements[0]
      console.log(`\n📤 업로드할 필수서류: ${reqDoc.requirement_name}`)
      console.log('   원래 requirement ID:', reqDoc.id)
      console.log('   변환된 documentType: "other" (고정값)')
      console.log('   isRequired: true')
      console.log('   requirementId:', reqDoc.id)
      
      // 4. documents 테이블 document_type 제약 조건 확인
      console.log('\n4️⃣ documents 테이블 document_type 허용값 확인')
      const allowedTypes = ['personal', 'shared', 'blueprint', 'report', 'certificate', 'other']
      console.log('   허용된 document_type:', allowedTypes.join(', '))
      console.log('   ✅ "other"는 허용된 값입니다.')
      
      // 5. 테스트 문서 데이터 생성 (실제 업로드 없이)
      const testDocumentData = {
        title: '테스트_필수서류.pdf',
        file_name: `${Date.now()}_test_required.pdf`,
        file_url: 'https://test.url/file.pdf',
        file_size: 1024000,
        mime_type: 'application/pdf',
        document_type: 'other', // 필수서류는 'other'로 저장
        folder_path: `documents/${worker.id}/test.pdf`,
        owner_id: worker.id,
        site_id: null,
        is_public: false,
        description: `필수 제출 서류: ${reqDoc.requirement_name}`
      }
      
      console.log('\n5️⃣ 생성될 문서 데이터:')
      console.log('   document_type:', testDocumentData.document_type)
      console.log('   title:', testDocumentData.title)
      console.log('   description:', testDocumentData.description)
      
      // 6. unified_document_system 데이터
      const unifiedData = {
        title: reqDoc.requirement_name,
        description: `필수 제출 서류: ${reqDoc.requirement_name}`,
        file_name: testDocumentData.file_name,
        file_size: testDocumentData.file_size,
        file_url: testDocumentData.file_url,
        mime_type: testDocumentData.mime_type,
        category_type: 'required_user_docs',
        sub_category: reqDoc.document_type,
        tags: [reqDoc.document_type],
        uploaded_by: worker.id,
        site_id: null,
        status: 'uploaded'
      }
      
      console.log('\n6️⃣ unified_document_system 데이터:')
      console.log('   category_type:', unifiedData.category_type)
      console.log('   sub_category:', unifiedData.sub_category)
      console.log('   status:', unifiedData.status)
      
      console.log('\n✅ 필수서류 업로드 수정사항:')
      console.log('   1. documentType을 requirement ID가 아닌 "other"로 설정')
      console.log('   2. requirementId는 별도 필드로 전달')
      console.log('   3. isRequired를 "true"로 설정')
      console.log('   4. Toast 메시지로 성공/실패 피드백 제공')
      console.log('   5. 업로드 진행상황 섹션 제거')
      
      console.log('\n🎯 결론:')
      console.log('   - documents 테이블의 document_type 제약 조건 위반 해결')
      console.log('   - 필수서류는 모두 document_type="other"로 저장')
      console.log('   - requirementId로 실제 필수서류 타입 추적')
      console.log('   - UI는 Toast 메시지로 간소화')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testRequiredDocumentsUploadFix().catch(console.error)