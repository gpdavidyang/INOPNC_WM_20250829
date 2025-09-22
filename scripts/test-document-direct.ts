#!/usr/bin/env tsx

/**
 * Direct Document Integration Test Script
 * Tests document system directly through Supabase queries
 */


const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface DocumentCategoryStats {
  category: string
  koreanName: string
  count: number
  latestDocument: any
  sites: number
}

async function testDocumentSystemComprehensively() {
  console.log('🧪 통합 문서 시스템 종합 테스트')
  console.log('=' .repeat(80))
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  
  // 1. Test unified_document_system table structure
  console.log('\n📋 1. 통합 문서 시스템 테이블 구조 분석')
  console.log('-'.repeat(80))
  
  // Skip table structure analysis for now
  console.log('테이블 구조 분석 생략 - 직접 데이터 분석으로 진행')
  
  // 2. Get comprehensive document statistics
  console.log('\n📊 2. 문서 통계 분석')
  console.log('-'.repeat(80))
  
  const { data: documents, error: documentsError } = await supabase
    .from('unified_document_system')
    .select(`
      id,
      title,
      file_name,
      category_type,
      sub_category,
      status,
      is_public,
      site_id,
      uploaded_by,
      approved_by,
      created_at,
      updated_at,
      is_archived,
      file_size,
      mime_type,
      tags,
      metadata,
      sites:site_id(id, name, address),
      uploader:uploaded_by(id, full_name, role),
      approver:approved_by(id, full_name, role)
    `)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
  
  if (documentsError) {
    console.log('❌ 문서 데이터 조회 실패:', documentsError.message)
    return
  }
  
  console.log(`✅ 총 ${documents?.length || 0}개 문서 조회 성공`)
  
  // 3. Analyze by category
  console.log('\n📁 3. 카테고리별 문서 분석')
  console.log('-'.repeat(80))
  
  const categoryMap = {
    shared: '공유문서함',
    markup: '도면마킹문서함',
    required: '필수제출서류함',
    invoice: '기성청구문서함',
    certificate: '인증서문서함',
    blueprint: '도면문서함',
    photo_grid: '포토그리드문서함',
    report: '보고서문서함',
    personal: '개인문서함',
    other: '기타문서함'
  }
  
  const categoryStats: Record<string, DocumentCategoryStats> = {}
  
  documents?.forEach(doc => {
    const category = doc.category_type
    if (!categoryStats[category]) {
      categoryStats[category] = {
        category,
        koreanName: categoryMap[category as keyof typeof categoryMap] || category,
        count: 0,
        latestDocument: null,
        sites: new Set()
      }
    }
    
    categoryStats[category].count++
    if (doc.site_id) {
      (categoryStats[category].sites as Set<string>).add(doc.site_id)
    }
    
    if (!categoryStats[category].latestDocument || 
        new Date(doc.created_at) > new Date(categoryStats[category].latestDocument.created_at)) {
      categoryStats[category].latestDocument = doc
    }
  })
  
  // Convert sets to numbers
  Object.values(categoryStats).forEach(stat => {
    stat.sites = (stat.sites as Set<string>).size
  })
  
  // Display results
  console.log('| 카테고리 | 문서수 | 현장수 | 최신문서 | 상태 |')
  console.log('|----------|--------|--------|----------|------|')
  
  const sortedCategories = Object.values(categoryStats).sort((a, b) => b.count - a.count)
  const results: any[] = []
  
  sortedCategories.forEach(stat => {
    const latest = stat.latestDocument
    const latestTitle = latest ? (latest.title || latest.file_name).substring(0, 15) + '...' : '없음'
    const latestDate = latest ? new Date(latest.created_at).toLocaleDateString('ko-KR') : '-'
    const status = stat.count > 0 ? '✅ 정상' : '📭 비어있음'
    
    console.log(`| ${stat.koreanName.padEnd(12)} | ${stat.count.toString().padStart(6)} | ${stat.sites.toString().padStart(6)} | ${latestTitle.padEnd(10)} | ${status} |`)
    
    results.push({
      category: stat.category,
      koreanName: stat.koreanName,
      count: stat.count,
      sites: stat.sites,
      latestDocument: latest ? {
        title: latest.title || latest.file_name,
        date: latestDate,
        uploader: latest.uploader?.full_name,
        site: latest.sites?.name,
        status: latest.status
      } : null,
      status: stat.count > 0 ? 'success' : 'empty'
    })
  })
  
  // 4. Test document status distribution
  console.log('\n📈 4. 문서 상태별 분석')
  console.log('-'.repeat(80))
  
  const statusStats = documents?.reduce((acc, doc) => {
    acc[doc.status] = (acc[doc.status] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}
  
  console.log('문서 상태 분포:')
  Object.entries(statusStats).forEach(([status, count]) => {
    console.log(`  • ${status}: ${count}개`)
  })
  
  // 5. Test site distribution
  console.log('\n🏗️  5. 현장별 문서 분포')
  console.log('-'.repeat(80))
  
  const siteStats = documents?.reduce((acc, doc) => {
    const siteName = doc.sites?.name || '미지정'
    acc[siteName] = (acc[siteName] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}
  
  const topSites = Object.entries(siteStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
  
  console.log('상위 10개 현장 문서 분포:')
  topSites.forEach(([site, count]) => {
    console.log(`  • ${site}: ${count}개`)
  })
  
  // 6. Test sub categories
  console.log('\n📄 6. 하위 카테고리별 분석')
  console.log('-'.repeat(80))
  
  const subCategoryStats = documents?.reduce((acc, doc) => {
    const subCat = doc.sub_category || '미지정'
    acc[subCat] = (acc[subCat] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}
  
  console.log('하위 카테고리 분포:')
  Object.entries(subCategoryStats).forEach(([subCat, count]) => {
    console.log(`  • ${subCat}: ${count}개`)
  })
  
  // 7. Test public settings
  console.log('\n👁️  7. 문서 공개 설정 분석')
  console.log('-'.repeat(80))
  
  const publicStats = documents?.reduce((acc, doc) => {
    const isPublic = doc.is_public ? '공개' : '비공개'
    acc[isPublic] = (acc[isPublic] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}
  
  console.log('공개 설정 분포:')
  Object.entries(publicStats).forEach(([visibility, count]) => {
    console.log(`  • ${visibility}: ${count}개`)
  })
  
  // 8. Test user upload statistics
  console.log('\n👥 8. 사용자별 업로드 통계')
  console.log('-'.repeat(80))
  
  const uploaderStats = documents?.reduce((acc, doc) => {
    const uploader = doc.uploader?.full_name || '알 수 없음'
    acc[uploader] = (acc[uploader] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}
  
  const topUploaders = Object.entries(uploaderStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
  
  console.log('상위 10명 업로드 사용자:')
  topUploaders.forEach(([user, count]) => {
    console.log(`  • ${user}: ${count}개`)
  })
  
  // 9. Test approval statistics
  console.log('\n✅ 9. 문서 승인 통계')
  console.log('-'.repeat(80))
  
  const approvedCount = documents?.filter(doc => doc.approved_by).length || 0
  const pendingCount = documents?.filter(doc => !doc.approved_by && doc.status !== 'draft').length || 0
  const draftCount = documents?.filter(doc => doc.status === 'draft').length || 0
  
  console.log(`승인된 문서: ${approvedCount}개`)
  console.log(`승인 대기: ${pendingCount}개`)  
  console.log(`임시저장: ${draftCount}개`)
  
  // 10. Generate summary report
  console.log('\n' + '=' .repeat(80))
  console.log('📋 종합 테스트 결과 요약')
  console.log('=' .repeat(80))
  
  const totalCategories = results.length
  const activeCategories = results.filter(r => r.status === 'success').length
  const emptyCategories = results.filter(r => r.status === 'empty').length
  const totalDocuments = documents?.length || 0
  const uniqueSites = new Set(documents?.map(d => d.site_id).filter(Boolean)).size
  
  console.log(`📊 전체 현황:`)
  console.log(`  • 총 문서 수: ${totalDocuments}개`)
  console.log(`  • 문서 카테고리: ${totalCategories}개 (활성: ${activeCategories}개, 비활성: ${emptyCategories}개)`)
  console.log(`  • 연관 현장 수: ${uniqueSites}개`)
  console.log(`  • 문서 상태 종류: ${Object.keys(statusStats).length}개`)
  console.log(`  • 하위 카테고리 종류: ${Object.keys(subCategoryStats).length}개`)
  
  console.log(`\n🎯 데이터 품질 평가:`)
  const siteCoverage = (uniqueSites > 0 ? (documents?.filter(d => d.sites?.name).length || 0) / totalDocuments * 100 : 0).toFixed(1)
  const uploaderCoverage = (documents?.filter(d => d.uploader?.full_name).length || 0) / totalDocuments * 100
  const titleCoverage = (documents?.filter(d => d.title && d.title.trim().length > 0).length || 0) / totalDocuments * 100
  
  console.log(`  • 현장 연결률: ${siteCoverage}%`)
  console.log(`  • 업로더 정보 완성도: ${uploaderCoverage.toFixed(1)}%`)
  console.log(`  • 제목 완성도: ${titleCoverage.toFixed(1)}%`)
  
  console.log(`\n🚀 시스템 상태:`)
  if (totalDocuments > 0) {
    console.log('  ✅ 문서 시스템이 활발히 사용되고 있습니다')
    if (activeCategories >= 4) {
      console.log('  ✅ 주요 문서함들이 모두 활성화되어 있습니다')
    } else {
      console.log('  ⚠️  일부 문서함이 비어있을 수 있습니다')
    }
    if (uniqueSites >= 5) {
      console.log('  ✅ 다양한 현장에서 문서가 업로드되고 있습니다')
    }
  } else {
    console.log('  ⚠️  문서 데이터가 부족합니다')
  }
  
  return results
}

async function testDocumentPermissions() {
  console.log('\n🔒 문서 권한 시스템 테스트')
  console.log('=' .repeat(80))
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  
  // Test different public levels
  const { data: publicTest } = await supabase
    .from('unified_document_system')
    .select('is_public, category_type')
    .eq('is_archived', false)
  
  const publicByCategory = publicTest?.reduce((acc, doc) => {
    if (!acc[doc.category_type]) acc[doc.category_type] = {}
    const publicKey = doc.is_public ? '공개' : '비공개'
    acc[doc.category_type][publicKey] = (acc[doc.category_type][publicKey] || 0) + 1
    return acc
  }, {} as Record<string, Record<string, number>>) || {}
  
  console.log('카테고리별 공개 설정:')
  Object.entries(publicByCategory).forEach(([category, visibilities]) => {
    console.log(`\n📁 ${category}:`)
    Object.entries(visibilities).forEach(([visibility, count]) => {
      console.log(`  • ${visibility}: ${count}개`)
    })
  })
}

async function main() {
  const results = await testDocumentSystemComprehensively()
  await testDocumentPermissions()
  
  console.log('\n✅ 통합 문서 시스템 테스트 완료!')
}

if (require.main === module) {
  main()
}