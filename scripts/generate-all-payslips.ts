
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// 세금 계산 함수
function calculateTax(grossPay: number, salaryType: string) {
  switch(salaryType) {
    case '프리랜서':
      // 프리랜서: 소득세 3.3%
      return {
        tax_deduction: Math.floor(grossPay * 0.033),
        national_pension: 0,
        health_insurance: 0,
        employment_insurance: 0,
        tax_rate: 0.033
      }
    case '일용직':
      // 일용직: 소득세 2.97% (일용근로소득세율)
      return {
        tax_deduction: Math.floor(grossPay * 0.0297),
        national_pension: 0,
        health_insurance: 0,
        employment_insurance: 0,
        tax_rate: 0.0297
      }
    case '4대보험직원':
    default:
      // 4대보험 직원: 표준 공제
      const tax = Math.floor(grossPay * 0.08)
      const pension = Math.floor(grossPay * 0.045)
      const health = Math.floor(grossPay * 0.03495)
      const employment = Math.floor(grossPay * 0.009)
      return {
        tax_deduction: tax,
        national_pension: pension,
        health_insurance: health,
        employment_insurance: employment,
        tax_rate: (tax + pension + health + employment) / grossPay
      }
  }
}

async function generateAllPayslips(year: number = 2025, month: number = 8) {
  console.log(`📄 ${year}년 ${month}월 전체 작업자 급여명세서 생성 시작...\n`)

  try {
    // 1. 모든 작업자 조회
    const { data: workers, error: workersError } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['worker', 'site-manager'])
      .not('full_name', 'is', null)

    if (workersError || !workers) {
      console.error('작업자 조회 실패:', workersError)
      return
    }

    console.log(`📊 총 ${workers.length}명의 작업자 발견\n`)

    // PDF 저장 디렉토리 생성
    const outputDir = join(process.cwd(), 'payslips', `${year}-${String(month).padStart(2, '0')}`)
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true })
    }

    const results = []
    
    for (const worker of workers) {
      console.log(`\n처리중: ${worker.full_name} (${worker.salary_type || '일용직'})`)
      
      // 2. 해당 월 근무 데이터 조회
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`
      
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance_records')
        .select(`
          work_date,
          labor_hours,
          work_hours,
          overtime_hours,
          site_id,
          sites (name)
        `)
        .eq('user_id', worker.id)
        .gte('work_date', startDate)
        .lte('work_date', endDate)
        .order('work_date')

      if (attendanceError || !attendance || attendance.length === 0) {
        console.log(`  ⚠️  ${worker.full_name}: 근무 기록 없음`)
        continue
      }

      // 3. 근무 데이터 집계
      const workData = {
        work_days: attendance.length,
        total_labor_hours: attendance.reduce((sum, a) => sum + (Number(a.labor_hours) || 0), 0),
        total_work_hours: attendance.reduce((sum, a) => sum + (Number(a.work_hours) || 0), 0),
        total_overtime_hours: attendance.reduce((sum, a) => sum + (Number(a.overtime_hours) || 0), 0),
        period_start: attendance[0].work_date,
        period_end: attendance[attendance.length - 1].work_date,
        site_name: attendance[0].sites?.name || '미지정'
      }

      // 4. 급여 계산
      const daily_wage = Number(worker.daily_wage) || 150000
      const base_pay = workData.work_days * daily_wage
      const overtime_pay = worker.salary_type === '4대보험직원' ? 
        Math.floor(workData.total_overtime_hours * (daily_wage / 8) * 1.5) : 0
      const bonus_pay = 0
      const total_gross_pay = base_pay + overtime_pay + bonus_pay

      // 5. 세금 계산 (급여방식별)
      const taxInfo = calculateTax(total_gross_pay, worker.salary_type || '일용직')
      const total_deductions = taxInfo.tax_deduction + taxInfo.national_pension + 
                               taxInfo.health_insurance + taxInfo.employment_insurance
      const net_pay = total_gross_pay - total_deductions

      console.log(`  ✓ 근무: ${workData.work_days}일, 급여: ${net_pay.toLocaleString()}원`)

      // 6. PDF 생성
      const payslipData = {
        employee: {
          id: worker.id,
          name: worker.full_name,
          email: worker.email || '',
          role: worker.role,
          department: worker.salary_type || '일용직',
          employeeNumber: worker.employee_number || `W-${worker.id.slice(0, 6)}`
        },
        company: {
          name: 'INOPNC',
          address: '서울특별시 강남구 테헤란로 123',
          phone: '02-1234-5678',
          registrationNumber: '123-45-67890'
        },
        site: {
          id: attendance[0].site_id || '',
          name: workData.site_name
        },
        salary: {
          base_pay,
          base_salary: base_pay,
          overtime_pay,
          bonus_pay,
          total_gross_pay,
          ...taxInfo,
          total_deductions,
          net_pay,
          work_days: workData.work_days,
          total_labor_hours: workData.total_labor_hours,
          total_work_hours: workData.total_work_hours,
          total_overtime_hours: workData.total_overtime_hours,
          hourly_rate: Math.floor(daily_wage / 8),
          overtime_rate: worker.salary_type === '4대보험직원' ? Math.floor(daily_wage / 8 * 1.5) : 0,
          regular_pay: base_pay,
          period_start: workData.period_start,
          period_end: workData.period_end
        },
        paymentDate: new Date(`${year}-${String(month).padStart(2, '0')}-25`),
        paymentMethod: '계좌이체'
      }

      try {
        const pdfBlob = await payslipGenerator.generatePDF(payslipData)
        const arrayBuffer = await pdfBlob.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        const fileName = `payslip_${worker.full_name}_${year}-${String(month).padStart(2, '0')}.pdf`
        const filePath = join(outputDir, fileName)
        writeFileSync(filePath, buffer)
        
        console.log(`  ✅ PDF 생성 완료: ${fileName}`)
        
        results.push({
          name: worker.full_name,
          salary_type: worker.salary_type,
          work_days: workData.work_days,
          net_pay,
          file: fileName,
          success: true
        })
      } catch (pdfError) {
        console.error(`  ❌ PDF 생성 실패:`, pdfError)
        results.push({
          name: worker.full_name,
          success: false,
          error: pdfError
        })
      }
    }

    // 7. 결과 요약
    console.log('\n' + '='.repeat(60))
    console.log('📊 급여명세서 생성 완료 요약')
    console.log('='.repeat(60))
    
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    
    console.log(`✅ 성공: ${successCount}건`)
    console.log(`❌ 실패: ${failCount}건`)
    console.log(`📁 저장 위치: ${outputDir}`)
    
    console.log('\n상세 내역:')
    results.filter(r => r.success).forEach(r => {
      console.log(`  - ${r.name} (${r.salary_type}): ${r.work_days}일 근무, ${r.net_pay?.toLocaleString()}원`)
    })
    
    if (failCount > 0) {
      console.log('\n실패 목록:')
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.name}: ${r.error}`)
      })
    }

    // 8. 데이터베이스에 생성 기록 저장 (선택적)
    // 추후 payslips 테이블 생성하여 관리 가능
    
    return results
    
  } catch (error) {
    console.error('❌ 전체 처리 중 오류:', error)
    return []
  }
}

// 실행
const args = process.argv.slice(2)
const year = args[0] ? parseInt(args[0]) : 2025
const month = args[1] ? parseInt(args[1]) : 8

generateAllPayslips(year, month).then(results => {
  console.log('\n🎉 모든 작업 완료!')
  process.exit(0)
}).catch(error => {
  console.error('❌ 실행 실패:', error)
  process.exit(1)
})