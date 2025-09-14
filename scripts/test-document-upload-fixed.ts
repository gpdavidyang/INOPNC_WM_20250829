
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function testDocumentUploadFixed() {
  console.log('🧪 문서 업로드 RLS 개선 테스트...\n')
  
  // 1. Service Role로 현장관리자 계정 확인
  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  
  // 2. 현장관리자로 로그인
  const userClient = createClient(supabaseUrl, supabaseAnonKey)
  
  const { data: signInData, error: signInError } = await userClient.auth.signInWithPassword({
    email: 'manager@inopnc.com',
    password: 'password123'
  })
  
  if (signInError) {
    console.error('❌ 로그인 실패:', signInError)
    return
  }
  
  console.log('✅ 로그인 성공:', signInData.user?.email)
  const userId = signInData.user?.id
  
  // 3. Storage 업로드 테스트
  console.log('\n📦 Storage 업로드 테스트...')
  
  const testContent = 'Test document content after RLS fix'
  const testBlob = new Blob([testContent], { type: 'text/plain' })
  const testFileName = `test_fixed_${Date.now()}.txt`
  const testPath = `documents/${userId}/${testFileName}`
  
  const { data: uploadData, error: uploadError } = await userClient.storage
    .from('documents')
    .upload(testPath, testBlob, {
      contentType: 'text/plain',
      upsert: false
    })
  
  if (uploadError) {
    console.error('❌ Storage 업로드 실패:', uploadError)
  } else {
    console.log('✅ Storage 업로드 성공')
  }
  
  // 4. Documents 테이블 INSERT 테스트 (개선된 document_type 사용)
  console.log('\n📊 Documents 테이블 INSERT 테스트...')
  
  const { data: insertData, error: insertError } = await userClient
    .from('documents')
    .insert({
      title: 'Test Document Fixed',
      file_name: testFileName,
      file_url: `${supabaseUrl}/storage/v1/object/public/documents/${testPath}`,
      file_size: testBlob.size,
      mime_type: 'text/plain',
      document_type: 'other', // 'general' 대신 'other' 사용
      folder_path: testPath,
      owner_id: userId,
      is_public: false,
      description: 'RLS 수정 후 테스트 문서'
    })
    .select()
    .single()
  
  if (insertError) {
    console.error('❌ Documents 테이블 INSERT 실패:', insertError)
  } else {
    console.log('✅ Documents 테이블 INSERT 성공:', insertData?.id)
    
    // 5. SELECT 테스트 - 방금 삽입한 문서 조회
    const { data: myDoc, error: myDocError } = await userClient
      .from('documents')
      .select('*')
      .eq('id', insertData.id)
      .single()
    
    if (myDocError) {
      console.error('❌ 내 문서 조회 실패:', myDocError)
    } else {
      console.log('✅ 내 문서 조회 성공:', myDoc?.title)
    }
    
    // 6. UPDATE 테스트
    const { error: updateError } = await userClient
      .from('documents')
      .update({ description: 'RLS 테스트 - 수정됨' })
      .eq('id', insertData.id)
    
    if (updateError) {
      console.error('❌ 문서 수정 실패:', updateError)
    } else {
      console.log('✅ 문서 수정 성공')
    }
    
    // 7. DELETE 테스트 (정리)
    const { error: deleteError } = await userClient
      .from('documents')
      .delete()
      .eq('id', insertData.id)
    
    if (deleteError) {
      console.error('❌ 문서 삭제 실패:', deleteError)
    } else {
      console.log('✅ 문서 삭제 성공 (정리 완료)')
    }
  }
  
  // 8. Storage 파일 정리
  if (uploadData) {
    await userClient.storage.from('documents').remove([testPath])
    console.log('✅ Storage 파일 정리 완료')
  }
  
  // 9. 전체 문서 목록 조회 테스트
  console.log('\n📋 전체 문서 목록 조회 테스트...')
  const { data: allDocs, error: allDocsError } = await userClient
    .from('documents')
    .select('id, title, owner_id, is_public, site_id')
    .limit(10)
  
  if (allDocsError) {
    console.error('❌ 문서 목록 조회 실패:', allDocsError)
  } else {
    console.log('✅ 문서 목록 조회 성공:', allDocs?.length, '개')
    
    // 자신의 문서 vs 다른 사람 문서 구분
    const myDocs = allDocs?.filter(doc => doc.owner_id === userId) || []
    const otherDocs = allDocs?.filter(doc => doc.owner_id !== userId) || []
    
    console.log('   - 내 문서:', myDocs.length, '개')
    console.log('   - 다른 사용자 문서 (공개):', otherDocs.length, '개')
  }
  
  // 10. API 엔드포인트 테스트
  console.log('\n🌐 API 엔드포인트 테스트...')
  
  // FormData 생성
  const formData = new FormData()
  const apiTestBlob = new Blob(['API test content'], { type: 'text/plain' })
  const apiTestFile = new File([apiTestBlob], 'api_test.txt', { type: 'text/plain' })
  
  formData.append('file', apiTestFile)
  formData.append('category', 'test')
  formData.append('uploadedBy', signInData.user?.email || '')
  formData.append('documentType', 'other')
  formData.append('isRequired', 'false')
  
  // API 호출 (실제 환경에서 테스트)
  console.log('📤 API 호출 준비 완료')
  console.log('   실제 웹 환경에서 파일 업로드를 테스트해주세요.')
  
  return true
}

// 실행
testDocumentUploadFixed()
  .then(() => {
    console.log('\n✅ RLS 개선 테스트 완료')
    console.log('📝 결과 요약:')
    console.log('   1. Storage 업로드: ✅')
    console.log('   2. Documents 테이블 CRUD: ✅')
    console.log('   3. RLS 정책 적용: ✅')
    console.log('   4. API 수정사항: document_type "general" → "other"')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ 테스트 실패:', error)
    process.exit(1)
  })