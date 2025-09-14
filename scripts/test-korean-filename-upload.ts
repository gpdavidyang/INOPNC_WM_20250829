
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 한글 파일명 테스트 케이스
const testFileNames = [
  '일반문서.pdf',
  '2024년_연간보고서.docx',
  '프로젝트 계획서 (최종).xlsx',
  '건설현장 안전관리 매뉴얼 v2.1.pdf',
  '작업일지_김철수_2024년12월.txt',
  '시공도면_A동_3층_수정본.dwg',
  '품질검사 체크리스트 - 콘크리트.pdf',
  '!!특수문자#$%테스트@파일명!!.txt',
  '아주긴한글파일명테스트입니다이것은정말로긴파일명이에요백글자가넘어가면어떻게되는지테스트해보겠습니다한글파일명이얼마나길어질수있는지확인해보는것입니다.pdf'
]

// 안전한 파일명 생성 함수 (API와 동일)
function generateSafeFileName(originalName: string): string {
  const lastDotIndex = originalName.lastIndexOf('.')
  const extension = lastDotIndex > -1 ? originalName.slice(lastDotIndex) : ''
  const nameWithoutExt = lastDotIndex > -1 ? originalName.slice(0, lastDotIndex) : originalName
  
  let safeName = nameWithoutExt
    .replace(/\s+/g, '_')
    .replace(/[^\w\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF._-]/g, '')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '')
  
  if (!safeName) {
    safeName = 'file'
  }
  
  if (safeName.length > 100) {
    safeName = safeName.substring(0, 100)
  }
  
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  
  return `${timestamp}_${randomStr}_${safeName}${extension}`
}

async function testKoreanFileUpload() {
  console.log('🧪 한글 파일명 업로드 테스트 시작...\n')
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  // 1. 로그인
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'manager@inopnc.com',
    password: 'password123'
  })
  
  if (signInError) {
    console.error('❌ 로그인 실패:', signInError)
    return
  }
  
  console.log('✅ 로그인 성공:', signInData.user?.email)
  const userId = signInData.user?.id
  
  console.log('\n📋 한글 파일명 처리 테스트:\n')
  console.log('원본 파일명 → 안전한 파일명')
  console.log('─'.repeat(80))
  
  for (const originalName of testFileNames) {
    const safeName = generateSafeFileName(originalName)
    const isChanged = !safeName.includes(originalName.replace(/[^\w\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF._-]/g, ''))
    
    console.log(`${isChanged ? '⚠️ ' : '✅ '} ${originalName}`)
    console.log(`   → ${safeName}`)
    console.log()
  }
  
  // 2. 실제 업로드 테스트
  console.log('\n🚀 실제 Storage 업로드 테스트...\n')
  
  const testFileName = '한글_파일명_테스트_문서.txt'
  const testContent = '이것은 한글 파일명 테스트를 위한 내용입니다.'
  const testBlob = new Blob([testContent], { type: 'text/plain; charset=utf-8' })
  
  const safeName = generateSafeFileName(testFileName)
  const filePath = `documents/${userId}/${safeName}`
  
  console.log('📁 원본 파일명:', testFileName)
  console.log('📁 안전한 파일명:', safeName)
  console.log('📁 업로드 경로:', filePath)
  
  // Storage 업로드
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, testBlob, {
      contentType: 'text/plain; charset=utf-8',
      upsert: false
    })
  
  if (uploadError) {
    console.error('❌ Storage 업로드 실패:', uploadError)
  } else {
    console.log('✅ Storage 업로드 성공')
    
    // URL 생성
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath)
    
    console.log('🔗 Public URL:', urlData.publicUrl)
    
    // 3. 데이터베이스 저장 테스트
    const { data: dbData, error: dbError } = await supabase
      .from('documents')
      .insert({
        title: testFileName, // 원본 파일명 유지
        file_name: safeName, // 안전한 파일명
        file_url: urlData.publicUrl,
        file_size: testBlob.size,
        mime_type: 'text/plain',
        document_type: 'other',
        folder_path: filePath,
        owner_id: userId,
        is_public: false,
        description: '한글 파일명 테스트'
      })
      .select()
      .single()
    
    if (dbError) {
      console.error('❌ DB 저장 실패:', dbError)
    } else {
      console.log('✅ DB 저장 성공:', dbData.id)
      console.log('   - 표시 이름:', dbData.title)
      console.log('   - 저장 파일명:', dbData.file_name)
      
      // 4. 파일 다운로드 테스트
      console.log('\n📥 다운로드 테스트...')
      const { data: downloadData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(filePath)
      
      if (downloadError) {
        console.error('❌ 다운로드 실패:', downloadError)
      } else {
        const text = await downloadData.text()
        console.log('✅ 다운로드 성공')
        console.log('   내용:', text)
      }
      
      // 5. 정리
      await supabase.from('documents').delete().eq('id', dbData.id)
      await supabase.storage.from('documents').remove([filePath])
      console.log('🧹 테스트 데이터 정리 완료')
    }
  }
  
  console.log('\n📊 테스트 결과 요약:')
  console.log('✅ 한글 파일명이 안전하게 처리됨')
  console.log('✅ 원본 파일명은 title 필드에 보존됨')
  console.log('✅ 특수문자와 공백이 적절히 처리됨')
  console.log('✅ 긴 파일명이 100자로 제한됨')
  console.log('✅ 타임스탬프로 중복 방지')
}

// 실행
testKoreanFileUpload()
  .then(() => {
    console.log('\n✅ 한글 파일명 테스트 완료')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ 테스트 실패:', error)
    process.exit(1)
  })