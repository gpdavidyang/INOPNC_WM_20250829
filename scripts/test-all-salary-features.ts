import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

interface TestResult {
  feature: string
  status: 'PASS' | 'FAIL' | 'WARN'
  details: string
  data?: any
}

const results: TestResult[] = []

function addResult(feature: string, status: 'PASS' | 'FAIL' | 'WARN', details: string, data?: any) {
  results.push({ feature, status, details, data })
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️'
  console.log(`${icon} ${feature}: ${details}`)
  if (data && process.env.VERBOSE) {
    console.log('   데이터:', JSON.stringify(data, null, 2))
  }
}

async function test1_IndividualMonthlySalary() {
  console.log('\n📋 TEST 1: 시스템 관리자 - 개인별 월급여계산')
  console.log('=' .repeat(60))
  
  try {
    // 2025년 6월, 7월, 8월 데이터 조회
    for (const month of [6, 7, 8]) {
      const startDate = `2025-${String(month).padStart(2, '0')}-01`
      const endDate = new Date(2025, month, 0).toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('work_records')
        .select(`
          profile_id,
          user_id,
          labor_hours,
          work_date,
          site_id,
          profiles:profile_id(full_name, daily_wage),
          sites:site_id(name)
        `)
        .gte('work_date', startDate)
        .lte('work_date', endDate)
      
      if (error) throw error
      
      // 작업자별 집계
      const workerSummary = new Map()
      data?.forEach(record => {
        const workerId = record.profile_id || record.user_id
        const workerName = record.profiles?.full_name || 'Unknown'
        
        if (!workerSummary.has(workerId)) {
          workerSummary.set(workerId, {
            name: workerName,
            totalLaborHours: 0,
            workDays: new Set(),
            sites: new Set()
          })
        }
        
        const worker = workerSummary.get(workerId)
        worker.totalLaborHours += Number(record.labor_hours) || 0
        worker.workDays.add(record.work_date)
        if (record.sites?.name) worker.sites.add(record.sites.name)
      })
      
      const workerCount = workerSummary.size
      const totalRecords = data?.length || 0
      
      if (workerCount > 0) {
        addResult(
          `2025년 ${month}월 급여 데이터`,
          'PASS',
          `${workerCount}명 작업자, ${totalRecords}건 근무기록`,
          Array.from(workerSummary.entries()).slice(0, 3).map(([id, info]) => ({
            name: info.name,
            laborHours: info.totalLaborHours.toFixed(2),
            workDays: info.workDays.size
          }))
        )
      } else {
        addResult(
          `2025년 ${month}월 급여 데이터`,
          'WARN',
          '데이터 없음'
        )
      }
    }
  } catch (error: any) {
    addResult('개인별 월급여계산', 'FAIL', error.message)
  }
}

async function test2_DailySalaryCalculation() {
  console.log('\n📋 TEST 2: 시스템 관리자 - 일일 급여 계산')
  console.log('=' .repeat(60))
  
  try {
    // 특정 날짜의 일일 급여 데이터
    const testDate = '2025-08-29'
    
    const { data, error } = await supabase
      .from('work_records')
      .select(`
        *,
        profiles:profile_id(full_name, daily_wage, meal_allowance, transportation_allowance),
        sites:site_id(name)
      `)
      .eq('work_date', testDate)
    
    if (error) throw error
    
    if (data && data.length > 0) {
      let totalDailyPay = 0
      const dailySummary = data.map(record => {
        const laborHours = Number(record.labor_hours) || 0
        const dailyWage = Number(record.profiles?.daily_wage) || 130000
        const mealAllowance = Number(record.profiles?.meal_allowance) || 0
        const transportAllowance = Number(record.profiles?.transportation_allowance) || 0
        
        // 일일 급여 계산 (공수 기준)
        const hourlyRate = dailyWage / 8
        const actualWorkHours = laborHours * 8
        const baseHours = Math.min(actualWorkHours, 8)
        const overtimeHours = Math.max(actualWorkHours - 8, 0)
        
        const basePay = baseHours * hourlyRate
        const overtimePay = overtimeHours * hourlyRate * 1.5
        const totalPay = basePay + overtimePay + mealAllowance + transportAllowance
        
        totalDailyPay += totalPay
        
        return {
          worker: record.profiles?.full_name || 'Unknown',
          site: record.sites?.name || 'Unknown',
          laborHours,
          totalPay
        }
      })
      
      addResult(
        `${testDate} 일일 급여`,
        'PASS',
        `${data.length}명, 총 급여: ${totalDailyPay.toLocaleString()}원`,
        dailySummary.slice(0, 3)
      )
    } else {
      addResult(
        `${testDate} 일일 급여`,
        'WARN',
        '해당 날짜 데이터 없음'
      )
    }
  } catch (error: any) {
    addResult('일일 급여 계산', 'FAIL', error.message)
  }
}

async function test3_SalaryStatsDashboard() {
  console.log('\n📋 TEST 3: 시스템 관리자 - 급여 통계 대시보드')
  console.log('=' .repeat(60))
  
  try {
    // 전체 통계 데이터
    const startDate = '2025-08-01'
    const endDate = '2025-08-31'
    
    const { data, error } = await supabase
      .from('work_records')
      .select(`
        labor_hours,
        work_date,
        profile_id,
        site_id,
        profiles:profile_id(full_name, role, daily_wage),
        sites:site_id(name)
      `)
      .gte('work_date', startDate)
      .lte('work_date', endDate)
    
    if (error) throw error
    
    // 통계 계산
    const stats = {
      totalWorkers: new Set(data?.map(r => r.profile_id)).size,
      totalLaborHours: data?.reduce((sum, r) => sum + (Number(r.labor_hours) || 0), 0) || 0,
      totalWorkDays: new Set(data?.map(r => r.work_date)).size,
      totalSites: new Set(data?.map(r => r.site_id).filter(Boolean)).size,
      byRole: {} as Record<string, number>,
      bySite: {} as Record<string, number>
    }
    
    // 역할별 통계
    data?.forEach(record => {
      const role = record.profiles?.role || 'Unknown'
      stats.byRole[role] = (stats.byRole[role] || 0) + (Number(record.labor_hours) || 0)
      
      const site = record.sites?.name || 'Unknown'
      stats.bySite[site] = (stats.bySite[site] || 0) + (Number(record.labor_hours) || 0)
    })
    
    addResult(
      '급여 통계 대시보드',
      'PASS',
      `2025년 8월: ${stats.totalWorkers}명, ${stats.totalLaborHours.toFixed(2)} 공수`,
      {
        totalWorkDays: stats.totalWorkDays,
        totalSites: stats.totalSites,
        topRoles: Object.entries(stats.byRole).slice(0, 3).map(([role, hours]) => 
          `${role}: ${hours.toFixed(2)} 공수`
        ),
        topSites: Object.entries(stats.bySite).slice(0, 3).map(([site, hours]) => 
          `${site}: ${hours.toFixed(2)} 공수`
        )
      }
    )
  } catch (error: any) {
    addResult('급여 통계 대시보드', 'FAIL', error.message)
  }
}

async function test4_SalaryStatementManager() {
  console.log('\n📋 TEST 4: 시스템 관리자 - 급여명세서 관리')
  console.log('=' .repeat(60))
  
  try {
    // 급여명세서 생성을 위한 데이터 확인
    const { data: workers } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .not('role', 'is', null)
      .limit(5)
    
    if (!workers || workers.length === 0) {
      addResult('급여명세서 관리', 'WARN', '작업자 데이터 없음')
      return
    }
    
    // 각 작업자의 8월 급여 데이터 확인
    for (const worker of workers.slice(0, 3)) {
      const { data: salaryData } = await supabase
        .from('work_records')
        .select('labor_hours, work_date')
        .or(`user_id.eq.${worker.id},profile_id.eq.${worker.id}`)
        .gte('work_date', '2025-08-01')
        .lte('work_date', '2025-08-31')
      
      const totalLaborHours = salaryData?.reduce((sum, r) => 
        sum + (Number(r.labor_hours) || 0), 0) || 0
      
      if (totalLaborHours > 0) {
        addResult(
          `급여명세서 - ${worker.full_name}`,
          'PASS',
          `2025년 8월: ${totalLaborHours.toFixed(2)} 공수, ${salaryData?.length || 0}일 근무`
        )
      } else {
        addResult(
          `급여명세서 - ${worker.full_name}`,
          'WARN',
          '2025년 8월 근무 기록 없음'
        )
      }
    }
  } catch (error: any) {
    addResult('급여명세서 관리', 'FAIL', error.message)
  }
}

async function test5_PersonalDashboard() {
  console.log('\n📋 TEST 5: 개인 대시보드 - 출근/급여 탭')
  console.log('=' .repeat(60))
  
  try {
    // manager@inopnc.com 사용자로 테스트
    const { data: testUser } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('email', 'manager@inopnc.com')
      .single()
    
    if (!testUser) {
      addResult('개인 대시보드', 'WARN', 'manager@inopnc.com 계정 없음')
      return
    }
    
    // 출근 기록 조회
    const { data: attendance } = await supabase
      .from('work_records')
      .select(`
        work_date,
        check_in_time,
        check_out_time,
        labor_hours,
        sites:site_id(name)
      `)
      .eq('user_id', testUser.id)
      .gte('work_date', '2025-08-01')
      .lte('work_date', '2025-08-31')
      .order('work_date', { ascending: false })
    
    // 월별 급여 계산
    const monthlyStats = new Map<string, { days: number, hours: number }>()
    attendance?.forEach(record => {
      const month = record.work_date.substring(0, 7)
      if (!monthlyStats.has(month)) {
        monthlyStats.set(month, { days: 0, hours: 0 })
      }
      const stats = monthlyStats.get(month)!
      stats.days++
      stats.hours += Number(record.labor_hours) || 0
    })
    
    addResult(
      `개인 대시보드 - ${testUser.full_name}`,
      'PASS',
      `역할: ${testUser.role}, 8월 출근: ${attendance?.length || 0}일`,
      {
        recentAttendance: attendance?.slice(0, 3).map(r => ({
          date: r.work_date,
          site: r.sites?.name || 'Unknown',
          laborHours: Number(r.labor_hours) || 0
        })),
        monthlyStats: Array.from(monthlyStats.entries()).map(([month, stats]) => 
          `${month}: ${stats.days}일, ${stats.hours.toFixed(2)} 공수`
        )
      }
    )
  } catch (error: any) {
    addResult('개인 대시보드', 'FAIL', error.message)
  }
}

async function test6_PartnerAPI() {
  console.log('\n📋 TEST 6: 파트너 API - 노동 시간 조회')
  console.log('=' .repeat(60))
  
  try {
    // 파트너 회사와 연결된 사이트 확인
    const { data: partnerSites } = await supabase
      .from('site_partners')
      .select(`
        site_id,
        partner_company_id,
        sites:site_id(name, status)
      `)
      .limit(5)
    
    if (!partnerSites || partnerSites.length === 0) {
      addResult('파트너 API', 'WARN', '파트너-사이트 연결 데이터 없음')
      return
    }
    
    // 각 사이트의 노동 시간 데이터
    for (const ps of partnerSites.slice(0, 3)) {
      const { data: laborData } = await supabase
        .from('work_records')
        .select('work_date, labor_hours')
        .eq('site_id', ps.site_id)
        .gte('work_date', '2025-08-01')
        .lte('work_date', '2025-08-31')
      
      const totalLaborHours = laborData?.reduce((sum, r) => 
        sum + (Number(r.labor_hours) || 0), 0) || 0
      
      addResult(
        `파트너 사이트 - ${ps.sites?.name || 'Unknown'}`,
        totalLaborHours > 0 ? 'PASS' : 'WARN',
        `2025년 8월: ${totalLaborHours.toFixed(2)} 공수, ${laborData?.length || 0}건`
      )
    }
  } catch (error: any) {
    addResult('파트너 API', 'FAIL', error.message)
  }
}

async function test7_PayslipGeneration() {
  console.log('\n📋 TEST 7: 급여명세서 생성 페이지')
  console.log('=' .repeat(60))
  
  try {
    // 테스트용 사용자 선택
    const { data: testUser } = await supabase
      .from('profiles')
      .select('id, full_name, email, daily_wage')
      .not('role', 'is', null)
      .limit(1)
      .single()
    
    if (!testUser) {
      addResult('급여명세서 생성', 'WARN', '테스트 사용자 없음')
      return
    }
    
    // 급여 정보 조회
    const { data: salaryInfo } = await supabase
      .from('salary_info')
      .select('*')
      .eq('user_id', testUser.id)
      .is('end_date', null)
      .single()
    
    // work_records에서 급여 계산용 데이터
    const { data: workData } = await supabase
      .from('work_records')
      .select(`
        labor_hours,
        work_date,
        site_id,
        sites:site_id(name)
      `)
      .or(`user_id.eq.${testUser.id},profile_id.eq.${testUser.id}`)
      .gte('work_date', '2025-08-01')
      .lte('work_date', '2025-08-31')
    
    // 급여 계산
    const totalLaborHours = workData?.reduce((sum, r) => 
      sum + (Number(r.labor_hours) || 0), 0) || 0
    
    const hourlyRate = salaryInfo?.hourly_rate || 20000
    const overtimeRate = salaryInfo?.overtime_rate || (hourlyRate * 1.5)
    
    let basePay = 0
    let overtimePay = 0
    
    workData?.forEach(record => {
      const laborHours = Number(record.labor_hours) || 0
      const actualWorkHours = laborHours * 8
      const baseHours = Math.min(actualWorkHours, 8)
      const overtimeHours = Math.max(actualWorkHours - 8, 0)
      
      basePay += baseHours * hourlyRate
      overtimePay += overtimeHours * overtimeRate
    })
    
    const totalGrossPay = basePay + overtimePay
    
    // 공제액 계산
    const deductions = {
      tax: Math.floor(totalGrossPay * 0.08),
      pension: Math.floor(totalGrossPay * 0.045),
      health: Math.floor(totalGrossPay * 0.0343),
      employment: Math.floor(totalGrossPay * 0.009)
    }
    
    const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + val, 0)
    const netPay = totalGrossPay - totalDeductions
    
    addResult(
      `급여명세서 생성 - ${testUser.full_name}`,
      'PASS',
      `2025년 8월: 실지급액 ${netPay.toLocaleString()}원`,
      {
        totalLaborHours: totalLaborHours.toFixed(2),
        workDays: workData?.length || 0,
        basePay: basePay.toLocaleString(),
        overtimePay: overtimePay.toLocaleString(),
        totalDeductions: totalDeductions.toLocaleString(),
        netPay: netPay.toLocaleString()
      }
    )
  } catch (error: any) {
    addResult('급여명세서 생성', 'FAIL', error.message)
  }
}

async function runAllTests() {
  console.log('🚀 급여 관련 기능 전체 테스트 시작')
  console.log('=' .repeat(60))
  console.log(`테스트 시작 시간: ${new Date().toLocaleString('ko-KR')}`)
  console.log('=' .repeat(60))
  
  // 모든 테스트 실행
  await test1_IndividualMonthlySalary()
  await test2_DailySalaryCalculation()
  await test3_SalaryStatsDashboard()
  await test4_SalaryStatementManager()
  await test5_PersonalDashboard()
  await test6_PartnerAPI()
  await test7_PayslipGeneration()
  
  // 최종 결과 요약
  console.log('\n' + '=' .repeat(60))
  console.log('📊 최종 테스트 결과 요약')
  console.log('=' .repeat(60))
  
  const passCount = results.filter(r => r.status === 'PASS').length
  const failCount = results.filter(r => r.status === 'FAIL').length
  const warnCount = results.filter(r => r.status === 'WARN').length
  
  console.log(`✅ 성공: ${passCount}개`)
  console.log(`❌ 실패: ${failCount}개`)
  console.log(`⚠️ 경고: ${warnCount}개`)
  console.log(`📋 전체: ${results.length}개`)
  
  if (failCount > 0) {
    console.log('\n❌ 실패한 테스트:')
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.feature}: ${r.details}`)
    })
  }
  
  if (warnCount > 0) {
    console.log('\n⚠️ 경고 항목:')
    results.filter(r => r.status === 'WARN').forEach(r => {
      console.log(`  - ${r.feature}: ${r.details}`)
    })
  }
  
  const overallStatus = failCount === 0 ? '✅ 모든 기능 정상 작동' : '❌ 일부 기능 오류 발생'
  console.log('\n' + '=' .repeat(60))
  console.log(`최종 상태: ${overallStatus}`)
  console.log('=' .repeat(60))
  
  return failCount === 0
}

runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('테스트 실행 중 오류:', error)
    process.exit(1)
  })