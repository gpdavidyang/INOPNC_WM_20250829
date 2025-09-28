import { createClient } from '@supabase/supabase-js'
import { salaryCalculationService } from '@/lib/services/salary-calculation.service'

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(url, key)

  const { data: setting } = await supabase
    .from('worker_salary_settings')
    .select('worker_id')
    .eq('employment_type', 'regular_employee')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (!setting?.worker_id) {
    console.log('No regular_employee found.')
    return
  }

  const y = Number(process.argv[2]) || new Date().getFullYear()
  const m = Number(process.argv[3]) || new Date().getMonth() + 1

  const res = await salaryCalculationService.calculateMonthlySalary(
    setting.worker_id,
    y,
    m,
    undefined,
    true
  )
  console.log(
    JSON.stringify({ worker: setting.worker_id, year: y, month: m, result: res }, null, 2)
  )
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
