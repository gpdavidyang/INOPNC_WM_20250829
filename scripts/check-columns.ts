import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSchema() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'daily_reports' })

  if (error) {
    // If RPC doesn't exist, try a simple select with everything
    const { data: row } = await supabase.from('daily_reports').select('*').limit(1).single()
    if (row) {
      console.log('Columns:', Object.keys(row))
    } else {
      console.error('Error fetching row:', error)
    }
    return
  }
  console.log('Columns:', data)
}

checkSchema()
