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
  const { data, error } = await supabase.from('daily_reports').select('*').limit(1)
  if (error) {
    console.error('Error:', error)
    return
  }
  if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]))
  } else {
    console.log('No reports found')
  }
}

check()
