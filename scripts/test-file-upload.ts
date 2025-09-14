
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function testFileUpload() {
  console.log('🧪 파일 업로드 시스템 테스트')
  console.log('=' .repeat(60))
  
  try {
    // 1. Storage bucket 확인
    console.log('\n1️⃣ Storage Bucket 확인')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Bucket 조회 실패:', bucketsError)
    } else {
      const documentsBucket = buckets?.find(b => b.name === 'documents')
      if (documentsBucket) {
        console.log('✅ documents bucket 존재:', {
          name: documentsBucket.name,
          public: documentsBucket.public,
          created_at: documentsBucket.created_at
        })
      } else {
        console.log('❌ documents bucket이 없습니다')
      }
    }
    
    // 2. 테스트 파일 업로드
    console.log('\n2️⃣ 테스트 파일 업로드')
    const testFileName = `test-${Date.now()}.txt`
    const testFilePath = `test/${testFileName}`
    const testContent = Buffer.from('Test file content for upload verification')
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(testFilePath, testContent, {
        contentType: 'text/plain',
        upsert: false
      })
    
    if (uploadError) {
      console.error('❌ 파일 업로드 실패:', uploadError)
    } else {
      console.log('✅ 파일 업로드 성공:', uploadData)
      
      // 3. Public URL 확인
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(testFilePath)
      
      console.log('📎 Public URL:', urlData.publicUrl)
      
      // 4. 파일 삭제 (정리)
      const { error: deleteError } = await supabase.storage
        .from('documents')
        .remove([testFilePath])
      
      if (deleteError) {
        console.error('⚠️ 테스트 파일 삭제 실패:', deleteError)
      } else {
        console.log('🗑️ 테스트 파일 삭제 완료')
      }
    }
    
    // 3. documents 테이블 확인
    console.log('\n3️⃣ Documents 테이블 확인')
    const { data: recentDocs, error: docsError } = await supabase
      .from('documents')
      .select('id, title, file_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (docsError) {
      console.error('❌ Documents 테이블 조회 실패:', docsError)
    } else {
      console.log(`✅ 최근 문서 ${recentDocs?.length || 0}개:`)
      recentDocs?.forEach(doc => {
        console.log(`   - ${doc.title} (${doc.created_at})`)
      })
    }
    
    // 4. RLS 정책 확인
    console.log('\n4️⃣ RLS 정책 확인')
    const { data: policies, error: policiesError } = await supabase.rpc('get_storage_policies', {
      bucket_name: 'documents'
    }).single()
    
    if (!policiesError && policies) {
      console.log('✅ Storage RLS 정책 활성화됨')
    } else {
      console.log('⚠️ Storage RLS 정책 확인 필요')
    }
    
    console.log('\n' + '=' .repeat(60))
    console.log('✅ 파일 업로드 시스템 테스트 완료')
    console.log('=' .repeat(60))
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error)
  }
}

testFileUpload().catch(console.error)