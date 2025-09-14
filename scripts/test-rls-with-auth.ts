#!/usr/bin/env tsx

/**
 * RLS Policy Test Script with Real Authentication
 * Tests partner access control with actual user sessions
 */


const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface TestUser {
  email: string
  password: string
  expected_role: string
  description: string
}

const TEST_USERS: TestUser[] = [
  {
    email: 'system@test.com',
    password: 'testpassword123',
    expected_role: 'system_admin',
    description: '시스템 관리자 - 모든 데이터 접근'
  },
  {
    email: 'admin@test.com', 
    password: 'testpassword123',
    expected_role: 'admin',
    description: '관리자 - 모든 데이터 접근'
  },
  {
    email: 'partner@test.com',
    password: 'testpassword123', 
    expected_role: 'customer_manager',
    description: '파트너사 매니저 - 파트너사 데이터만 접근'
  },
  {
    email: 'worker@test.com',
    password: 'testpassword123',
    expected_role: 'worker',
    description: '작업자 - 모든 현장 데이터 접근'
  },
  {
    email: 'sitemanager@test.com',
    password: 'testpassword123',
    expected_role: 'site_manager', 
    description: '현장관리자 - 모든 현장 데이터 접근'
  }
]

async function testUserWithAuth(testUser: TestUser) {
  console.log(`\n📋 테스트: ${testUser.description}`)
  console.log(`   이메일: ${testUser.email}`)
  console.log(`   예상 역할: ${testUser.expected_role}`)
  
  // Create client with anon key (respects RLS)
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  try {
    // Sign in as test user
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    })
    
    if (signInError) {
      console.log('   ❌ 로그인 실패:', signInError.message)
      return
    }
    
    if (!authData.user) {
      console.log('   ❌ 유저 데이터 없음')
      return
    }
    
    console.log(`   ✅ 로그인 성공: ${authData.user.id}`)
    
    // Get user profile to verify role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()
    
    if (profileError) {
      console.log('   ❌ 프로필 조회 실패:', profileError.message)
      return
    }
    
    console.log(`   📝 실제 역할: ${profile.role}`)
    console.log(`   🏢 파트너사 ID: ${profile.partner_company_id || '없음'}`)
    
    // Test sites access
    console.log('\n   🏗️  Sites 테이블 RLS 테스트:')
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name, address, status')
      
    if (sitesError) {
      console.log('     ❌ Sites 접근 실패:', sitesError.message)
    } else {
      console.log(`     ✅ 접근 가능한 Sites: ${sites?.length || 0}개`)
      if (sites && sites.length > 0) {
        console.log(`     📋 첫 번째 현장: ${sites[0].name}`)
      }
    }
    
    // Test profiles access
    console.log('\n   👥 Profiles 테이블 RLS 테스트:')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, role, partner_company_id')
      
    if (profilesError) {
      console.log('     ❌ Profiles 접근 실패:', profilesError.message)
    } else {
      console.log(`     ✅ 접근 가능한 Profiles: ${profiles?.length || 0}개`)
      
      // Show breakdown by role if admin
      if (profile.role === 'admin' || profile.role === 'system_admin') {
        const roleBreakdown = profiles?.reduce((acc: any, p) => {
          acc[p.role] = (acc[p.role] || 0) + 1
          return acc
        }, {})
        console.log('     📊 역할별 분포:', roleBreakdown)
      }
    }
    
    // Test daily_reports access
    console.log('\n   📄 Daily Reports 테이블 RLS 테스트:')
    const { data: reports, error: reportsError } = await supabase
      .from('daily_reports')
      .select('id, site_id, created_by, status')
      .limit(50)
      
    if (reportsError) {
      console.log('     ❌ Daily Reports 접근 실패:', reportsError.message)
    } else {
      console.log(`     ✅ 접근 가능한 Daily Reports: ${reports?.length || 0}개`)
    }
    
    // Test site_assignments access
    console.log('\n   📌 Site Assignments 테이블 RLS 테스트:')
    const { data: assignments, error: assignmentsError } = await supabase
      .from('site_assignments')
      .select('id, site_id, user_id, is_active')
      .limit(50)
      
    if (assignmentsError) {
      console.log('     ❌ Site Assignments 접근 실패:', assignmentsError.message)
    } else {
      console.log(`     ✅ 접근 가능한 Site Assignments: ${assignments?.length || 0}개`)
    }
    
    // Test site_partners access (should be restricted)
    console.log('\n   🤝 Site Partners 테이블 RLS 테스트:')
    const { data: partnerships, error: partnershipsError } = await supabase
      .from('site_partners')
      .select('id, site_id, partner_company_id')
      .limit(50)
      
    if (partnershipsError) {
      console.log('     ❌ Site Partners 접근 실패:', partnershipsError.message)
    } else {
      console.log(`     ✅ 접근 가능한 Site Partners: ${partnerships?.length || 0}개`)
    }
    
    await supabase.auth.signOut()
    
  } catch (error: any) {
    console.log('   ❌ 테스트 실행 중 오류:', error.message)
  }
}

async function checkHelperFunctions() {
  console.log('🔧 RLS 헬퍼 함수 확인...')
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  
  const functions = ['is_admin_user', 'is_partner_user', 'get_user_partner_company_id', 'get_user_role', 'is_worker', 'is_site_manager']
  
  for (const funcName of functions) {
    try {
      const { data, error } = await supabase.rpc(funcName)
      if (error) {
        console.log(`❌ ${funcName}: ${error.message}`)
      } else {
        console.log(`✅ ${funcName}: 작동 중`)
      }
    } catch (e: any) {
      console.log(`❌ ${funcName}: ${e.message}`)
    }
  }
}

async function main() {
  console.log('🧪 실제 인증을 통한 RLS 정책 테스트')
  console.log('=' .repeat(80))
  
  // Check helper functions first
  await checkHelperFunctions()
  
  console.log('\n' + '=' .repeat(80))
  console.log('🔍 사용자별 RLS 테스트 결과')
  console.log('=' .repeat(80))
  
  // Test each user with real authentication
  for (const testUser of TEST_USERS) {
    await testUserWithAuth(testUser)
    console.log('\n' + '-'.repeat(80))
  }
  
  console.log('\n✅ 실제 인증 RLS 테스트 완료!')
  console.log('\n💡 참고: Service Role Key는 RLS를 우회하므로, 실제 유저 토큰을 사용해야 RLS 정책이 정상 작동합니다.')
}

if (require.main === module) {
  main()
}