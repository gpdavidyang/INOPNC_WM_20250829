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
  const { data, error } = await supabase
    .from('daily_reports')
    .select('id, work_date, site_id, sites(name)')
    .limit(20)

  if (error) {
    console.error('Error:', error)
    return
  }

  data?.forEach(r => {
    console.log(
      `Report ${r.id}: Date=${r.work_date}, SiteID=${r.site_id}, SiteName=${r.sites?.name}`
    )
  })
}

check()
