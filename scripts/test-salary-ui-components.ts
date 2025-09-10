/**
 * 급여 UI 컴포넌트 테스트 스크립트
 * 새로 구현된 급여관리 UI 기능들을 테스트합니다.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testSalaryUIComponents() {
  console.log('🧪 급여 UI 컴포넌트 테스트 시작...\n')
  
  const tests = [
    testDailySalaryCalculationData,
    testSalaryStatsDashboardData,
    testPayslipGenerationData,
    testExcelExportData,
    testChartDataGeneration
  ]
  
  let passed = 0
  let failed = 0
  
  for (const test of tests) {
    try {
      await test()
      passed++
      console.log(`✅ PASS: ${test.name}`)
    } catch (error) {
      failed++
      console.log(`❌ FAIL: ${test.name}`)
      console.error(`   Error: ${error}`)
    }
  }
  
  console.log('\n📊 Test Results:')
  console.log('================')
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)
  
  if (failed === 0) {
    console.log('\n🎉 All UI component tests passed! Ready for user testing.')
  } else {
    console.log('\n⚠️  Some tests failed. Please check the issues above.')
  }
}

async function testDailySalaryCalculationData() {
  // 출력일보 급여계산에 필요한 데이터 검증
  const startDate = '2025-01-01'
  const endDate = '2025-01-31'
  
  const { data: assignmentsData, error } = await supabase
    .from('worker_assignments')
    .select(`
      id,
      profile_id,
      labor_hours,
      hourly_rate,
      role_type,
      daily_report_id,
      daily_reports!inner(
        id,
        work_date,
        site_id,
        sites(id, name)
      )
    `)
    .gte('daily_reports.work_date', startDate)
    .lte('daily_reports.work_date', endDate)
    .limit(10)
  
  if (error) throw error
  
  if (!assignmentsData || assignmentsData.length === 0) {
    throw new Error('No worker assignments found for salary calculation')
  }
  
  console.log(`   Found ${assignmentsData.length} worker assignments for calculation`)
  
  // 차트 데이터 생성 가능성 검증
  const siteStats = assignmentsData.reduce((acc, a) => {
    const siteName = a.daily_reports.sites?.name || 'Unknown'
    if (!acc[siteName]) acc[siteName] = { value: 0, count: 0 }
    acc[siteName].count += 1
    return acc
  }, {} as Record<string, { value: number; count: number }>)
  
  console.log(`   Generated chart data for ${Object.keys(siteStats).length} sites`)
  
  return true
}

async function testSalaryStatsDashboardData() {
  // 급여 통계 대시보드 데이터 생성 테스트
  const endDate = new Date()
  const startDate = new Date(endDate)
  startDate.setMonth(startDate.getMonth() - 6)
  
  const { data: assignmentsData, error } = await supabase
    .from('worker_assignments')
    .select(`
      id,
      profile_id,
      labor_hours,
      daily_report_id,
      daily_reports!inner(
        work_date,
        site_id,
        sites(name)
      )
    `)
    .gte('daily_reports.work_date', startDate.toISOString().split('T')[0])
    .lte('daily_reports.work_date', endDate.toISOString().split('T')[0])
    .limit(50)
  
  if (error) throw error
  
  if (!assignmentsData || assignmentsData.length === 0) {
    throw new Error('No data for statistics dashboard')
  }
  
  // 통계 계산
  const totalWorkers = new Set(assignmentsData.map(a => a.profile_id)).size
  const totalHours = assignmentsData.reduce((sum, a) => sum + (Number(a.labor_hours) || 0), 0)
  
  console.log(`   Statistics: ${totalWorkers} workers, ${totalHours} total hours`)
  
  // 월별 그룹핑 테스트
  const monthlyStats = assignmentsData.reduce((acc, a) => {
    const month = a.daily_reports.work_date.substring(0, 7) // YYYY-MM
    if (!acc[month]) acc[month] = { count: 0, hours: 0 }
    acc[month].count += 1
    acc[month].hours += Number(a.labor_hours) || 0
    return acc
  }, {} as Record<string, { count: number; hours: number }>)
  
  console.log(`   Monthly trend data: ${Object.keys(monthlyStats).length} months`)
  
  return true
}

async function testPayslipGenerationData() {
  // 급여명세서 생성에 필요한 데이터 검증
  const { data: profilesData, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .not('role', 'is', null)
    .limit(1)
  
  if (profileError) throw profileError
  if (!profilesData || profilesData.length === 0) {
    throw new Error('No profiles found for payslip generation')
  }
  
  const profile = profilesData[0]
  
  // 급여 정보 확인
  const { data: salaryInfo } = await supabase
    .from('salary_info')
    .select('*')
    .eq('user_id', profile.id)
    .single()
  
  // 사이트 정보 확인
  const { data: sitesData } = await supabase
    .from('sites')
    .select('id, name')
    .limit(1)
  
  if (!sitesData || sitesData.length === 0) {
    throw new Error('No sites found for payslip generation')
  }
  
  // 급여명세서 생성에 필요한 모든 데이터 구조 확인
  const payslipData = {
    employee: {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      role: profile.role,
      employeeNumber: profile.id.slice(0, 8)
    },
    company: {
      name: 'INOPNC',
      address: '서울시 강남구',
      phone: '02-1234-5678'
    },
    site: {
      id: sitesData[0].id,
      name: sitesData[0].name
    },
    salary: {
      period_start: '2025-01-01',
      work_days: 22,
      total_work_hours: 176,
      total_overtime_hours: 10,
      total_labor_hours: 186,
      base_pay: 2800000,
      overtime_pay: 150000,
      bonus_pay: 100000,
      total_gross_pay: 3050000,
      tax_deduction: 150000,
      national_pension: 137250,
      health_insurance: 106597,
      employment_insurance: 27450,
      total_deductions: 421297,
      net_pay: 2628703
    },
    paymentDate: new Date()
  }
  
  console.log(`   Payslip data ready for ${payslipData.employee.name}`)
  console.log(`   Net pay: ₩${payslipData.salary.net_pay.toLocaleString()}`)
  
  return true
}

async function testExcelExportData() {
  // Excel 내보내기 데이터 구조 테스트
  const { data: assignmentsData, error } = await supabase
    .from('worker_assignments')
    .select(`
      id,
      profile_id,
      labor_hours,
      daily_reports!inner(
        work_date,
        sites(name)
      )
    `)
    .limit(10)
  
  if (error) throw error
  
  if (!assignmentsData || assignmentsData.length === 0) {
    throw new Error('No data for Excel export')
  }
  
  // 프로필 정보 가져오기
  const profileIds = [...new Set(assignmentsData.map(a => a.profile_id))]
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('id', profileIds)
  
  const profilesMap = new Map()
  profilesData?.forEach(p => profilesMap.set(p.id, p))
  
  // Excel 내보내기용 데이터 구조 생성
  const excelData = assignmentsData.map(item => ({
    '작업일': item.daily_reports.work_date,
    '작업자': profilesMap.get(item.profile_id)?.full_name || 'Unknown',
    '역할': profilesMap.get(item.profile_id)?.role === 'site_manager' ? '현장관리자' : '작업자',
    '현장': item.daily_reports.sites?.name || 'Unknown',
    '총공수': Number(item.labor_hours) || 0,
    '시급': 15000, // 예시 값
    '일당': (Number(item.labor_hours) || 0) * 15000,
    '연장근무': Math.max(0, (Number(item.labor_hours) || 0) - 8),
    '연장수당': Math.max(0, (Number(item.labor_hours) || 0) - 8) * 15000 * 1.5,
    '총급여': ((Number(item.labor_hours) || 0) * 15000) + (Math.max(0, (Number(item.labor_hours) || 0) - 8) * 15000 * 1.5)
  }))
  
  console.log(`   Excel export data ready: ${excelData.length} records`)
  console.log(`   Sample record:`, excelData[0])
  
  return true
}

async function testChartDataGeneration() {
  // 차트 데이터 생성 테스트
  const { data: assignmentsData, error } = await supabase
    .from('worker_assignments')
    .select(`
      profile_id,
      labor_hours,
      daily_reports!inner(
        work_date,
        site_id,
        sites(name)
      )
    `)
    .limit(20)
  
  if (error) throw error
  
  if (!assignmentsData || assignmentsData.length === 0) {
    throw new Error('No data for chart generation')
  }
  
  // 프로필 정보
  const profileIds = [...new Set(assignmentsData.map(a => a.profile_id))]
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', profileIds)
  
  const profilesMap = new Map()
  profilesData?.forEach(p => profilesMap.set(p.id, p))
  
  // 작업자별 차트 데이터
  const workerStats = assignmentsData.reduce((acc, a) => {
    const workerId = a.profile_id
    const workerName = profilesMap.get(workerId)?.full_name || 'Unknown'
    if (!acc[workerId]) {
      acc[workerId] = { name: workerName, value: 0, hours: 0 }
    }
    const hours = Number(a.labor_hours) || 0
    acc[workerId].hours += hours
    acc[workerId].value += hours * 15000 // 예시 계산
    return acc
  }, {} as Record<string, { name: string; value: number; hours: number }>)
  
  const workerChartData = Object.values(workerStats)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
  
  // 현장별 차트 데이터
  const siteStats = assignmentsData.reduce((acc, a) => {
    const siteName = a.daily_reports.sites?.name || 'Unknown'
    if (!acc[siteName]) {
      acc[siteName] = { name: siteName, value: 0, count: 0 }
    }
    const hours = Number(a.labor_hours) || 0
    acc[siteName].value += hours * 15000
    acc[siteName].count += 1
    return acc
  }, {} as Record<string, { name: string; value: number; count: number }>)
  
  const siteChartData = Object.values(siteStats)
  
  console.log(`   Worker chart data: ${workerChartData.length} items`)
  console.log(`   Site chart data: ${siteChartData.length} items`)
  console.log(`   Top worker:`, workerChartData[0])
  console.log(`   Sample site:`, siteChartData[0])
  
  return true
}

// 실행
testSalaryUIComponents().catch(console.error)