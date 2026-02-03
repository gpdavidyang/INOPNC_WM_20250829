import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function test() {
  const { data: records } = await supabase
    .from('work_records')
    .select('id, site_id, daily_report_id, user_id, labor_hours, work_hours')
    .limit(20)
  console.log('Work Records Sample:', records)
}

test()
