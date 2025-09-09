#!/usr/bin/env tsx

/**
 * Document Integration View Test Script
 * Tests the unified document system API and data loading
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface DocumentTestResult {
  category: string
  count: number
  status: 'success' | 'error' | 'empty'
  error?: string
  sampleDocument?: any
}

async function testDocumentIntegrationAPI() {
  console.log('🧪 통합 문서 뷰 API 테스트 시작')
  console.log('=' .repeat(80))
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  // Sign in as admin to test the API
  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'admin@test.com', // Test admin user
    password: 'testpassword123'
  })
  
  if (signInError) {
    console.log('❌ 관리자 로그인 실패:', signInError.message)
    return
  }
  
  console.log('✅ 관리자로 로그인 성공')
  
  try {
    // Test the main API endpoint
    console.log('\n📋 통합 문서 API 엔드포인트 테스트...')
    
    const response = await fetch('http://localhost:3002/api/admin/documents/integrated', {
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      console.log(`❌ API 응답 실패: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.log('Error details:', errorText)
      return
    }
    
    const data = await response.json()
    console.log('✅ API 응답 성공')
    
    // Analyze the response structure
    console.log('\n📊 응답 데이터 구조 분석:')
    console.log(`• 총 문서 수: ${data.statistics?.total_documents || 0}`)
    console.log(`• 카테고리별 분류: ${Object.keys(data.documents_by_category || {}).length}개`)
    console.log(`• 권한 설정: ${data.permissions ? '✅' : '❌'}`)
    console.log(`• 페이징 정보: ${data.pagination ? '✅' : '❌'}`)
    
    // Test each document category
    console.log('\n📁 문서함별 데이터 테스트:')
    console.log('-'.repeat(80))
    
    const categoryConfigs = {
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
    
    const results: DocumentTestResult[] = []
    
    if (data.documents_by_category) {
      // Test each existing category
      for (const [category, documents] of Object.entries(data.documents_by_category)) {
        const docs = documents as any[]
        const categoryName = categoryConfigs[category as keyof typeof categoryConfigs] || category
        
        console.log(`\n📂 ${categoryName} (${category}):`)
        
        if (docs && docs.length > 0) {
          console.log(`   ✅ ${docs.length}개 문서 로딩 성공`)
          
          // Check sample document structure
          const sample = docs[0]
          console.log(`   📄 샘플 문서: "${sample.title || sample.file_name}"`)
          console.log(`   📅 생성일: ${new Date(sample.created_at).toLocaleString('ko-KR')}`)
          console.log(`   👤 업로더: ${sample.uploader?.full_name || sample.profiles?.full_name || '알 수 없음'}`)
          console.log(`   🏗️  현장: ${sample.site?.name || '미지정'}`)
          console.log(`   📁 상태: ${sample.status}`)
          
          // Check required fields
          const hasRequiredFields = sample.id && sample.file_name && sample.created_at
          if (!hasRequiredFields) {
            console.log('   ⚠️  필수 필드 누락 감지')
          }
          
          results.push({
            category: categoryName,
            count: docs.length,
            status: 'success',
            sampleDocument: {
              title: sample.title,
              fileName: sample.file_name,
              status: sample.status,
              uploader: sample.uploader?.full_name || sample.profiles?.full_name,
              siteName: sample.site?.name
            }
          })
        } else {
          console.log(`   📭 문서 없음`)
          results.push({
            category: categoryName,
            count: 0,
            status: 'empty'
          })
        }
      }
      
      // Check for missing categories that should exist
      console.log('\n🔍 누락된 주요 문서함 확인:')
      const mainCategories = ['shared', 'markup', 'required', 'invoice']
      for (const category of mainCategories) {
        if (!data.documents_by_category[category]) {
          const categoryName = categoryConfigs[category as keyof typeof categoryConfigs]
          console.log(`   ❌ ${categoryName} 데이터 없음`)
          results.push({
            category: categoryName,
            count: 0,
            status: 'empty'
          })
        }
      }
    }
    
    // Test statistics accuracy
    console.log('\n📊 통계 정확성 검증:')
    const calculatedTotal = Object.values(data.documents_by_category || {})
      .reduce((sum, docs) => sum + (docs as any[]).length, 0)
    
    console.log(`   계산된 총합: ${calculatedTotal}`)
    console.log(`   API 통계값: ${data.statistics?.total_documents || 0}`)
    
    if (calculatedTotal === data.statistics?.total_documents) {
      console.log('   ✅ 통계값 일치')
    } else {
      console.log('   ⚠️  통계값 불일치')
    }
    
    // Test specific category filters
    console.log('\n🔍 카테고리별 필터링 테스트:')
    for (const category of ['shared', 'markup', 'required']) {
      try {
        const filterResponse = await fetch(`http://localhost:3002/api/admin/documents/integrated?category_type=${category}`, {
          headers: {
            'Authorization': `Bearer ${authData.session.access_token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (filterResponse.ok) {
          const filterData = await filterResponse.json()
          const categoryName = categoryConfigs[category as keyof typeof categoryConfigs]
          console.log(`   ✅ ${categoryName} 필터링: ${filterData.documents?.length || 0}개`)
        } else {
          console.log(`   ❌ ${category} 필터링 실패`)
        }
      } catch (error) {
        console.log(`   ❌ ${category} 필터링 오류:`, error)
      }
    }
    
    // Test search functionality
    console.log('\n🔍 검색 기능 테스트:')
    try {
      const searchResponse = await fetch(`http://localhost:3002/api/admin/documents/integrated?search=test`, {
        headers: {
          'Authorization': `Bearer ${authData.session.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        console.log(`   ✅ 검색 기능: ${searchData.documents?.length || 0}개 결과`)
      } else {
        console.log('   ❌ 검색 기능 실패')
      }
    } catch (error) {
      console.log('   ❌ 검색 기능 오류:', error)
    }
    
    // Generate summary report
    console.log('\n' + '=' .repeat(80))
    console.log('📋 테스트 결과 요약')
    console.log('=' .repeat(80))
    
    console.log('\n📊 문서함별 현황:')
    console.log('| 문서함 | 문서 수 | 상태 |')
    console.log('|--------|--------|------|')
    
    results.forEach(result => {
      const status = result.status === 'success' ? '✅ 정상' : 
                    result.status === 'empty' ? '📭 비어있음' : '❌ 오류'
      const count = result.count.toString().padStart(6)
      console.log(`| ${result.category.padEnd(12)} | ${count} | ${status} |`)
    })
    
    const successCount = results.filter(r => r.status === 'success').length
    const emptyCount = results.filter(r => r.status === 'empty').length
    const errorCount = results.filter(r => r.status === 'error').length
    
    console.log(`\n📈 전체 결과:`)
    console.log(`   • 정상 로딩: ${successCount}개 문서함`)
    console.log(`   • 데이터 없음: ${emptyCount}개 문서함`)
    console.log(`   • 오류 발생: ${errorCount}개 문서함`)
    console.log(`   • 총 문서 수: ${data.statistics?.total_documents || 0}개`)
    
    if (errorCount === 0 && successCount > 0) {
      console.log('\n✅ 전체적으로 문서 통합뷰가 정상 작동하고 있습니다!')
    } else if (errorCount > 0) {
      console.log('\n⚠️  일부 문서함에서 오류가 발생했습니다.')
    } else {
      console.log('\n📭 문서 데이터가 부족할 수 있습니다.')
    }
    
  } catch (error: any) {
    console.log('❌ 테스트 실행 중 오류:', error.message)
  } finally {
    await supabase.auth.signOut()
  }
}

async function testUnifiedDocumentSystemDirectly() {
  console.log('\n🔍 통합 문서 시스템 직접 데이터베이스 테스트')
  console.log('=' .repeat(80))
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  // Test direct database access
  const { data: documents, error } = await supabase
    .from('unified_document_system')
    .select(`
      id,
      title,
      file_name,
      category_type,
      status,
      created_at,
      site_id,
      uploaded_by,
      profiles:uploaded_by(full_name),
      sites:site_id(name)
    `)
    .eq('is_archived', false)
    .limit(10)
  
  if (error) {
    console.log('❌ 직접 데이터베이스 조회 실패:', error.message)
    return
  }
  
  console.log(`✅ 직접 조회 성공: ${documents?.length || 0}개 문서 샘플`)
  
  if (documents && documents.length > 0) {
    const categoryCount = documents.reduce((acc, doc) => {
      acc[doc.category_type] = (acc[doc.category_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    console.log('\n📊 샘플 데이터 카테고리 분포:')
    Object.entries(categoryCount).forEach(([category, count]) => {
      console.log(`   • ${category}: ${count}개`)
    })
    
    console.log('\n📄 첫 번째 문서 상세정보:')
    const firstDoc = documents[0]
    console.log(`   • ID: ${firstDoc.id}`)
    console.log(`   • 제목: ${firstDoc.title || firstDoc.file_name}`)
    console.log(`   • 카테고리: ${firstDoc.category_type}`)
    console.log(`   • 상태: ${firstDoc.status}`)
    console.log(`   • 현장: ${firstDoc.sites?.name || '미지정'}`)
    console.log(`   • 업로더: ${firstDoc.profiles?.full_name || '알 수 없음'}`)
  }
}

async function main() {
  await testUnifiedDocumentSystemDirectly()
  await testDocumentIntegrationAPI()
}

if (require.main === module) {
  main()
}