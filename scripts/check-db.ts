import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  console.log('Checking database content...')

  const { data: reports, error: reportError } = await supabase
    .from('daily_reports')
    .select('id, work_date, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  if (reportError) {
    console.error('Error fetching reports:', reportError)
    return
  }

  console.log(`Found ${reports.length} recent reports.`)

  for (const report of reports) {
    console.log(`\nReport ID: ${report.id} (${report.work_date})`)

    const { data: materials } = await supabase
      .from('material_usage')
      .select('*')
      .eq('daily_report_id', report.id)

    const { data: assignments } = await supabase
      .from('worker_assignments')
      .select('*')
      .eq('daily_report_id', report.id)

    console.log(`- Materials: ${materials?.length || 0}`)
    if (materials?.length) {
      materials.forEach(m =>
        console.log(`  * ${m.material_name}: ${m.quantity_val || m.quantity} ${m.unit}`)
      )
    }

    console.log(`- Assignments: ${assignments?.length || 0}`)
    if (assignments?.length) {
      assignments.forEach(a => console.log(`  * ${a.worker_name}: ${a.hours} hours`))
    }
  }
}

checkData()
