import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectLatestReport() {
  console.log('Inspecting the most recent daily report...')

  const { data: reports, error: reportError } = await supabase
    .from('daily_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)

  if (reportError || !reports || reports.length === 0) {
    console.error('Error fetching latest report:', reportError)
    return
  }

  const report = reports[0]
  console.log('\n--- Daily Report Details ---')
  console.log('ID:', report.id)
  console.log('Work Date:', report.work_date)
  console.log('Status:', report.status)
  console.log('Total Workers (column):', report.total_workers)
  console.log('Legacy Fields:')
  console.log('  member_name:', report.member_name)
  console.log('  process_type:', report.process_type)
  console.log('  component_name:', report.component_name)
  console.log('  work_process:', report.work_process)
  console.log('  work_section:', report.work_section)
  console.log('V2 Fields:')
  console.log('  work_content:', JSON.stringify(report.work_content, null, 2))
  console.log('  location_info:', JSON.stringify(report.location_info, null, 2))

  console.log('\n--- Related Data ---')

  const { data: assignments } = await supabase
    .from('worker_assignments')
    .select('*')
    .eq('daily_report_id', report.id)
  console.log('Worker Assignments Count:', assignments?.length || 0)
  if (assignments?.length) {
    assignments.forEach(a => console.log(`  - ${a.worker_name}: ${a.hours}h`))
  }

  const { data: legacyWorkers } = await supabase
    .from('daily_report_workers')
    .select('*')
    .eq('daily_report_id', report.id)
  console.log('Legacy Workers Count:', legacyWorkers?.length || 0)

  const { data: workRecords } = await supabase
    .from('work_records')
    .select('*')
    .eq('daily_report_id', report.id)
  console.log('Work Records Count:', workRecords?.length || 0)

  const { data: materials } = await supabase
    .from('material_usage')
    .select('*')
    .eq('daily_report_id', report.id)
  console.log('Material Usage Count:', materials?.length || 0)
  if (materials?.length) {
    materials.forEach(m =>
      console.log(`  - ${m.material_name}: ${m.quantity_val || m.quantity} ${m.unit}`)
    )
  }
}

inspectLatestReport()
