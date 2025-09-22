import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
)

async function uploadBlueprintToAllSites() {
  console.log('🏗️ 모든 현장에 공도면 등록 시작...\n')

  try {
    // 1. FlowPlan2.jpg 파일 읽기
    const imagePath = join(process.cwd(), 'dy_memo/FlowPlan2.jpg')
    console.log('📁 파일 경로:', imagePath)

    let imageBuffer: Buffer
    try {
      imageBuffer = readFileSync(imagePath)
      console.log('✅ 파일 읽기 성공:', imageBuffer.length, 'bytes')
    } catch (fileError) {
      console.error('❌ 파일 읽기 실패:', fileError)
      return
    }

    // 2. Supabase Storage에 업로드
    const fileName = `blueprints/flowplan2-${Date.now()}.jpg`
    console.log('📤 Storage 업로드 중:', fileName)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      })

    if (uploadError) {
      console.error('❌ Storage 업로드 실패:', uploadError.message)
      return
    }

    console.log('✅ Storage 업로드 성공:', uploadData.path)

    // 3. Public URL 생성
    const {
      data: { publicUrl },
    } = supabase.storage.from('documents').getPublicUrl(fileName)

    console.log('🔗 Public URL:', publicUrl)

    // 4. blueprint_document_id가 null인 현장들 조회
    const { data: sitesWithoutBlueprint, error: sitesError } = await supabase
      .from('sites')
      .select('id, name, blueprint_document_id')
      .is('blueprint_document_id', null)

    if (sitesError) {
      console.error('❌ 현장 조회 실패:', sitesError.message)
      return
    }

    console.log('🔍 공도면이 없는 현장:', sitesWithoutBlueprint?.length || 0, '개')

    if (!sitesWithoutBlueprint || sitesWithoutBlueprint.length === 0) {
      console.log('ℹ️  모든 현장에 이미 공도면이 등록되어 있습니다.')
      return
    }

    // 5. 각 현장별로 문서 복사 및 연결
    let successCount = 0
    let errorCount = 0

    for (const site of sitesWithoutBlueprint) {
      try {
        // documents 테이블에 삽입 (sites.blueprint_document_id 외래키용)
        const documentData = {
          title: `${site.name} - 기본 공도면`,
          description: `${site.name} 현장용 기본 공도면`,
          file_url: publicUrl,
          file_name: 'FlowPlan2.jpg',
          file_size: imageBuffer.length,
          mime_type: 'image/jpeg',
          document_type: 'blueprint',
          owner_id: '671496b3-3988-4d94-89dc-9cc6a078c1b0', // 실제 시스템 관리자 ID
          site_id: site.id,
          is_public: true,
        }

        const { data: siteDocument, error: siteDocError } = await supabase
          .from('documents')
          .insert(documentData)
          .select()
          .single()

        if (siteDocError) {
          console.error(`❌ ${site.name} 문서 등록 실패:`, siteDocError.message)
          errorCount++
          continue
        }

        console.log(`✅ ${site.name} 문서 등록 성공, ID:`, siteDocument.id)

        // sites 테이블의 blueprint_document_id 업데이트
        const { error: updateError } = await supabase
          .from('sites')
          .update({ blueprint_document_id: siteDocument.id })
          .eq('id', site.id)

        if (updateError) {
          console.error(`❌ ${site.name} sites 업데이트 실패:`, updateError.message)
          errorCount++
        } else {
          console.log(`✅ ${site.name} 공도면 등록 완료`)
          successCount++
        }
      } catch (error) {
        console.error(`❌ ${site.name} 처리 실패:`, error)
        errorCount++
      }
    }

    console.log('\n🎯 작업 완료 결과:')
    console.log('   성공:', successCount, '개 현장')
    console.log('   실패:', errorCount, '개 현장')
    console.log('   총 처리:', sitesWithoutBlueprint.length, '개 현장')

    if (successCount > 0) {
      console.log('\n✅ 공도면 등록이 완료되었습니다!')
      console.log('   이제 DrawingCard에서 모든 현장의 공도면을 확인할 수 있습니다.')
    }
  } catch (error) {
    console.error('❌ 전체 프로세스 실패:', error)
  }
}

uploadBlueprintToAllSites().catch(console.error)
