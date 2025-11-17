const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function generateSamplePayslip() {
  console.log('📄 김작업님의 2025년 8월 급여명세서 생성 중...\n')

  // 김작업님 데이터 (데이터베이스 조회 결과)
  const workerData = {
    id: 'ce0d0e42-3e26-4e37-a580-4ea701ac2ebb',
    full_name: '김작업',
    email: 'worker.kim@inopnc.com',
    role: 'worker',
    salary_type: '프리랜서',
    daily_wage: 150000,
  }

  // 2025년 8월 근무 데이터
  const workData = {
    work_days: 6,
    total_labor_hours: 7.44,
    total_work_hours: 59.58,
    total_overtime_hours: 0,
    period_start: '2025-08-18',
    period_end: '2025-08-23',
  }

  // 급여 계산 (프리랜서: 일당 기준)
  const base_pay = workData.work_days * workerData.daily_wage
  const total_gross_pay = base_pay

  // 프리랜서 세금 계산 (간이세율 적용)
  // 프리랜서: 소득세 3.3% (소득세 3% + 지방소득세 0.3%)
  const tax_rate = 0.033
  const tax_deduction = Math.floor(total_gross_pay * tax_rate)
  const national_pension = 0 // 프리랜서는 4대보험 없음
  const health_insurance = 0
  const employment_insurance = 0
  const total_deductions = tax_deduction
  const net_pay = total_gross_pay - total_deductions

  console.log('📊 급여 계산 결과:')
  console.log('   근무일수:', workData.work_days, '일')
  console.log('   일당:', workerData.daily_wage.toLocaleString(), '원')
  console.log(
    '   총 노동시간:',
    workData.total_labor_hours,
    '시간 (',
    (workData.total_labor_hours / 8).toFixed(2),
    '공수)'
  )
  console.log('   기본급:', base_pay.toLocaleString(), '원')
  console.log('   세금(3.3%):', tax_deduction.toLocaleString(), '원')
  console.log('   실지급액:', net_pay.toLocaleString(), '원')
  console.log('')

  // PDF 생성용 데이터 구조
  const payslipData = {
    employee: {
      id: workerData.id,
      name: workerData.full_name,
      email: workerData.email,
      role: workerData.role,
      department: '프리랜서',
      employeeNumber: 'FR-001',
    },
    company: {
      name: 'INOPNC',
      address: '서울특별시 강남구 테헤란로 123',
      phone: '02-1234-5678',
      registrationNumber: '123-45-67890',
    },
    site: {
      id: 'site-001',
      name: '삼성전자 평택캠퍼스 P3',
      address: '경기도 평택시',
    },
    salary: {
      base_pay,
      base_salary: base_pay,
      total_gross_pay,
      tax_deduction,
      national_pension,
      health_insurance,
      employment_insurance,
      total_deductions,
      net_pay,
      work_days: workData.work_days,
      total_labor_hours: workData.total_labor_hours,
      total_work_hours: workData.total_work_hours,
      total_overtime_hours: workData.total_overtime_hours,
      hourly_rate: Math.floor(workerData.daily_wage / 8),
      regular_pay: base_pay,
      period_start: workData.period_start,
      period_end: workData.period_end,
    },
    paymentDate: new Date('2025-08-25'),
    paymentMethod: '계좌이체',
  }

  try {
    // HTML 생성 (한글 지원)
    console.log('🖨️  급여명세서 생성 중...')
    const html = payslipGeneratorKorean.generateHTML(payslipData)

    // HTML 파일로 저장
    const outputPath = join(process.cwd(), 'payslip_김작업_2025-08.html')
    writeFileSync(outputPath, html, 'utf-8')

    console.log('✅ 급여명세서 생성 완료!')
    console.log('📁 저장 위치:', outputPath)
    console.log('')
    console.log('📋 급여명세서 내용 요약:')
    console.log('================================')
    console.log('직원명:', workerData.full_name)
    console.log('급여방식:', workerData.salary_type)
    console.log('근무기간:', workData.period_start, '~', workData.period_end)
    console.log('근무일수:', workData.work_days, '일')
    console.log('총급여:', total_gross_pay.toLocaleString(), '원')
    console.log(
      '공제액:',
      total_deductions.toLocaleString(),
      '원 (세율',
      (tax_rate * 100).toFixed(1),
      '%)'
    )
    console.log('실지급액:', net_pay.toLocaleString(), '원')
    console.log('================================')

    return { success: true, data: payslipData }
  } catch (error) {
    console.error('❌ PDF 생성 실패:', error)
    return { success: false, error }
  }
}

// 실행
generateSamplePayslip()
  .then(result => {
    if (result.success) {
      console.log('\n🎉 샘플 급여명세서 생성 성공!')
      console.log('\n다음 단계:')
      console.log('1. 생성된 HTML 파일을 브라우저에서 열기')
      console.log('2. 브라우저에서 인쇄 > PDF로 저장')
      console.log('3. 포맷 및 내용 검토')
      console.log('4. 다른 직원들에게도 동일하게 적용')
    } else {
      console.error('\n❌ 생성 실패')
    }
    process.exit(result.success ? 0 : 1)
  })
  .catch(console.error)
