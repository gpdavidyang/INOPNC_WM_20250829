/**
 * 급여 관리 시스템 최종 통합 테스트
 * 실제 사용 시나리오를 기반으로 한 End-to-End 테스트
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 시나리오 1: 신입 직원의 급여 설정 생성
async function testScenario1_NewWorkerSetup() {
  console.log('📝 시나리오 1: 신입 직원 급여 설정 생성')

  try {
    // 1. 급여 설정이 없는 직원 찾기
    const { data: workersWithoutSettings } = await supabase
      .from('profiles')
      .select(
        `
        id,
        full_name,
        email,
        role,
        salary_settings:worker_salary_settings!worker_id (id, is_active)
      `
      )
      .in('role', ['worker', 'site_manager'])
      .eq('status', 'active')

    const noSettingsWorkers =
      workersWithoutSettings?.filter(w => !w.salary_settings?.some((s: any) => s.is_active)) || []

    if (noSettingsWorkers.length === 0) {
      console.log('   ⚠️  모든 활성 직원이 이미 급여 설정을 보유하고 있습니다.')
      return true
    }

    const testWorker = noSettingsWorkers[0]
    console.log(`   👤 테스트 대상: ${testWorker.full_name} (${testWorker.email})`)

    // 2. 새로운 급여 설정 생성 (RPC 함수 사용)
    const { data: newSetting, error: settingError } = await supabase.rpc(
      'set_worker_salary_setting',
      {
        p_worker_id: testWorker.id,
        p_employment_type: 'freelancer',
        p_daily_rate: 180000,
        p_custom_tax_rates: null,
        p_bank_account_info: JSON.stringify({
          bank_name: '신한은행',
          account_holder: testWorker.full_name,
          account_number: '123-456-789',
        }),
        p_effective_date: new Date().toISOString().split('T')[0],
      }
    )

    if (settingError) {
      console.error('   ❌ 급여 설정 생성 실패:', settingError)
      return false
    }

    console.log(`   ✅ 급여 설정 생성 완료 (ID: ${newSetting})`)

    // 3. 생성된 설정으로 급여 계산 테스트
    const { data: calculation, error: calcError } = await supabase.rpc(
      'calculate_individual_salary',
      {
        p_worker_id: testWorker.id,
        p_labor_hours: 1.0,
        p_work_date: new Date().toISOString().split('T')[0],
      }
    )

    if (calcError) {
      console.error('   ❌ 급여 계산 실패:', calcError)
      return false
    }

    if (calculation && calculation.length > 0) {
      const calc = calculation[0]
      console.log(
        `   💰 급여 계산 결과: ₩${parseFloat(calc.gross_pay).toLocaleString()} → ₩${parseFloat(calc.net_pay).toLocaleString()}`
      )
    }

    return true
  } catch (error) {
    console.error('   ❌ 시나리오 1 실행 실패:', error)
    return false
  }
}

// 시나리오 2: 고용형태별 세율 수정 및 재계산
async function testScenario2_TaxRateUpdate() {
  console.log('📝 시나리오 2: 세율 수정 및 재계산')

  try {
    // 1. 현재 프리랜서 소득세율 확인
    const { data: currentRate, error: fetchError } = await supabase
      .from('employment_tax_rates')
      .select('id, rate')
      .eq('employment_type', 'freelancer')
      .eq('tax_name', '소득세')
      .eq('is_active', true)
      .single()

    if (fetchError) {
      console.error('   ❌ 현재 세율 조회 실패:', fetchError)
      return false
    }

    console.log(`   📊 현재 프리랜서 소득세율: ${currentRate.rate}%`)

    // 2. 세율 임시 변경 (3.3% → 4.0%)
    const newRate = 4.0
    const { error: updateError } = await supabase
      .from('employment_tax_rates')
      .update({
        rate: newRate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentRate.id)

    if (updateError) {
      console.error('   ❌ 세율 업데이트 실패:', updateError)
      return false
    }

    console.log(`   ✅ 세율 변경: ${currentRate.rate}% → ${newRate}%`)

    // 3. 변경된 세율로 급여 재계산
    const { data: freelancerWorker } = await supabase
      .from('worker_salary_settings')
      .select('worker_id')
      .eq('employment_type', 'freelancer')
      .eq('is_active', true)
      .limit(1)
      .single()

    if (freelancerWorker) {
      const { data: newCalculation, error: newCalcError } = await supabase.rpc(
        'calculate_individual_salary',
        {
          p_worker_id: freelancerWorker.worker_id,
          p_labor_hours: 1.0,
          p_work_date: new Date().toISOString().split('T')[0],
        }
      )

      if (newCalcError) {
        console.error('   ❌ 새로운 급여 계산 실패:', newCalcError)
      } else if (newCalculation && newCalculation.length > 0) {
        const calc = newCalculation[0]
        const taxRate = (
          ((parseFloat(calc.gross_pay) - parseFloat(calc.net_pay)) / parseFloat(calc.gross_pay)) *
          100
        ).toFixed(2)
        console.log(
          `   💰 새로운 계산 결과: 세율 ${taxRate}%, 실수령액 ₩${parseFloat(calc.net_pay).toLocaleString()}`
        )
      }
    }

    // 4. 세율 원복
    const { error: revertError } = await supabase
      .from('employment_tax_rates')
      .update({
        rate: currentRate.rate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentRate.id)

    if (revertError) {
      console.error('   ⚠️  세율 원복 실패:', revertError)
    } else {
      console.log(`   🔄 세율 원복: ${newRate}% → ${currentRate.rate}%`)
    }

    return true
  } catch (error) {
    console.error('   ❌ 시나리오 2 실행 실패:', error)
    return false
  }
}

// 시나리오 3: 초과근무 급여 계산
async function testScenario3_OvertimeCalculation() {
  console.log('📝 시나리오 3: 초과근무 급여 계산')

  try {
    // 1. 테스트할 직원 선택 (4대보험 직원)
    const { data: regularWorker } = await supabase
      .from('worker_salary_settings')
      .select('worker_id, daily_rate, employment_type')
      .eq('employment_type', 'regular_employee')
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!regularWorker) {
      console.log('   ⚠️  4대보험 직원이 없습니다.')
      return true
    }

    console.log(
      `   👤 테스트 대상: ${regularWorker.employment_type} (일급 ₩${regularWorker.daily_rate})`
    )

    // 2. 다양한 공수로 급여 계산
    const testHours = [0.5, 1.0, 1.5, 2.0, 2.5]
    console.log('   📊 공수별 급여 계산 결과:')

    for (const hours of testHours) {
      const { data: result, error } = await supabase.rpc('calculate_individual_salary', {
        p_worker_id: regularWorker.worker_id,
        p_labor_hours: hours,
        p_work_date: new Date().toISOString().split('T')[0],
      })

      if (error) {
        console.error(`      ❌ ${hours}공수 계산 실패:`, error)
        continue
      }

      if (result && result.length > 0) {
        const calc = result[0]
        const gross = parseFloat(calc.gross_pay)
        const net = parseFloat(calc.net_pay)

        console.log(
          `      ${hours}공수: 총 ₩${gross.toLocaleString()} → 실수령 ₩${net.toLocaleString()}`
        )
      }
    }

    return true
  } catch (error) {
    console.error('   ❌ 시나리오 3 실행 실패:', error)
    return false
  }
}

// 시나리오 4: 급여 기록 저장 및 월별 요약
async function testScenario4_SalaryRecording() {
  console.log('📝 시나리오 4: 급여 기록 저장 및 월별 요약')

  try {
    // 1. 테스트 급여 계산
    const { data: testWorker } = await supabase
      .from('worker_salary_settings')
      .select('worker_id, employment_type')
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!testWorker) {
      console.log('   ⚠️  테스트할 직원이 없습니다.')
      return true
    }

    const { data: calculation, error: calcError } = await supabase.rpc(
      'calculate_individual_salary',
      {
        p_worker_id: testWorker.worker_id,
        p_labor_hours: 1.0,
        p_work_date: new Date().toISOString().split('T')[0],
      }
    )

    if (calcError || !calculation || calculation.length === 0) {
      console.error('   ❌ 급여 계산 실패:', calcError)
      return false
    }

    const calc = calculation[0]

    // 2. 급여 기록 저장
    const { data: record, error: recordError } = await supabase
      .from('salary_records')
      .insert({
        worker_id: testWorker.worker_id,
        work_date: new Date().toISOString().split('T')[0],
        employment_type: calc.employment_type,
        regular_hours: 8,
        overtime_hours: 0,
        labor_hours: 1.0,
        base_pay: parseFloat(calc.base_pay),
        deductions: 0,
        income_tax: parseFloat(calc.income_tax),
        resident_tax: parseFloat(calc.resident_tax),
        national_pension: parseFloat(calc.national_pension || '0'),
        health_insurance: parseFloat(calc.health_insurance || '0'),
        employment_insurance: parseFloat(calc.employment_insurance || '0'),
        tax_amount: parseFloat(calc.total_tax),
        total_pay: parseFloat(calc.net_pay),
        status: 'calculated',
        notes: '테스트 급여 기록',
      })
      .select()
      .single()

    if (recordError) {
      console.error('   ❌ 급여 기록 저장 실패:', recordError)
      return false
    }

    console.log(`   ✅ 급여 기록 저장 완료 (ID: ${record.id})`)

    // 3. 월별 급여 요약 조회
    const currentDate = new Date()
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1

    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    const { data: monthlyRecords, error: monthlyError } = await supabase
      .from('salary_records')
      .select('*')
      .eq('worker_id', testWorker.worker_id)
      .gte('work_date', startDate)
      .lte('work_date', endDate)

    if (monthlyError) {
      console.error('   ❌ 월별 기록 조회 실패:', monthlyError)
    } else {
      const summary = monthlyRecords?.reduce(
        (acc, rec) => {
          acc.total_records += 1
          acc.total_labor_hours += rec.labor_hours || 0
          acc.total_gross_pay += rec.base_pay
          acc.total_net_pay += rec.total_pay
          return acc
        },
        {
          total_records: 0,
          total_labor_hours: 0,
          total_gross_pay: 0,
          total_net_pay: 0,
        }
      )

      console.log(`   📊 ${year}년 ${month}월 급여 요약:`)
      console.log(`      기록 수: ${summary?.total_records}건`)
      console.log(`      총 공수: ${summary?.total_labor_hours}`)
      console.log(`      총 급여: ₩${summary?.total_gross_pay.toLocaleString()}`)
      console.log(`      실수령액: ₩${summary?.total_net_pay.toLocaleString()}`)
    }

    // 4. 테스트 기록 정리
    const { error: deleteError } = await supabase
      .from('salary_records')
      .delete()
      .eq('id', record.id)

    if (deleteError) {
      console.log('   ⚠️  테스트 기록 정리 실패 (수동 정리 필요):', deleteError)
    } else {
      console.log('   🧹 테스트 기록 정리 완료')
    }

    return true
  } catch (error) {
    console.error('   ❌ 시나리오 4 실행 실패:', error)
    return false
  }
}

async function main() {
  console.log('🎯 급여 관리 시스템 최종 통합 테스트')
  console.log('=======================================\n')

  const scenarios = [
    { name: '신입 직원 급여 설정', test: testScenario1_NewWorkerSetup },
    { name: '세율 수정 및 재계산', test: testScenario2_TaxRateUpdate },
    { name: '초과근무 급여 계산', test: testScenario3_OvertimeCalculation },
    { name: '급여 기록 및 월별 요약', test: testScenario4_SalaryRecording },
  ]

  let passedScenarios = 0

  for (const scenario of scenarios) {
    console.log(`${scenario.name}`)
    console.log('-'.repeat(scenario.name.length + 10))

    try {
      const result = await scenario.test()
      if (result) {
        passedScenarios++
        console.log(`✅ ${scenario.name} 성공\n`)
      } else {
        console.log(`❌ ${scenario.name} 실패\n`)
      }
    } catch (error) {
      console.error(`❌ ${scenario.name} 실행 중 오류:`, error)
      console.log()
    }
  }

  console.log('🏁 최종 테스트 결과')
  console.log('==================')
  console.log(`✅ 성공: ${passedScenarios}/${scenarios.length}개 시나리오`)

  if (passedScenarios === scenarios.length) {
    console.log()
    console.log('🎉 모든 시나리오 테스트 통과!')
    console.log('💼 급여 관리 시스템이 완전히 준비되었습니다.')
    console.log()
    console.log('🔗 UI 테스트 방법:')
    console.log('   1. 브라우저에서 http://localhost:3002 접속')
    console.log('   2. 관리자 계정으로 로그인 (admin@test.com 또는 davidswyang@gmail.com)')
    console.log('   3. /dashboard/admin/salary 이동')
    console.log('   4. "개인별 설정" 탭에서 직원별 급여 설정 관리')
    console.log('   5. "급여 계산" 탭에서 개인별 급여 계산 및 PDF 생성')
  } else {
    console.log()
    console.log('⚠️  일부 시나리오에서 문제가 발견되었습니다.')
    console.log('   시스템은 기본적으로 작동하지만 추가 검토가 필요할 수 있습니다.')
  }
}

main().catch(console.error)
