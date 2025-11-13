import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

function loadEnv() {
  // Minimal .env loader (no external deps)
  const candidates = ['.env.local', '.env.development.local', '.env.development', '.env']
  for (const file of candidates) {
    const p = path.join(process.cwd(), file)
    if (fs.existsSync(p)) {
      try {
        const content = fs.readFileSync(p, 'utf8')
        for (const line of content.split(/\r?\n/)) {
          const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
          if (!m) continue
          const key = m[1]
          let val = m[2]
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
          if (!(key in process.env)) process.env[key] = val
        }
      } catch {
        // ignore parse errors
      }
    }
  }
}

async function main() {
  loadEnv()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE

  if (!url || !serviceKey) {
    console.error('❌ Missing Supabase env (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)')
    process.exit(1)
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('🧪 현장공유함(도면 등) 데이터/매핑 테스트 시작')

  // 1) site_documents 내 도면 데이터 존재 여부
  let allDocs: any[] | null = null
  let usedTable: 'site_documents' | 'documents' = 'site_documents'
  try {
    const res = await admin
      .from('site_documents')
      .select('id, site_id, document_type, file_name', { count: 'exact' })
      .in('document_type', ['blueprint', 'progress_drawing'])
      .limit(1000)
    if (res.error) throw res.error
    allDocs = res.data
  } catch (e: any) {
    // Fallback to legacy documents table
    console.warn('⚠️ site_documents 사용 불가. documents 테이블로 폴백합니다:', e?.message)
    usedTable = 'documents'
    const res2 = await admin
      .from('documents')
      .select('id, site_id, document_type, file_name', { count: 'exact' })
      .in('document_type', ['blueprint', 'progress_drawing'])
      .limit(1000)
    if (res2.error) {
      console.error('❌ documents 폴백 조회 실패:', res2.error.message)
      process.exit(1)
    }
    allDocs = res2.data
  }

  const totalDocs = allDocs?.length || 0
  console.log(`📄 (${usedTable}) 도면문서 총 개수(표본 최대 1000): ${totalDocs}`)

  if (totalDocs === 0) {
    console.log('⚠️ site_documents에 도면 데이터가 없습니다.')
    return
  }

  // 2) 도면이 존재하는 site 목록 집계
  const sitesWithDocs = new Map<string, number>()
  for (const d of allDocs || []) {
    const cnt = sitesWithDocs.get(d.site_id) || 0
    sitesWithDocs.set(d.site_id, cnt + 1)
  }
  const siteIds = Array.from(sitesWithDocs.keys())

  // 3) 해당 site들에 대해 partner_site_mappings 활성 매핑 확인
  const { data: mappings, error: mapErr } = await admin
    .from('partner_site_mappings')
    .select('partner_company_id, site_id, is_active')
    .in('site_id', siteIds)
    .eq('is_active', true)
    .limit(5000)

  if (mapErr) {
    console.error('❌ partner_site_mappings 조회 실패:', mapErr.message)
    process.exit(1)
  }

  if (!mappings || mappings.length === 0) {
    console.log('⚠️ 도면이 있는 현장에 대해 활성 파트너 매핑이 없습니다.')
  } else {
    console.log(`🔗 활성 매핑 수: ${mappings.length}`)
  }

  // 4) 매핑 + 도면이 동시에 있는 샘플 3건 출력
  const samples: Array<{ partner_company_id: string; site_id: string; docCount: number }> = []
  for (const m of mappings || []) {
    const c = sitesWithDocs.get(m.site_id) || 0
    if (c > 0)
      samples.push({ partner_company_id: m.partner_company_id, site_id: m.site_id, docCount: c })
  }

  samples.sort((a, b) => b.docCount - a.docCount)
  const top = samples.slice(0, 3)
  if (top.length === 0) {
    console.log('⚠️ 활성 매핑과 도면이 동시에 존재하는 조합이 없습니다.')
  } else {
    console.log('✅ 파트너-현장-도면 샘플(상위 3건):')
    for (const s of top) {
      console.log(
        `   - partner_company_id=${s.partner_company_id}, site_id=${s.site_id}, 도면수=${s.docCount}`
      )
    }

    // 5) 첫 샘플로 실제 도면 목록 5개 미리보기
    const pick = top[0]
    const { data: preview, error: prevErr } =
      usedTable === 'site_documents'
        ? await admin
            .from('site_documents')
            .select('id, file_name, document_type, created_at')
            .eq('site_id', pick.site_id)
            .in('document_type', ['blueprint', 'progress_drawing'])
            .order('created_at', { ascending: false })
            .limit(5)
        : await admin
            .from('documents')
            .select('id, file_name, document_type, created_at')
            .eq('site_id', pick.site_id)
            .in('document_type', ['blueprint', 'progress_drawing'])
            .order('created_at', { ascending: false })
            .limit(5)

    if (prevErr) {
      console.log('⚠️ 샘플 도면 미리보기 실패:', prevErr.message)
    } else {
      console.log('🖼️ 샘플 도면 5개:')
      for (const d of preview || []) {
        console.log(`   • ${d.document_type} | ${d.file_name}`)
      }
    }

    console.log('\n👉 UI 검증 가이드:')
    console.log('   1) 파트너 계정으로 로그인')
    console.log('   2) 현장공유함(도면 등) 탭에서 현장을 위 site_id로 선택')
    if (usedTable === 'documents') {
      console.log(
        '      ※ 현재 DB에 site_documents 테이블이 없어, 구(legacy) documents에서만 도면이 있습니다.'
      )
      console.log(
        '      ▶ 앱은 site_documents를 조회하므로, 마이그레이션 전까지는 목록이 비어 보일 수 있습니다.'
      )
    }
    console.log('   3) 목록이 보이면 매핑/데이터 정상')
  }
}

main().catch(err => {
  console.error('❌ 테스트 스크립트 오류:', err)
  process.exit(1)
})
