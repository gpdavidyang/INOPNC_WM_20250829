import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://yjtnpscnnsnvfsyvajku.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzNzU2NCwiZXhwIjoyMDY5NDEzNTY0fQ.nZ3kiVrU4qAnWQG5vso-qL_FKOkYKlbbZF1a04ew0GE',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function insertBlueprintDirectly() {
  console.log('🚀 모든 현장에 공도면 직접 등록 시작...\n')

  try {
    // 1. 공도면 URL (이미 업로드된 샘플 이미지 사용)
    const blueprintUrl = 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2000'

    // 2. 모든 현장 조회
    const { data: sites, error: siteError } = await supabase
      .from('sites')
      .select('id, name, blueprint_document_id')
      .order('name')

    if (siteError) {
      console.error('❌ 현장 조회 실패:', siteError)
      return
    }

    console.log(`📍 총 ${sites?.length}개 현장 발견`)

    // 3. 각 현장에 대한 처리
    let successCount = 0
    let updateCount = 0

    if (sites) {
      for (const site of sites) {
        // 이미 blueprint_document_id가 있는 경우 건너뛰기
        if (site.blueprint_document_id) {
          console.log(`⏭️  ${site.name} - 이미 공도면이 등록되어 있음`)
          continue
        }

        const docId = crypto.randomUUID()

        // documents 테이블에 레코드 삽입
        const { error: insertError } = await supabase.from('documents').insert({
          id: docId,
          title: `${site.name} - 기본 공도면`,
          document_type: 'blueprint',
          file_url: blueprintUrl,
          file_name: 'FlowPlan2.jpg',
          file_size: 34816,
          mime_type: 'image/jpeg',
          site_id: site.id,
          is_public: true,
        })

        if (insertError) {
          console.error(`❌ ${site.name} - documents 삽입 실패:`, insertError.message)
          continue
        }

        successCount++

        // sites 테이블 업데이트
        const { error: updateError } = await supabase
          .from('sites')
          .update({ blueprint_document_id: docId })
          .eq('id', site.id)

        if (updateError) {
          console.error(`❌ ${site.name} - sites 업데이트 실패:`, updateError.message)
        } else {
          updateCount++
          console.log(`✅ ${site.name} - 공도면 등록 완료`)
        }
      }

      console.log('\n' + '='.repeat(60))
      console.log('📊 최종 결과:')
      console.log('='.repeat(60))
      console.log(`• 전체 현장: ${sites.length}개`)
      console.log(`• documents 생성: ${successCount}개`)
      console.log(`• sites 업데이트: ${updateCount}개`)

      // 4. 결과 확인
      console.log('\n📋 등록된 공도면 샘플 확인...')
      const { data: verification } = await supabase
        .from('sites')
        .select(
          `
          name,
          blueprint_document_id,
          documents!sites_blueprint_document_id_fkey(
            title,
            file_url
          )
        `
        )
        .not('blueprint_document_id', 'is', null)
        .limit(5)

      verification?.forEach((site, index) => {
        console.log(`\n${index + 1}. ${site.name}`)
        console.log(`   Document ID: ${site.blueprint_document_id}`)
        if (site.documents) {
          console.log(`   제목: ${site.documents.title}`)
          console.log(`   URL: ${site.documents.file_url?.substring(0, 50)}...`)
        }
      })

      console.log('\n🎉 모든 현장에 공도면 등록이 완료되었습니다!')
    }
  } catch (error) {
    console.error('❌ 실행 중 오류 발생:', error)
  }
}

insertBlueprintDirectly().catch(console.error)
