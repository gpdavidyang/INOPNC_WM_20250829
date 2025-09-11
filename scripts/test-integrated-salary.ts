import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function testIntegratedSalary() {
  console.log('🧪 통합된 worker_assignments 테이블로 급여 계산 테스트...\n')

  try {
    // 1. 2025년 7월 데이터 확인
    const startDate = '2025-07-01'
    const endDate = '2025-07-31'

    const { data: assignments, error } = await supabase
      .from('worker_assignments')
      .select(`
        profile_id,
        user_id,
        labor_hours,
        work_date,
        site_id,
        check_in_time,
        check_out_time,
        work_hours,
        overtime_hours,
        sites(name),
        profiles:profile_id(
          id,
          full_name,
          phone,
          daily_wage,
          meal_allowance,
          transportation_allowance
        )
      `)
      .gte('work_date', startDate)
      .lte('work_date', endDate)

    if (error) {
      console.error('❌ 데이터 조회 실패:', error)
      return
    }

    console.log(`✅ 2025년 7월 worker_assignments: ${assignments?.length || 0}건`)

    if (!assignments || assignments.length === 0) {
      console.log('⚠️ 데이터가 없습니다.')
      return
    }

    // 2. 작업자별 급여 계산
    const workerMap = new Map()

    assignments.forEach(assignment => {
      const workerId = assignment.profile_id || assignment.user_id
      const worker = assignment.profiles
      const site = assignment.sites

      if (!worker) return

      if (!workerMap.has(workerId)) {
        workerMap.set(workerId, {
          name: worker.full_name,
          phone: worker.phone,
          total_days: 0,
          total_manhours: 0,
          base_salary: 0,
          allowances: 0,
          sites: new Set()
        })
      }

      const workerData = workerMap.get(workerId)
      workerData.total_days += 1
      workerData.total_manhours += Number(assignment.labor_hours) || 0
      workerData.base_salary += Number(worker.daily_wage) || 0
      workerData.allowances += (Number(worker.meal_allowance) || 0) + (Number(worker.transportation_allowance) || 0)
      if (site?.name) {
        workerData.sites.add(site.name)
      }
    })

    // 3. 결과 출력
    console.log('\n📊 2025년 7월 급여 계산 결과:')
    console.log('=' * 60)

    let totalSalary = 0
    let totalWorkers = 0

    workerMap.forEach((data, workerId) => {
      const netSalary = data.base_salary + data.allowances
      totalSalary += netSalary
      totalWorkers++

      console.log(`\n👤 ${data.name}`)
      console.log(`   ID: ${workerId}`)
      console.log(`   전화: ${data.phone || 'N/A'}`)
      console.log(`   근무일수: ${data.total_days}일`)
      console.log(`   총공수: ${data.total_manhours.toFixed(2)}`)
      console.log(`   기본급: ${data.base_salary.toLocaleString()}원`)
      console.log(`   수당: ${data.allowances.toLocaleString()}원`)
      console.log(`   실수령액: ${netSalary.toLocaleString()}원`)
      console.log(`   현장: ${Array.from(data.sites).join(', ') || '미지정'}`)
    })

    console.log('\n' + '=' * 60)
    console.log(`📈 총계:`)
    console.log(`   작업자 수: ${totalWorkers}명`)
    console.log(`   총 급여: ${totalSalary.toLocaleString()}원`)
    console.log(`   평균 급여: ${(totalSalary / totalWorkers).toLocaleString()}원`)

    // 4. 2025년 8월 데이터도 확인
    const { data: augustData } = await supabase
      .from('worker_assignments')
      .select('id')
      .gte('work_date', '2025-08-01')
      .lte('work_date', '2025-08-31')

    console.log(`\n✅ 2025년 8월 worker_assignments: ${augustData?.length || 0}건`)

    // 5. 전체 데이터 요약
    const { data: allData } = await supabase
      .from('worker_assignments')
      .select('work_date')
      .order('work_date', { ascending: false })
      .limit(1)

    if (allData && allData.length > 0) {
      console.log(`\n📅 최신 데이터 날짜: ${allData[0].work_date}`)
    }

    console.log('\n✅ 통합 테스트 완료!')
    console.log('이제 시스템관리자 화면에서 "개인별 월급여계산"을 사용할 수 있습니다.')

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error)
  }
}

testIntegratedSalary().catch(console.error)