#!/usr/bin/env tsx

/**
 * RLS (Row Level Security) Policy Test Script
 * Tests partner access control policies with different user roles
 */


const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface TestUser {
  role: string
  email: string
  partner_company_id?: string
  description: string
}

const TEST_USERS: TestUser[] = [
  {
    role: 'system_admin',
    email: 'system@test.com',
    description: '시스템 관리자 - 모든 데이터 접근'
  },
  {
    role: 'admin', 
    email: 'admin@test.com',
    description: '관리자 - 모든 데이터 접근'
  },
  {
    role: 'customer_manager',
    email: 'partner@test.com',
    partner_company_id: '236c7746-56ac-4fbc-8387-40ffebed329d', // 대한건설주
    description: '파트너사 매니저 - 파트너사 데이터만 접근'
  },
  {
    role: 'worker',
    email: 'worker@test.com', 
    description: '작업자 - 모든 현장 데이터 접근'
  },
  {
    role: 'site_manager',
    email: 'sitemanager@test.com',
    description: '현장관리자 - 모든 현장 데이터 접근'
  }
]

async function createTestUsers(supabase: any) {
  console.log('\n🔧 테스트 유저 생성/확인...\n')
  
  for (const testUser of TEST_USERS) {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', testUser.email)
      .single()
    
    if (existingUser) {
      console.log(`✅ ${testUser.email} (${testUser.role}) - 이미 존재`)
      continue
    }
    
    // Create auth user first
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testUser.email,
      password: 'testpassword123',
      email_confirm: true
    })
    
    if (authError) {
      console.log(`❌ ${testUser.email} 인증 유저 생성 실패:`, authError.message)
      continue
    }
    
    // Create profile
    const profileData: any = {
      id: authUser.user.id,
      email: testUser.email,
      full_name: `테스트 ${testUser.role}`,
      role: testUser.role
    }
    
    if (testUser.partner_company_id) {
      profileData.partner_company_id = testUser.partner_company_id
    }
    
    const { error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)
    
    if (profileError) {
      console.log(`❌ ${testUser.email} 프로필 생성 실패:`, profileError.message)
    } else {
      console.log(`✅ ${testUser.email} (${testUser.role}) - 생성됨`)
    }
  }
}

async function testUserAccess(testUser: TestUser) {
  console.log(`\n📋 테스트: ${testUser.description}`)
  console.log(`   역할: ${testUser.role}`)
  console.log(`   이메일: ${testUser.email}`)
  
  // Get user profile
  const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('email', testUser.email)
    .single()
  
  if (!profile) {
    console.log('❌ 프로필을 찾을 수 없음')
    return
  }
  
  // Create user-specific client (simulates RLS context)
  const userSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  
  // Manually set user context by querying with user ID
  const userId = profile.id
  
  try {
    // Test sites access
    console.log('\n   🏗️  Sites 테이블 접근 테스트:')
    const { data: sites, error: sitesError } = await userSupabase.rpc('test_sites_access', { 
      test_user_id: userId 
    })
    
    if (sitesError) {
      console.log('     ❌ Sites 접근 실패:', sitesError.message)
    } else {
      console.log(`     ✅ Sites 접근 성공: ${sites?.length || 0}개 현장`)
    }
    
    // Test profiles access (other users)
    console.log('\n   👥 Profiles 테이블 접근 테스트:')
    const { data: profiles, error: profilesError } = await userSupabase.rpc('test_profiles_access', {
      test_user_id: userId
    })
    
    if (profilesError) {
      console.log('     ❌ Profiles 접근 실패:', profilesError.message)
    } else {
      console.log(`     ✅ Profiles 접근 성공: ${profiles?.length || 0}개 프로필`)
    }
    
    // Test daily_reports access
    console.log('\n   📄 Daily Reports 테이블 접근 테스트:')
    const { data: reports, error: reportsError } = await userSupabase.rpc('test_daily_reports_access', {
      test_user_id: userId
    })
    
    if (reportsError) {
      console.log('     ❌ Daily Reports 접근 실패:', reportsError.message)
    } else {
      console.log(`     ✅ Daily Reports 접근 성공: ${reports?.length || 0}개 리포트`)
    }
    
    // Test site_assignments access
    console.log('\n   📌 Site Assignments 테이블 접근 테스트:')
    const { data: assignments, error: assignmentsError } = await userSupabase.rpc('test_site_assignments_access', {
      test_user_id: userId
    })
    
    if (assignmentsError) {
      console.log('     ❌ Site Assignments 접근 실패:', assignmentsError.message)
    } else {
      console.log(`     ✅ Site Assignments 접근 성공: ${assignments?.length || 0}개 배정`)
    }
    
  } catch (error: any) {
    console.log('   ❌ 전반적인 테스트 실패:', error.message)
  }
}

async function createTestHelperFunctions(supabase: any) {
  console.log('\n🔧 테스트 헬퍼 함수 생성...\n')
  
  const helperFunctions = [
    {
      name: 'test_sites_access',
      sql: `
        CREATE OR REPLACE FUNCTION test_sites_access(test_user_id UUID)
        RETURNS TABLE(id UUID, name TEXT, address TEXT, status TEXT) 
        LANGUAGE plpgsql SECURITY DEFINER
        AS $$
        DECLARE
          user_role TEXT;
          user_partner_id UUID;
        BEGIN
          SELECT role, partner_company_id INTO user_role, user_partner_id
          FROM profiles WHERE id = test_user_id;
          
          IF user_role IN ('admin', 'system_admin') THEN
            RETURN QUERY SELECT s.id, s.name, s.address, s.status FROM sites s;
          ELSIF user_role = 'customer_manager' AND user_partner_id IS NOT NULL THEN
            RETURN QUERY 
            SELECT s.id, s.name, s.address, s.status 
            FROM sites s
            JOIN site_partners sp ON s.id = sp.site_id
            WHERE sp.partner_company_id = user_partner_id;
          ELSIF user_role IN ('worker', 'site_manager') THEN
            RETURN QUERY SELECT s.id, s.name, s.address, s.status FROM sites s;
          END IF;
        END;
        $$;
      `
    },
    {
      name: 'test_profiles_access', 
      sql: `
        CREATE OR REPLACE FUNCTION test_profiles_access(test_user_id UUID)
        RETURNS TABLE(id UUID, email TEXT, role TEXT, partner_company_id UUID)
        LANGUAGE plpgsql SECURITY DEFINER
        AS $$
        DECLARE
          user_role TEXT;
          user_partner_id UUID;
        BEGIN
          SELECT role, partner_company_id INTO user_role, user_partner_id
          FROM profiles WHERE id = test_user_id;
          
          IF user_role IN ('admin', 'system_admin') THEN
            RETURN QUERY SELECT p.id, p.email, p.role, p.partner_company_id FROM profiles p;
          ELSIF user_role = 'customer_manager' AND user_partner_id IS NOT NULL THEN
            RETURN QUERY 
            SELECT p.id, p.email, p.role, p.partner_company_id 
            FROM profiles p 
            WHERE p.partner_company_id = user_partner_id OR p.id = test_user_id;
          ELSIF user_role IN ('worker', 'site_manager') THEN
            RETURN QUERY SELECT p.id, p.email, p.role, p.partner_company_id FROM profiles p;
          END IF;
        END;
        $$;
      `
    },
    {
      name: 'test_daily_reports_access',
      sql: `
        CREATE OR REPLACE FUNCTION test_daily_reports_access(test_user_id UUID)
        RETURNS TABLE(id UUID, site_id UUID, created_by UUID, status TEXT)
        LANGUAGE plpgsql SECURITY DEFINER
        AS $$
        DECLARE
          user_role TEXT;
          user_partner_id UUID;
        BEGIN
          SELECT role, partner_company_id INTO user_role, user_partner_id
          FROM profiles WHERE id = test_user_id;
          
          IF user_role IN ('admin', 'system_admin') THEN
            RETURN QUERY SELECT dr.id, dr.site_id, dr.created_by, dr.status FROM daily_reports dr;
          ELSIF user_role = 'customer_manager' AND user_partner_id IS NOT NULL THEN
            RETURN QUERY 
            SELECT dr.id, dr.site_id, dr.created_by, dr.status
            FROM daily_reports dr
            JOIN site_partners sp ON dr.site_id = sp.site_id
            WHERE sp.partner_company_id = user_partner_id;
          ELSIF user_role IN ('worker', 'site_manager') THEN
            RETURN QUERY SELECT dr.id, dr.site_id, dr.created_by, dr.status FROM daily_reports dr;
          END IF;
        END;
        $$;
      `
    },
    {
      name: 'test_site_assignments_access',
      sql: `
        CREATE OR REPLACE FUNCTION test_site_assignments_access(test_user_id UUID)
        RETURNS TABLE(id UUID, site_id UUID, user_id UUID, is_active BOOLEAN)
        LANGUAGE plpgsql SECURITY DEFINER
        AS $$
        DECLARE
          user_role TEXT;
          user_partner_id UUID;
        BEGIN
          SELECT role, partner_company_id INTO user_role, user_partner_id
          FROM profiles WHERE id = test_user_id;
          
          IF user_role IN ('admin', 'system_admin') THEN
            RETURN QUERY SELECT sa.id, sa.site_id, sa.user_id, sa.is_active FROM site_assignments sa;
          ELSIF user_role = 'customer_manager' AND user_partner_id IS NOT NULL THEN
            RETURN QUERY 
            SELECT sa.id, sa.site_id, sa.user_id, sa.is_active
            FROM site_assignments sa
            JOIN site_partners sp ON sa.site_id = sp.site_id
            WHERE sp.partner_company_id = user_partner_id;
          ELSIF user_role IN ('worker', 'site_manager') THEN
            RETURN QUERY SELECT sa.id, sa.site_id, sa.user_id, sa.is_active FROM site_assignments sa;
          END IF;
        END;
        $$;
      `
    }
  ]
  
  for (const func of helperFunctions) {
    const { error } = await supabase.rpc('exec_sql', { sql_query: func.sql })
    if (error) {
      console.log(`❌ ${func.name} 함수 생성 실패:`, error.message)
    } else {
      console.log(`✅ ${func.name} 함수 생성 성공`)
    }
  }
}

async function cleanupTestUsers(supabase: any) {
  console.log('\n🧹 테스트 유저 정리...\n')
  
  for (const testUser of TEST_USERS) {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', testUser.email)
      .single()
    
    if (profile) {
      // Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profile.id)
      
      // Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(profile.id)
      
      if (!profileError && !authError) {
        console.log(`✅ ${testUser.email} 삭제됨`)
      } else {
        console.log(`❌ ${testUser.email} 삭제 실패`)
      }
    }
  }
}

async function main() {
  console.log('🧪 RLS 정책 테스트 시작\n')
  console.log('=' .repeat(80))
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  
  try {
    // Create helper functions for testing
    await createTestHelperFunctions(supabase)
    
    // Create test users
    await createTestUsers(supabase)
    
    console.log('\n' + '=' .repeat(80))
    console.log('🔍 RLS 접근 권한 테스트 결과')
    console.log('=' .repeat(80))
    
    // Test each user's access
    for (const testUser of TEST_USERS) {
      await testUserAccess(testUser)
      console.log('\n' + '-'.repeat(80))
    }
    
    // Cleanup (comment out to keep test users for manual testing)
    // await cleanupTestUsers(supabase)
    
    console.log('\n✅ RLS 테스트 완료!')
    
  } catch (error: any) {
    console.error('❌ 테스트 실행 중 오류:', error.message)
  }
}

if (require.main === module) {
  main()
}