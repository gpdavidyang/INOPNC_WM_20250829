import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function testDocumentUploadRLS() {
  console.log('🧪 문서 업로드 RLS 테스트 시작...\n')
  
  // 1. Service Role로 현장관리자 계정 확인
  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  
  // 현장관리자 찾기
  const { data: siteManager } = await adminClient
    .from('profiles')
    .select('*')
    .eq('role', 'site_manager')
    .limit(1)
    .single()
  
  if (!siteManager) {
    console.log('❌ 현장관리자 계정이 없습니다. 테스트 계정을 생성합니다.')
    
    // 테스트 계정 생성
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: 'sitemanager-test@inopnc.com',
      password: 'test123456',
      email_confirm: true
    })
    
    if (authError) {
      console.error('❌ 테스트 계정 생성 실패:', authError)
      return
    }
    
    // 프로필 업데이트
    await adminClient
      .from('profiles')
      .update({
        full_name: '테스트 현장관리자',
        role: 'site_manager',
        phone: '010-1234-5678'
      })
      .eq('id', authData.user.id)
    
    console.log('✅ 테스트 현장관리자 계정 생성됨')
  } else {
    console.log('✅ 현장관리자 찾음:', siteManager.full_name, '-', siteManager.email)
  }
  
  // 2. 현장관리자로 로그인
  const userClient = createClient(supabaseUrl, supabaseAnonKey)
  
  const { data: signInData, error: signInError } = await userClient.auth.signInWithPassword({
    email: siteManager?.email || 'sitemanager-test@inopnc.com',
    password: 'test123456' // 실제 환경에서는 적절한 비밀번호 사용
  })
  
  if (signInError) {
    console.error('❌ 로그인 실패:', signInError.message)
    console.log('💡 다른 현장관리자 계정으로 시도합니다...')
    
    // manager@inopnc.com으로 시도
    const { data: managerSignIn, error: managerError } = await userClient.auth.signInWithPassword({
      email: 'manager@inopnc.com',
      password: 'password123'
    })
    
    if (managerError) {
      console.error('❌ manager@inopnc.com 로그인도 실패:', managerError)
      return
    }
    
    console.log('✅ manager@inopnc.com으로 로그인 성공')
  } else {
    console.log('✅ 로그인 성공:', signInData.user?.email)
  }
  
  // 3. 현재 사용자 확인
  const { data: { user } } = await userClient.auth.getUser()
  console.log('👤 현재 사용자 ID:', user?.id)
  
  // 4. Storage 버킷 접근 테스트
  console.log('\n📦 Storage 버킷 접근 테스트...')
  
  // 테스트 파일 생성
  const testContent = 'Test document content for RLS testing'
  const testBlob = new Blob([testContent], { type: 'text/plain' })
  const testFileName = `test_${Date.now()}.txt`
  const testPath = `documents/${user?.id}/${testFileName}`
  
  console.log('📁 업로드 경로:', testPath)
  
  // 업로드 시도
  const { data: uploadData, error: uploadError } = await userClient.storage
    .from('documents')
    .upload(testPath, testBlob, {
      contentType: 'text/plain',
      upsert: false
    })
  
  if (uploadError) {
    console.error('❌ Storage 업로드 실패:', {
      message: uploadError.message,
      status: uploadError.statusCode,
      error: uploadError
    })
    
    // Storage 정책 확인
    console.log('\n🔍 Storage 버킷 정책 확인...')
    const { data: buckets } = await adminClient.storage.listBuckets()
    const docBucket = buckets?.find(b => b.name === 'documents')
    console.log('📦 documents 버킷 설정:', {
      id: docBucket?.id,
      name: docBucket?.name,
      public: docBucket?.public
    })
  } else {
    console.log('✅ Storage 업로드 성공:', uploadData)
    
    // 업로드된 파일 삭제 (정리)
    await userClient.storage.from('documents').remove([testPath])
  }
  
  // 5. Documents 테이블 접근 테스트
  console.log('\n📊 Documents 테이블 접근 테스트...')
  
  // INSERT 테스트
  const { data: insertData, error: insertError } = await userClient
    .from('documents')
    .insert({
      title: 'Test Document',
      file_name: testFileName,
      file_url: `${supabaseUrl}/storage/v1/object/public/documents/${testPath}`,
      file_size: testBlob.size,
      mime_type: 'text/plain',
      document_type: 'general',
      folder_path: testPath,
      owner_id: user?.id,
      is_public: false,
      description: 'RLS 테스트 문서'
    })
    .select()
    .single()
  
  if (insertError) {
    console.error('❌ Documents 테이블 INSERT 실패:', {
      message: insertError.message,
      code: insertError.code,
      details: insertError.details,
      hint: insertError.hint
    })
  } else {
    console.log('✅ Documents 테이블 INSERT 성공:', insertData?.id)
    
    // 삽입한 데이터 삭제 (정리)
    if (insertData?.id) {
      await userClient.from('documents').delete().eq('id', insertData.id)
    }
  }
  
  // 6. SELECT 테스트
  const { data: selectData, error: selectError } = await userClient
    .from('documents')
    .select('*')
    .limit(5)
  
  if (selectError) {
    console.error('❌ Documents 테이블 SELECT 실패:', selectError)
  } else {
    console.log('✅ Documents 테이블 SELECT 성공:', selectData?.length, '개 문서 조회')
  }
  
  // 7. RLS 정책 분석
  console.log('\n📋 RLS 정책 분석 결과:')
  console.log('1. documents 테이블:')
  console.log('   - owner_id = auth.uid() OR')
  console.log('   - (is_public = true AND site_id IN user_sites)')
  console.log('   → 현장관리자는 자신의 문서 또는 할당된 사이트의 공개 문서만 접근 가능')
  
  console.log('\n2. Storage documents 버킷:')
  console.log('   - public = true로 설정되어 있음')
  console.log('   - RLS 정책이 없어 모든 인증된 사용자가 업로드 가능해야 함')
  
  // 8. 해결 방안 제시
  console.log('\n🔧 문제 해결 방안:')
  console.log('1. Storage 버킷 RLS 정책 추가 필요')
  console.log('2. documents 테이블 INSERT 권한 확인 필요')
  console.log('3. API 레벨에서 에러 처리 개선 필요')
  
  return true
}

// 실행
testDocumentUploadRLS()
  .then(() => {
    console.log('\n✅ 테스트 완료')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ 테스트 실패:', error)
    process.exit(1)
  })