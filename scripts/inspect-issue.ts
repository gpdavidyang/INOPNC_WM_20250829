import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function inspectLee() {
  // Search for Lee Hyun-soo
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .ilike('full_name', '%이현수%')
  console.log('Found users:', users)

  if (users && users.length > 0) {
    const userId = users[0].id
    // Check assignments
    const { data: assignments } = await supabase
      .from('site_assignments')
      .select('*')
      .eq('user_id', userId)
    console.log('Assignments:', assignments)

    // Check recent reports where labor is 0.1
    const { data: reports } = await supabase
      .from('daily_reports')
      .select('id, site_id, work_date, total_labor_hours, work_content')
      .order('created_at', { ascending: false })
      .limit(5)
    reports?.forEach(r => {
      // console.log(`Report ${r.id}: labor=${r.total_labor_hours}`, r.work_content)
      if (r.total_labor_hours > 0 && r.total_labor_hours < 1) {
        console.log('Found report with small labor:', r)
      }
    })
  }
}

inspectLee()
