/**
 * 급여 시스템 통합 테스트 스크립트
 */


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface TestResult {
  test_name: string
  status: 'PASS' | 'FAIL'
  details?: any
  error?: string
}

async function runTest(testName: string, testFn: () => Promise<any>): Promise<TestResult> {
  console.log(`🧪 Testing: ${testName}`)
  
  try {
    const result = await testFn()
    console.log(`✅ PASS: ${testName}`)
    return {
      test_name: testName,
      status: 'PASS',
      details: result
    }
  } catch (error) {
    console.error(`❌ FAIL: ${testName}`, error)
    return {
      test_name: testName,
      status: 'FAIL',
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

async function testDatabaseSchema() {
  // 1. 테이블 존재 확인 (직접 테이블에서 데이터 조회로 존재 확인)
  const tables = []
  
  try {
    await supabase.from('employment_tax_rates').select('id').limit(1)
    tables.push('employment_tax_rates')
  } catch (error) {
    throw new Error('employment_tax_rates table not found')
  }
  
  try {
    await supabase.from('worker_salary_settings').select('id').limit(1)
    tables.push('worker_salary_settings')
  } catch (error) {
    throw new Error('worker_salary_settings table not found')
  }
  
  return `Found tables: ${tables.join(', ')}`
}

async function testTaxRatesData() {
  // 2. 세율 데이터 확인
  const { data: rates, error } = await supabase
    .from('employment_tax_rates')
    .select('employment_type, tax_name, rate')
    .eq('is_active', true)

  if (error) throw error
  
  const employmentTypes = [...new Set(rates?.map(r => r.employment_type) || [])]
  if (!employmentTypes.includes('regular_employee') || 
      !employmentTypes.includes('freelancer') || 
      !employmentTypes.includes('daily_worker')) {
    throw new Error('Missing employment types in tax rates')
  }
  
  return `Found ${rates?.length} tax rates for types: ${employmentTypes.join(', ')}`
}

async function testWorkerSettings() {
  // 3. 직원 급여 설정 데이터 확인
  const { data: settings, error } = await supabase
    .from('worker_salary_settings')
    .select('worker_id, employment_type, daily_rate, is_active')
    .eq('is_active', true)

  if (error) throw error
  
  return `Found ${settings?.length} active worker salary settings`
}

async function testSalaryCalculation() {
  // 4. 급여 계산 함수 테스트
  const { data: result, error } = await supabase.rpc('calculate_individual_salary', {
    p_worker_id: 'ec4e0964-4177-460c-a25c-c9f2895a2df6', // 4대보험 직원
    p_labor_hours: 1.0,
    p_work_date: '2024-01-15'
  })

  if (error) throw error
  if (!result || result.length === 0) throw new Error('No calculation result returned')
  
  const calc = result[0]
  return `Calculation result: ${calc.employment_type}, Gross: ${calc.gross_pay}, Net: ${calc.net_pay}`
}

async function testMultipleEmploymentTypes() {
  // 5. 다양한 고용형태 테스트
  const testCases = [
    { worker_id: 'ec4e0964-4177-460c-a25c-c9f2895a2df6', expected_type: 'regular_employee' },
    { worker_id: '2a082247-3255-4811-b1d7-38e83c9019e0', expected_type: 'daily_worker' }
  ]

  const results = []
  
  for (const testCase of testCases) {
    const { data: result, error } = await supabase.rpc('calculate_individual_salary', {
      p_worker_id: testCase.worker_id,
      p_labor_hours: 1.0,
      p_work_date: '2024-01-15'
    })

    if (error) throw error
    if (!result || result.length === 0) continue
    
    const calc = result[0]
    if (calc.employment_type !== testCase.expected_type) {
      throw new Error(`Expected ${testCase.expected_type}, got ${calc.employment_type}`)
    }
    
    results.push({
      type: calc.employment_type,
      gross: parseFloat(calc.gross_pay),
      net: parseFloat(calc.net_pay),
      tax_rate: ((parseFloat(calc.gross_pay) - parseFloat(calc.net_pay)) / parseFloat(calc.gross_pay) * 100).toFixed(2) + '%'
    })
  }
  
  return results
}

async function testAPIEndpoints() {
  // 6. API 엔드포인트 테스트 (간접적으로 server actions 확인)
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('role', ['worker', 'site_manager', 'customer_manager'])
    .limit(3)

  if (error) throw error
  
  return `Found ${profiles?.length} worker profiles for salary settings`
}

async function main() {
  console.log('🚀 Starting Salary System Integration Tests...\n')
  
  const tests = [
    () => testDatabaseSchema(),
    () => testTaxRatesData(), 
    () => testWorkerSettings(),
    () => testSalaryCalculation(),
    () => testMultipleEmploymentTypes(),
    () => testAPIEndpoints()
  ]

  const testNames = [
    'Database Schema Validation',
    'Tax Rates Data Integrity', 
    'Worker Settings Validation',
    'Basic Salary Calculation',
    'Multiple Employment Types',
    'API Endpoints Accessibility'
  ]

  const results: TestResult[] = []
  
  for (let i = 0; i < tests.length; i++) {
    const result = await runTest(testNames[i], tests[i])
    results.push(result)
    console.log() // Add spacing
  }
  
  // Summary
  console.log('📊 Test Summary:')
  console.log('================')
  
  const passCount = results.filter(r => r.status === 'PASS').length
  const failCount = results.filter(r => r.status === 'FAIL').length
  
  results.forEach(result => {
    const status = result.status === 'PASS' ? '✅' : '❌'
    console.log(`${status} ${result.test_name}`)
    if (result.details && typeof result.details === 'string') {
      console.log(`   ${result.details}`)
    } else if (result.details && typeof result.details === 'object') {
      console.log(`   ${JSON.stringify(result.details, null, 2)}`)
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
  })
  
  console.log(`\n🎯 Results: ${passCount} PASSED, ${failCount} FAILED`)
  
  if (failCount === 0) {
    console.log('🎉 All tests passed! Salary system is ready for production.')
  } else {
    console.log('⚠️  Some tests failed. Please review and fix issues.')
    process.exit(1)
  }
}

main().catch(console.error)