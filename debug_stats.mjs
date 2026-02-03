import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const siteId = 'ac0dfa74-184d-4816-8b48-80dc9bc70085'
  const { data, error } = await supabase
    .from('daily_reports')
    .select('id, work_date, total_labor_hours, site_id')
    .eq('site_id', siteId)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`Found ${data?.length} reports for site ${siteId}`)
  data?.forEach(r => {
    console.log(`Report ${r.id}: Date=${r.work_date}, LaborHours=${r.total_labor_hours}`)
  })
}

check()
