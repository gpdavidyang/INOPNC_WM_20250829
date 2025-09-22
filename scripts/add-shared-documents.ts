#!/usr/bin/env tsx

import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface Site {
  id: string
  name: string
  address: string
}

async function main() {
  console.log('📄 공유 문서 추가 스크립트 시작...\n')

  try {
    // 모든 활성 현장 조회
    console.log('🏢 현장 목록 조회 중...')
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name, address')
      .eq('status', 'active')
      .order('name')

    if (sitesError) {
      throw new Error(`현장 조회 실패: ${sitesError.message}`)
    }

    console.log(`✅ ${sites?.length}개 현장 조회 완료`)
    sites?.forEach((site, index) => {
      console.log(`   ${index + 1}. ${site.name} (${site.address})`)
    })
    console.log()

    // PDF 파일 경로
    const pdfDir = '/Users/davidyang/workspace/INOPNC_WM_20250829/dy_memo/DY_INOPNC/공유문서함'
    const pdfFiles = [
      '공유문서함1.pdf',
      '공유문서함2.pdf', 
      '공유문서함3.pdf',
      '공도면.pdf',
      'PTW작업허가서.pdf'
    ]

    // 관리자 ID 조회 (첫 번째 admin 사용자)
    console.log('👤 관리자 계정 조회 중...')
    const { data: adminUser, error: adminError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'admin')
      .limit(1)
      .single()

    if (adminError || !adminUser) {
      throw new Error('관리자 계정을 찾을 수 없습니다.')
    }

    console.log(`✅ 관리자: ${adminUser.full_name} (${adminUser.id})\n`)

    // 각 PDF 파일을 각 현장에 대해 공유 문서로 추가
    let totalInserted = 0

    for (const fileName of pdfFiles) {
      const filePath = path.join(pdfDir, fileName)
      
      // 파일 존재 확인
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  파일을 찾을 수 없습니다: ${fileName}`)
        continue
      }

      // 파일 정보
      const stats = fs.statSync(filePath)
      const fileSize = stats.size

      console.log(`📄 ${fileName} 처리 중... (크기: ${(fileSize / 1024).toFixed(2)} KB)`)

      for (const site of sites || []) {
        // 더미 파일 URL 생성 (실제로는 파일 업로드 서비스를 사용해야 함)
        const fileUrl = `https://storage.googleapis.com/shared-docs/${fileName.replace(' ', '_')}`
        
        // 문서 제목 생성
        const documentTitle = `${fileName.replace('.pdf', '')} - ${site.name}`
        
        const documentData = {
          title: documentTitle,
          description: `${site.name}에서 사용할 수 있는 공유 문서입니다.`,
          file_name: fileName,
          file_url: fileUrl,
          file_size: fileSize,
          mime_type: 'application/pdf',
          category_type: 'shared',
          sub_category: 'general',
          uploaded_by: adminUser.id,
          site_id: site.id,
          status: 'active',
          is_public: true,
          is_archived: false,
          approval_required: false,
          approved_by: adminUser.id,
          approved_at: new Date().toISOString(),
          tags: ['공유문서', '일반', site.name],
          metadata: {
            source: 'script_import',
            original_path: filePath,
            site_name: site.name,
            site_address: site.address,
            file_path: `/shared/${fileName}`,
            folder_path: '/shared'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        // 데이터베이스에 삽입
        const { data: insertedDoc, error: insertError } = await supabase
          .from('unified_document_system')
          .insert(documentData)
          .select('id, title')
          .single()

        if (insertError) {
          console.log(`   ❌ ${site.name}: ${insertError.message}`)
        } else {
          console.log(`   ✅ ${site.name}: ${insertedDoc?.title}`)
          totalInserted++
        }
      }

      console.log()
    }

    console.log(`🎉 완료! 총 ${totalInserted}개 문서가 추가되었습니다.`)
    
    // 통계 조회
    console.log('\n📊 현재 공유 문서 통계:')
    const { data: stats, error: statsError } = await supabase
      .from('unified_document_system')
      .select('category_type')
      .eq('category_type', 'shared')
      .eq('is_archived', false)

    if (!statsError && stats) {
      console.log(`   공유문서함: ${stats.length}개`)
    }

  } catch (error) {
    console.error('❌ 에러 발생:', error)
    process.exit(1)
  }
}

main().catch(console.error)