#!/usr/bin/env tsx

/**
 * Simple RLS Policy Test Script
 * Tests partner access control by simulating different user contexts
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface TestResult {
  role: string
  email: string
  description: string
  results: {
    sites: number
    profiles: number
    daily_reports: number
    site_assignments: number
  }
}

async function testRLSPolicies() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Get test users we created
  const { data: testUsers } = await supabase
    .from('profiles')
    .select('*')
    .in('email', [
      'system@test.com',
      'admin@test.com',
      'partner@test.com',
      'worker@test.com',
      'sitemanager@test.com',
    ])
    .order('role')

  if (!testUsers || testUsers.length === 0) {
    console.log('❌ 테스트 유저가 없습니다. 먼저 테스트 유저를 생성해주세요.')
    return
  }

  console.log('🧪 RLS 정책 테스트 시작')
  console.log('='.repeat(80))

  const results: TestResult[] = []

  for (const user of testUsers) {
    console.log(`\n📋 테스트: ${user.full_name} (${user.role})`)
    console.log(`   이메일: ${user.email}`)
    console.log(`   시공업체 ID: ${user.partner_company_id || '없음'}`)

    const testResult: TestResult = {
      role: user.role,
      email: user.email,
      description: user.full_name,
      results: {
        sites: 0,
        profiles: 0,
        daily_reports: 0,
        site_assignments: 0,
      },
    }

    try {
      // Test sites access
      console.log('\n   🏗️  Sites 접근 테스트:')
      const { data: sites, error: sitesError } = await supabase
        .from('sites')
        .select('id, name, address, status')

      if (sitesError) {
        console.log('     ❌ Sites 접근 실패:', sitesError.message)
      } else {
        testResult.results.sites = sites?.length || 0
        console.log(`     ✅ 전체 Sites: ${testResult.results.sites}개`)

        // If customer_manager, test partner filtering
        if (user.role === 'customer_manager' && user.partner_company_id) {
          const { data: partnerSites } = await supabase
            .from('sites')
            .select(
              `
              id, name, address, status,
              site_partners!inner(partner_company_id)
            `
            )
            .eq('site_partners.partner_company_id', user.partner_company_id)

          console.log(`     📍 파트너 현장: ${partnerSites?.length || 0}개`)
        }
      }

      // Test profiles access
      console.log('\n   👥 Profiles 접근 테스트:')
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, role, partner_company_id')

      if (profilesError) {
        console.log('     ❌ Profiles 접근 실패:', profilesError.message)
      } else {
        testResult.results.profiles = profiles?.length || 0
        console.log(`     ✅ 전체 Profiles: ${testResult.results.profiles}개`)

        if (user.role === 'customer_manager' && user.partner_company_id) {
          const partnerProfiles =
            profiles?.filter(p => p.partner_company_id === user.partner_company_id) || []
          console.log(`     📍 파트너 직원: ${partnerProfiles.length}개`)
        }
      }

      // Test daily_reports access
      console.log('\n   📄 Daily Reports 접근 테스트:')
      const { data: reports, error: reportsError } = await supabase
        .from('daily_reports')
        .select('id, site_id, created_by, status')
        .limit(100)

      if (reportsError) {
        console.log('     ❌ Daily Reports 접근 실패:', reportsError.message)
      } else {
        testResult.results.daily_reports = reports?.length || 0
        console.log(`     ✅ 전체 Daily Reports: ${testResult.results.daily_reports}개`)
      }

      // Test site_assignments access
      console.log('\n   📌 Site Assignments 접근 테스트:')
      const { data: assignments, error: assignmentsError } = await supabase
        .from('site_assignments')
        .select('id, site_id, user_id, is_active')
        .limit(100)

      if (assignmentsError) {
        console.log('     ❌ Site Assignments 접근 실패:', assignmentsError.message)
      } else {
        testResult.results.site_assignments = assignments?.length || 0
        console.log(`     ✅ 전체 Site Assignments: ${testResult.results.site_assignments}개`)
      }
    } catch (error: any) {
      console.log(`   ❌ 테스트 실패: ${error.message}`)
    }

    results.push(testResult)
    console.log('\n' + '-'.repeat(80))
  }

  // Print summary
  console.log('\n📊 테스트 결과 요약')
  console.log('='.repeat(80))
  console.log('| 역할              | Sites | Profiles | Reports | Assignments |')
  console.log('|-------------------|-------|----------|---------|-------------|')

  results.forEach(result => {
    const role = result.role.padEnd(15)
    const sites = result.results.sites.toString().padStart(5)
    const profiles = result.results.profiles.toString().padStart(8)
    const reports = result.results.daily_reports.toString().padStart(7)
    const assignments = result.results.site_assignments.toString().padStart(11)

    console.log(`| ${role} | ${sites} | ${profiles} | ${reports} | ${assignments} |`)
  })

  console.log('\n✅ RLS 테스트 완료!')

  // Analyze results
  console.log('\n🔍 결과 분석:')
  const adminResult = results.find(r => r.role === 'admin' || r.role === 'system_admin')
  const partnerResult = results.find(r => r.role === 'customer_manager')
  const workerResult = results.find(r => r.role === 'worker')

  if (adminResult && partnerResult && workerResult) {
    console.log(
      `• 관리자는 모든 데이터에 접근 가능: ${adminResult.results.sites > 0 ? '✅' : '❌'}`
    )
    console.log(
      `• 파트너 매니저도 현재는 모든 데이터 접근 가능 (RLS 적용 필요): ${partnerResult.results.sites > 0 ? '⚠️' : '❌'}`
    )
    console.log(`• 작업자도 모든 데이터 접근 가능: ${workerResult.results.sites > 0 ? '✅' : '❌'}`)

    if (partnerResult.results.sites === adminResult.results.sites) {
      console.log(
        '⚠️  customer_manager가 여전히 모든 현장에 접근할 수 있습니다. RLS 정책이 제대로 적용되지 않았을 수 있습니다.'
      )
    }
  }
}

if (require.main === module) {
  testRLSPolicies()
}
