import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function inspectSpecifics() {
  console.log('--- Inspecting Site & Reports ---')
  // 1. Find "Gangnam A" or similar site
  const { data: sites } = await supabase.from('sites').select('id, name').ilike('name', '%강남%')
  console.log('Sites found:', sites)

  if (!sites || sites.length === 0) {
    console.log('No "Gangnam" site found. Listing recent sites...')
    const { data: recentSites } = await supabase.from('sites').select('id, name').limit(5)
    console.log('Recent sites:', recentSites)
  }

  // 2. Find Lee Hyun-soo
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('full_name', '이현수')
    .single()
  console.log('User Lee:', users)

  if (users) {
    // 3. Check Work Records for Lee
    const { data: records } = await supabase
      .from('work_records')
      .select('*')
      .eq('user_id', users.id)
      .order('work_date', { ascending: false })
    console.log(`Work Records for Lee (${records?.length}):`, records)

    // 4. Check Daily Reports Lee participated in (via json or relation)
    // Searching daily_report_workers
    const { data: reportWorkers } = await supabase
      .from('daily_report_workers')
      .select('*, daily_report:daily_reports(id, work_date, site_id, work_content)')
      .eq('worker_name', '이현수') // Name match since ID might not be linked
      .order('created_at', { ascending: false })

    console.log(`Report Workers entries for Lee (${reportWorkers?.length}):`)
    reportWorkers?.forEach(r => {
      console.log(` - Report ${r.daily_report?.work_date} (ID: ${r.daily_report_id}):`, r)
      if (r.daily_report?.work_content) {
        console.log('   Content:', JSON.stringify(r.daily_report.work_content))
      }
    })
  }

  // 5. Look for reports on 2026-01-31
  const { data: reportsOn31 } = await supabase
    .from('daily_reports')
    .select('id, site_id, work_date, total_labor_hours, work_content')
    .eq('work_date', '2026-01-31')

  console.log('Reports on 2026-01-31:', reportsOn31)
  reportsOn31?.forEach(r => {
    console.log(`Report ${r.id}: labor=${r.total_labor_hours}`, JSON.stringify(r.work_content))
  })
}

inspectSpecifics()
