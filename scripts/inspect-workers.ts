import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function inspectWorkerEntries() {
  const siteId = '0655796a-4731-45f4-8515-167445ddac0a' // Gangnam A

  // 1. Get recent reports
  const { data: reports } = await supabase
    .from('daily_reports')
    .select('id, work_date')
    .eq('site_id', siteId)
    .order('work_date', { ascending: false })
    .limit(3)
  console.log('Recent Reports:', reports)
  if (!reports?.length) return

  const reportIds = reports.map(r => r.id)

  // 2. Get workers for these reports
  const { data: workers } = await supabase
    .from('daily_report_workers')
    .select('*')
    .in('daily_report_id', reportIds)

  console.log('Worker Entries:', workers)

  // 3. Specifically look for Lee
  const lee = workers?.find(w => w.worker_name?.includes('이현수'))
  if (lee) {
    console.log('Found Lee entry:', lee)
    console.log('Has worker_id?', lee.worker_id)
  } else {
    console.log('Lee not found in daily_report_workers via name match.')
  }
}

inspectWorkerEntries()
