import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function check(tableName: string) {
  console.log(`Checking table: ${tableName}`)
  const { data, error } = await supabase.from(tableName).select('*').limit(1)
  if (error) {
    console.error(`Error:`, error)
  } else if (data && data.length > 0) {
    console.log(`Columns:`, Object.keys(data[0]))
  } else {
    console.log(`Table exists but is empty.`)
  }
}

async function run() {
  await check('worker_assignments')
  await check('work_records')
  await check('daily_reports')
  await check('daily_report_workers')
}

run()
