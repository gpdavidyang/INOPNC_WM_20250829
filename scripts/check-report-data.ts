import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkReport() {
  const { data: reports, error } = await supabase
    .from('daily_reports')
    .select('id, work_date, site_id, total_workers, total_labor_hours, work_content')
    .ilike('work_date', '2026-01-31')
    .limit(5)

  if (error) {
    console.error('Error:', error)
    return
  }

  for (const r of reports || []) {
    const { data: assignments } = await supabase
      .from('worker_assignments')
      .select('hours, labor_hours')
      .eq('daily_report_id', r.id)

    console.log('---')
    console.log('ID:', r.id)
    console.log('Date:', r.work_date)
    console.log('Total Workers (DB):', r.total_workers)
    console.log('Total Labor Hours (DB):', r.total_labor_hours)
    console.log('Assignments Count:', assignments?.length)
    console.log(
      'Assignments Sum (hours):',
      assignments?.reduce((sum, a) => sum + (Number(a.hours) || 0), 0)
    )
    console.log(
      'Assignments Sum (labor_hours):',
      assignments?.reduce((sum, a) => sum + (Number(a.labor_hours) || 0), 0)
    )
    if (r.work_content) {
      let content = r.work_content
      if (typeof content === 'string') content = JSON.parse(content)
      console.log('JSON Workers Count:', content.workers?.length || content.worker_entries?.length)
    }
  }
}

checkReport()
