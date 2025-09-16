import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabase = createClient(
  'https://yjtnpscnnsnvfsyvajku.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzNzU2NCwiZXhwIjoyMDY5NDEzNTY0fQ.nZ3kiVrU4qAnWQG5vso-qL_FKOkYKlbbZF1a04ew0GE',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function uploadBlueprintToAllSites() {
  console.log('🚀 모든 현장에 공도면 등록 시작...\n')

  try {
    // 1. FlowPlan2.jpg 파일 읽기
    const blueprintPath = '/Users/davidyang/workspace/INOPNC_WM_20250829/dy_memo/FlowPlan2.jpg'

    if (!fs.existsSync(blueprintPath)) {
      console.error('❌ FlowPlan2.jpg 파일을 찾을 수 없습니다:', blueprintPath)
      return
    }

    const fileBuffer = fs.readFileSync(blueprintPath)
    console.log(
      '✅ FlowPlan2.jpg 파일 읽기 완료 (크기:',
      Math.round(fileBuffer.length / 1024),
      'KB)'
    )

    // 2. Supabase Storage에 업로드
    const fileName = `blueprints/FlowPlan2_${Date.now()}.jpg`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, fileBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
      })

    if (uploadError) {
      console.error('❌ Storage 업로드 실패:', uploadError)
      return
    }

    console.log('✅ Storage 업로드 성공:', fileName)

    // Storage URL 생성
    const {
      data: { publicUrl },
    } = supabase.storage.from('documents').getPublicUrl(fileName)

    console.log('📎 공개 URL:', publicUrl)

    // 3. 모든 현장 조회
    const { data: sites, error: siteError } = await supabase
      .from('sites')
      .select('id, name')
      .order('name')

    if (siteError) {
      console.error('❌ 현장 조회 실패:', siteError)
      return
    }

    console.log(`\n📍 총 ${sites?.length}개 현장 발견`)

    // 4. 각 현장에 대한 documents 레코드 생성
    const documentRecords = []
    const blueprintIds = new Map()

    if (sites) {
      for (const site of sites) {
        const docId = crypto.randomUUID()
        blueprintIds.set(site.id, docId)

        documentRecords.push({
          id: docId,
          title: `${site.name} - 기본 공도면`,
          document_type: 'blueprint',
          file_url: publicUrl,
          file_name: 'FlowPlan2.jpg',
          file_size: fileBuffer.length,
          mime_type: 'image/jpeg',
          site_id: site.id,
          is_public: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }

      console.log(`\n📝 documents 테이블에 ${documentRecords.length}개 레코드 생성 중...`)

      // documents 테이블에 일괄 삽입
      const { data: insertedDocs, error: insertError } = await supabase
        .from('documents')
        .insert(documentRecords)
        .select()

      if (insertError) {
        console.error('❌ documents 삽입 실패:', insertError)
        return
      }

      console.log(`✅ ${insertedDocs?.length}개 공도면 레코드 생성 완료`)

      // 5. sites 테이블의 blueprint_document_id 업데이트
      console.log('\n🔄 sites 테이블 업데이트 중...')

      let updateCount = 0
      for (const [siteId, docId] of blueprintIds.entries()) {
        const { error: updateError } = await supabase
          .from('sites')
          .update({ blueprint_document_id: docId })
          .eq('id', siteId)

        if (!updateError) {
          updateCount++
        }
      }

      console.log(`✅ ${updateCount}개 현장의 blueprint_document_id 업데이트 완료`)

      // 6. 결과 확인
      console.log('\n📊 최종 결과 확인...')
      const { data: finalCheck } = await supabase
        .from('sites')
        .select('name, blueprint_document_id')
        .not('blueprint_document_id', 'is', null)
        .limit(5)

      console.log('샘플 현장 공도면 등록 현황:')
      finalCheck?.forEach((site, index) => {
        console.log(`  ${index + 1}. ${site.name}`)
        console.log(`     Blueprint ID: ${site.blueprint_document_id}`)
      })

      console.log('\n🎉 모든 현장에 공도면 등록이 완료되었습니다!')
      console.log('   - Storage Path:', fileName)
      console.log('   - Public URL:', publicUrl)
      console.log('   - 등록된 현장 수:', updateCount)
    }
  } catch (error) {
    console.error('❌ 실행 중 오류 발생:', error)
  }
}

uploadBlueprintToAllSites().catch(console.error)
