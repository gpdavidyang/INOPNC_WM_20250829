import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
// Better to use service role if available, but anon might work if RLS allows public read or we login.
// Ideally usage of SUPABASE_SERVICE_ROLE_KEY if in .env.local

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('Error: Missing Supabase URL or Service Key in .env.local')
  console.log('URL:', supabaseUrl)
  console.log(
    'Service Key starts with:',
    supabaseServiceKey ? supabaseServiceKey.substring(0, 5) : 'null'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function inspectLatestReport() {
  console.log('Fetching latest daily_reports...')

  const { data, error } = await supabase
    .from('daily_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Error fetching report:', error)
    return
  }

  if (!data || data.length === 0) {
    console.log('No reports found.')
    return
  }

  const report = data[0]
  console.log('--- Latest Report Debug Info ---')
  console.log('ID:', report.id)
  console.log('Work Date:', report.work_date)
  console.log('Site ID:', report.site_id)
  console.log('Status:', report.status)
  console.log('Available keys:', Object.keys(report))
  console.log('Component Name:', report.component_name)
  console.log('Work Process:', report.work_process)
  console.log('Work Section:', report.work_section)
  console.log('--------------------------------')
  console.log('Raw [work_content] column:', JSON.stringify(report.work_content, null, 2))
  console.log('Raw [location_info] column:', JSON.stringify(report.location_info, null, 2))
  console.log(
    'Raw [additional_notes] column:',
    typeof report.additional_notes,
    report.additional_notes
  )
  console.log('--------------------------------')
}

inspectLatestReport()
