import { createServiceRoleClient } from './lib/supabase/service-role'

async function inspect() {
  const supabase = createServiceRoleClient()

  console.log('--- Latest Daily Report ---')
  const { data: reports, error: rErr } = await supabase
    .from('daily_reports')
    .select('id, site_id, work_date, total_workers, total_labor_hours, created_at')
    .order('created_at', { ascending: false })
    .limit(1)

  if (rErr) {
    console.error('Report Fetch Error:', rErr)
    return
  }

  if (!reports || reports.length === 0) {
    console.log('No reports found.')
    return
  }

  const report = reports[0]
  console.log(JSON.stringify(report, null, 2))

  console.log('--- Worker Assignments for this report ---')
  const { data: assignments, error: aErr } = await supabase
    .from('worker_assignments')
    .select('*')
    .eq('daily_report_id', report.id)

  if (aErr) {
    console.error('Assignments Fetch Error:', aErr)
  } else {
    console.log(JSON.stringify(assignments, null, 2))
  }
}

inspect()
