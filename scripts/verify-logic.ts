import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testLogic() {
  const siteId = '0655796a-4731-45f4-8515-167445ddac0a'
  const targetName = '이현수'

  // 1. Get User ID
  const { data: user } = await supabase
    .from('profiles')
    .select('id')
    .eq('full_name', targetName)
    .single()
  const userId = user?.id
  console.log('User ID:', userId)

  // 2. Fetch Reports
  const { data: reports } = await supabase
    .from('daily_reports')
    .select('id, work_date')
    .eq('site_id', siteId)
  console.log(`Reports found: ${reports?.length}`)
  const reportIds = reports?.map(r => r.id) || []

  // 3. Fetch Report Workers
  const { data: workers } = await supabase
    .from('daily_report_workers')
    .select('worker_id, work_hours, daily_report_id')
    .in('daily_report_id', reportIds)
    .eq('worker_id', userId) // Simulate filter

  console.log('Workers found:', workers)

  // 4. Calculate
  let total = 0
  workers?.forEach(w => {
    const h = Number(w.work_hours) || 0
    const d = h > 0 ? h / 8 : 1.0
    total += d
    console.log(` + Report ${w.daily_report_id}: ${h}h -> ${d} days`)
  })
  console.log('Total Man-Days:', total)
}

testLogic()
