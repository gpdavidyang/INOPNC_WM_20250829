import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
)

async function registerBlueprint() {
  console.log('📐 FlowPlan2.jpg를 공도면으로 등록합니다...\n')

  try {
    // 1. 파일 읽기
    const filePath = path.join(process.cwd(), 'dy_memo', 'FlowPlan2.jpg')
    console.log('1️⃣ 파일 읽기:', filePath)

    if (!fs.existsSync(filePath)) {
      console.error('❌ 파일을 찾을 수 없습니다:', filePath)
      return
    }

    const fileBuffer = fs.readFileSync(filePath)
    const fileName = `blueprints/${Date.now()}_FlowPlan2.jpg`

    // 2. Supabase Storage에 업로드
    console.log('2️⃣ Supabase Storage에 업로드 중...')
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (uploadError) {
      console.error('❌ 업로드 실패:', uploadError.message)
      return
    }

    console.log('✅ 업로드 성공:', fileName)

    // 3. Storage URL 생성
    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName)

    const fileUrl = urlData.publicUrl
    console.log('✅ 파일 URL:', fileUrl)

    // 4. 삼성전자 평택캠퍼스 P3 현장 정보 가져오기
    const siteId = '7160ea44-b7f6-43d1-a4a2-a3905d5da9d2'
    const { data: site } = await supabase.from('sites').select('name').eq('id', siteId).single()

    console.log('\n3️⃣ 현장 정보:', site?.name || 'Unknown')

    // 5. documents 테이블에 등록
    console.log('4️⃣ documents 테이블에 등록 중...')

    const documentId = 'e4f8f2bd-b043-46c4-a76c-3ef86ab11fa8' // 기존 blueprint_document_id

    // 먼저 기존 문서가 있는지 확인
    const { data: existingDoc } = await supabase
      .from('documents')
      .select('id')
      .eq('id', documentId)
      .single()

    if (existingDoc) {
      // 기존 문서 업데이트
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          title: '삼성전자 평택캠퍼스 P3 - 기본 공도면',
          description: 'FlowPlan2 공도면',
          file_url: fileUrl,
          file_name: 'FlowPlan2.jpg',
          file_size: fileBuffer.length,
          mime_type: 'image/jpeg',
          document_type: 'blueprint',
          site_id: siteId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId)

      if (updateError) {
        console.error('❌ 문서 업데이트 실패:', updateError.message)
        return
      }

      console.log('✅ 기존 문서 업데이트 완료')
    } else {
      // 새 문서 생성
      const { error: insertError } = await supabase.from('documents').insert({
        id: documentId,
        title: '삼성전자 평택캠퍼스 P3 - 기본 공도면',
        description: 'FlowPlan2 공도면',
        file_url: fileUrl,
        file_name: 'FlowPlan2.jpg',
        file_size: fileBuffer.length,
        mime_type: 'image/jpeg',
        document_type: 'blueprint',
        site_id: siteId,
        owner_id: '37f8784f-2b37-4552-921e-fa2cbd51e925', // manager@inopnc.com의 ID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (insertError) {
        console.error('❌ 문서 생성 실패:', insertError.message)
        return
      }

      console.log('✅ 새 문서 생성 완료')
    }

    // 6. 결과 확인
    console.log('\n5️⃣ 등록 결과 확인...')
    const { data: registeredDoc } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (registeredDoc) {
      console.log('✅ 공도면 등록 성공!')
      console.log('   ID:', registeredDoc.id)
      console.log('   제목:', registeredDoc.title)
      console.log('   타입:', registeredDoc.document_type)
      console.log('   현장 ID:', registeredDoc.site_id)
      console.log('   파일 URL:', registeredDoc.file_url?.substring(0, 60) + '...')
    }

    console.log('\n🎉 FlowPlan2.jpg가 성공적으로 공도면으로 등록되었습니다!')
    console.log('📱 이제 모바일 앱에서 삼성전자 평택캠퍼스 P3 현장을 선택하면')
    console.log('   자동으로 공도면이 로드되고 "마킹 시작" 버튼이 활성화됩니다.')
  } catch (error) {
    console.error('❌ 오류 발생:', error)
  }
}

registerBlueprint().catch(console.error)
