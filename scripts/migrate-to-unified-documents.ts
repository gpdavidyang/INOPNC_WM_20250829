#!/usr/bin/env npx tsx

/**
 * 기존 문서 테이블들을 통합 문서 시스템으로 마이그레이션
 * 
 * 마이그레이션 대상:
 * - markup_documents -> unified_documents
 * - photo_grid_reports -> unified_documents  
 * - shared_documents -> unified_documents
 * 
 * 실행 방법:
 * NEXT_PUBLIC_SUPABASE_URL="your-url" SUPABASE_SERVICE_ROLE_KEY="your-key" npx tsx scripts/migrate-to-unified-documents.ts
 */


// 환경 변수 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수를 설정해주세요:')
  console.error('NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Supabase 클라이언트 생성 (Service Role)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// 마이그레이션 통계
let stats = {
  markup_documents: { total: 0, migrated: 0, failed: 0 },
  photo_grid_reports: { total: 0, migrated: 0, failed: 0 },
  shared_documents: { total: 0, migrated: 0, failed: 0 },
  total_time: 0
}

// 1. markup_documents 마이그레이션
async function migrateMarkupDocuments() {
  console.log('\n📄 markup_documents 마이그레이션 시작...')
  
  try {
    // 기존 데이터 조회
    const { data: documents, error } = await supabase
      .from('markup_documents')
      .select('*')
      .eq('is_deleted', false)
    
    if (error) {
      console.error('❌ markup_documents 조회 실패:', error)
      return
    }
    
    if (!documents || documents.length === 0) {
      console.log('ℹ️ 마이그레이션할 markup_documents가 없습니다.')
      return
    }
    
    stats.markup_documents.total = documents.length
    console.log(`📊 총 ${documents.length}개 문서 발견`)
    
    // 각 문서 마이그레이션
    for (const doc of documents) {
      try {
        // 중복 확인
        const { data: existing } = await supabase
          .from('unified_documents')
          .select('id')
          .eq('original_table', 'markup_documents')
          .eq('original_id', doc.id)
          .single()
        
        if (existing) {
          console.log(`⏭️ 이미 마이그레이션됨: ${doc.title}`)
          stats.markup_documents.migrated++
          continue
        }
        
        // 통합 문서 형식으로 변환
        const unifiedDoc = {
          title: doc.title,
          description: doc.description,
          file_name: doc.original_blueprint_filename,
          file_url: doc.original_blueprint_url,
          file_size: doc.file_size,
          mime_type: 'image/png', // 도면은 대부분 이미지
          category_type: 'markup',
          document_type: 'markup',
          site_id: doc.site_id,
          uploaded_by: doc.created_by,
          status: 'active',
          workflow_status: 'approved', // 기존 문서는 승인된 것으로 간주
          is_public: doc.location === 'shared',
          is_archived: false,
          access_level: doc.location === 'shared' ? 'public' : 'private',
          metadata: {
            preview_image_url: doc.preview_image_url,
            markup_count: doc.markup_count
          },
          markup_data: doc.markup_data,
          original_table: 'markup_documents',
          original_id: doc.id,
          created_at: doc.created_at,
          updated_at: doc.updated_at
        }
        
        // 통합 테이블에 삽입
        const { error: insertError } = await supabase
          .from('unified_documents')
          .insert(unifiedDoc)
        
        if (insertError) {
          console.error(`❌ 마이그레이션 실패 (${doc.title}):`, insertError)
          stats.markup_documents.failed++
        } else {
          console.log(`✅ 마이그레이션 성공: ${doc.title}`)
          stats.markup_documents.migrated++
        }
        
      } catch (err) {
        console.error(`❌ 문서 처리 중 오류 (${doc.title}):`, err)
        stats.markup_documents.failed++
      }
    }
    
  } catch (err) {
    console.error('❌ markup_documents 마이그레이션 중 오류:', err)
  }
}

// 2. photo_grid_reports 마이그레이션
async function migratePhotoGridReports() {
  console.log('\n📸 photo_grid_reports 마이그레이션 시작...')
  
  try {
    // 기존 데이터 조회
    const { data: reports, error } = await supabase
      .from('photo_grid_reports')
      .select('*')
    
    if (error) {
      console.error('❌ photo_grid_reports 조회 실패:', error)
      return
    }
    
    if (!reports || reports.length === 0) {
      console.log('ℹ️ 마이그레이션할 photo_grid_reports가 없습니다.')
      return
    }
    
    stats.photo_grid_reports.total = reports.length
    console.log(`📊 총 ${reports.length}개 리포트 발견`)
    
    // 각 리포트 마이그레이션
    for (const report of reports) {
      try {
        // 중복 확인
        const { data: existing } = await supabase
          .from('unified_documents')
          .select('id')
          .eq('original_table', 'photo_grid_reports')
          .eq('original_id', report.id)
          .single()
        
        if (existing) {
          console.log(`⏭️ 이미 마이그레이션됨: ${report.file_name}`)
          stats.photo_grid_reports.migrated++
          continue
        }
        
        // 통합 문서 형식으로 변환
        const unifiedDoc = {
          title: report.file_name || '사진대지 리포트',
          description: `${report.component_name || ''} - ${report.work_process || ''}`,
          file_name: report.file_name,
          file_url: report.file_url,
          file_size: report.file_size,
          mime_type: 'application/pdf', // 사진대지는 주로 PDF
          category_type: 'photo_grid',
          document_type: 'report',
          site_id: report.site_id,
          daily_report_id: report.daily_report_id,
          uploaded_by: report.created_by,
          status: 'active',
          workflow_status: 'approved',
          is_public: false,
          is_archived: false,
          access_level: 'role',
          photo_metadata: {
            before_photo_url: report.before_photo_url,
            after_photo_url: report.after_photo_url,
            component_name: report.component_name,
            work_process: report.work_process,
            work_section: report.work_section,
            work_date: report.work_date
          },
          original_table: 'photo_grid_reports',
          original_id: report.id,
          created_at: report.created_at,
          updated_at: report.updated_at
        }
        
        // 통합 테이블에 삽입
        const { error: insertError } = await supabase
          .from('unified_documents')
          .insert(unifiedDoc)
        
        if (insertError) {
          console.error(`❌ 마이그레이션 실패 (${report.file_name}):`, insertError)
          stats.photo_grid_reports.failed++
        } else {
          console.log(`✅ 마이그레이션 성공: ${report.file_name}`)
          stats.photo_grid_reports.migrated++
        }
        
      } catch (err) {
        console.error(`❌ 리포트 처리 중 오류 (${report.file_name}):`, err)
        stats.photo_grid_reports.failed++
      }
    }
    
  } catch (err) {
    console.error('❌ photo_grid_reports 마이그레이션 중 오류:', err)
  }
}

// 3. shared_documents 마이그레이션
async function migrateSharedDocuments() {
  console.log('\n📁 shared_documents 마이그레이션 시작...')
  
  try {
    // 기존 데이터 조회
    const { data: documents, error } = await supabase
      .from('shared_documents')
      .select('*')
    
    if (error) {
      console.error('❌ shared_documents 조회 실패:', error)
      return
    }
    
    if (!documents || documents.length === 0) {
      console.log('ℹ️ 마이그레이션할 shared_documents가 없습니다.')
      return
    }
    
    stats.shared_documents.total = documents.length
    console.log(`📊 총 ${documents.length}개 문서 발견`)
    
    // 각 문서 마이그레이션
    for (const doc of documents) {
      try {
        // 중복 확인
        const { data: existing } = await supabase
          .from('unified_documents')
          .select('id')
          .eq('original_table', 'shared_documents')
          .eq('original_id', doc.id)
          .single()
        
        if (existing) {
          console.log(`⏭️ 이미 마이그레이션됨: ${doc.title}`)
          stats.shared_documents.migrated++
          continue
        }
        
        // 카테고리 결정
        let category = 'shared'
        if (doc.document_type?.includes('required')) {
          category = 'required'
        } else if (doc.document_type?.includes('invoice')) {
          category = 'invoice'
        }
        
        // 통합 문서 형식으로 변환
        const unifiedDoc = {
          title: doc.title,
          description: doc.description,
          file_name: doc.file_name,
          file_url: doc.file_url,
          file_size: doc.file_size,
          mime_type: doc.mime_type || 'application/octet-stream',
          category_type: category,
          document_type: doc.document_type || 'document',
          sub_category: doc.sub_category,
          site_id: doc.site_id,
          customer_company_id: doc.customer_company_id,
          daily_report_id: doc.daily_report_id,
          uploaded_by: doc.uploaded_by,
          status: doc.status || 'active',
          workflow_status: doc.approved_at ? 'approved' : 'pending',
          is_public: doc.is_public || false,
          is_archived: doc.is_archived || false,
          access_level: doc.is_public ? 'public' : 'role',
          approval_required: doc.approval_required,
          approved_by: doc.approved_by,
          approved_at: doc.approved_at,
          tags: doc.tags,
          metadata: doc.metadata,
          original_table: 'shared_documents',
          original_id: doc.id,
          created_at: doc.created_at,
          updated_at: doc.updated_at
        }
        
        // 통합 테이블에 삽입
        const { error: insertError } = await supabase
          .from('unified_documents')
          .insert(unifiedDoc)
        
        if (insertError) {
          console.error(`❌ 마이그레이션 실패 (${doc.title}):`, insertError)
          stats.shared_documents.failed++
        } else {
          console.log(`✅ 마이그레이션 성공: ${doc.title}`)
          stats.shared_documents.migrated++
        }
        
      } catch (err) {
        console.error(`❌ 문서 처리 중 오류 (${doc.title}):`, err)
        stats.shared_documents.failed++
      }
    }
    
  } catch (err) {
    console.error('❌ shared_documents 마이그레이션 중 오류:', err)
  }
}

// 4. 마이그레이션 검증
async function validateMigration() {
  console.log('\n🔍 마이그레이션 검증 중...')
  
  try {
    // 통합 문서 수 확인
    const { count: totalCount } = await supabase
      .from('unified_documents')
      .select('*', { count: 'exact', head: true })
    
    // 원본 테이블별 수 확인
    const { data: byTable } = await supabase
      .from('unified_documents')
      .select('original_table')
      .not('original_table', 'is', null)
    
    const tableCount = byTable?.reduce((acc: any, doc: any) => {
      acc[doc.original_table] = (acc[doc.original_table] || 0) + 1
      return acc
    }, {}) || {}
    
    console.log('\n📊 마이그레이션 결과:')
    console.log(`총 통합 문서 수: ${totalCount}`)
    console.log('원본 테이블별 분포:')
    Object.entries(tableCount).forEach(([table, count]) => {
      console.log(`  - ${table}: ${count}개`)
    })
    
  } catch (err) {
    console.error('❌ 검증 중 오류:', err)
  }
}

// 메인 실행 함수
async function main() {
  console.log('🚀 통합 문서 시스템 마이그레이션 시작')
  console.log('=====================================')
  
  const startTime = Date.now()
  
  try {
    // 순차적으로 마이그레이션 실행
    await migrateMarkupDocuments()
    await migratePhotoGridReports()
    await migrateSharedDocuments()
    
    // 검증
    await validateMigration()
    
    // 최종 통계
    const endTime = Date.now()
    stats.total_time = (endTime - startTime) / 1000
    
    console.log('\n=====================================')
    console.log('📈 최종 마이그레이션 통계:')
    console.log('=====================================')
    
    console.log('\n📄 markup_documents:')
    console.log(`  총 ${stats.markup_documents.total}개`)
    console.log(`  ✅ 성공: ${stats.markup_documents.migrated}개`)
    console.log(`  ❌ 실패: ${stats.markup_documents.failed}개`)
    
    console.log('\n📸 photo_grid_reports:')
    console.log(`  총 ${stats.photo_grid_reports.total}개`)
    console.log(`  ✅ 성공: ${stats.photo_grid_reports.migrated}개`)
    console.log(`  ❌ 실패: ${stats.photo_grid_reports.failed}개`)
    
    console.log('\n📁 shared_documents:')
    console.log(`  총 ${stats.shared_documents.total}개`)
    console.log(`  ✅ 성공: ${stats.shared_documents.migrated}개`)
    console.log(`  ❌ 실패: ${stats.shared_documents.failed}개`)
    
    const totalDocuments = stats.markup_documents.total + stats.photo_grid_reports.total + stats.shared_documents.total
    const totalMigrated = stats.markup_documents.migrated + stats.photo_grid_reports.migrated + stats.shared_documents.migrated
    const totalFailed = stats.markup_documents.failed + stats.photo_grid_reports.failed + stats.shared_documents.failed
    
    console.log('\n📊 전체 요약:')
    console.log(`  총 문서: ${totalDocuments}개`)
    console.log(`  마이그레이션 성공: ${totalMigrated}개 (${((totalMigrated/totalDocuments)*100).toFixed(1)}%)`)
    console.log(`  마이그레이션 실패: ${totalFailed}개`)
    console.log(`  소요 시간: ${stats.total_time.toFixed(2)}초`)
    
    if (totalFailed > 0) {
      console.log('\n⚠️ 일부 문서의 마이그레이션이 실패했습니다.')
      console.log('로그를 확인하고 필요시 재실행하세요.')
      process.exit(1)
    } else {
      console.log('\n✅ 모든 문서가 성공적으로 마이그레이션되었습니다!')
    }
    
  } catch (err) {
    console.error('\n❌ 마이그레이션 중 치명적 오류:', err)
    process.exit(1)
  }
}

// 스크립트 실행
main().catch(console.error)