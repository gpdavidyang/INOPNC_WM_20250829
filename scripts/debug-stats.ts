import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debug() {
  const siteId = 'c028770c-99c1-4b72-9856-cf4c700300fc' // Just an example, need to find a real one

  // Find a site that has daily reports
  const { data: latestSites } = await supabase.from('sites').select('id, name').limit(10)
  console.log(
    'Sites:',
    latestSites?.map(s => `${s.name} (${s.id})`)
  )

  const { data: reports } = await supabase
    .from('daily_reports')
    .select('id, site_id, total_labor_hours, total_workers, work_content')
    .limit(10)
  console.log(
    'Daily Reports sample:',
    reports?.map(r => ({
      id: r.id,
      site_id: r.site_id,
      labor: r.total_labor_hours,
      workers: r.total_workers,
      hasContent: !!r.work_content,
    }))
  )

  if (reports && reports.length > 0) {
    const sId = reports[0].site_id
    console.log(`\nDebugging Site: ${sId}`)

    const { data: statsReports } = await supabase
      .from('daily_reports')
      .select('total_labor_hours, total_workers, work_content')
      .eq('site_id', sId)
    console.log(`Report count for site: ${statsReports?.length}`)

    const { data: workRecords } = await supabase.from('work_records').select('*').eq('site_id', sId)
    console.log(`Work records count for site: ${workRecords?.length}`)
    if (workRecords && workRecords.length > 0) {
      console.log('Work record sample:', workRecords[0])
    }
  }
}

debug()
