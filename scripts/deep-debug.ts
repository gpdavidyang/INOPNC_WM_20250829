import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debug() {
  const siteId = '0655796a-4731-45f4-8515-167445ddac0a'

  const { data: report } = await supabase
    .from('daily_reports')
    .select('*')
    .eq('site_id', siteId)
    .single()
  console.log('Report:', {
    id: report?.id,
    total_workers: report?.total_workers,
    total_labor_hours: report?.total_labor_hours,
    work_content: !!report?.work_content,
  })

  if (report) {
    const { data: rw } = await supabase
      .from('daily_report_workers')
      .select('*')
      .eq('daily_report_id', report.id)
    console.log('daily_report_workers:', rw)

    const { data: wr } = await supabase
      .from('work_records')
      .select('*')
      .eq('daily_report_id', report.id)
    console.log('work_records:', wr)

    const { data: wa } = await supabase
      .from('worker_assignments')
      .select('*')
      .eq('daily_report_id', report.id)
    console.log('worker_assignments:', wa)
  }
}

debug()
