import { createServiceRoleClient } from './lib/supabase/service-role'

async function check() {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase.rpc('get_table_info', { t_name: 'daily_reports' })
  // If get_table_info doesn't exist, we can try to select from information_schema
  const { data: cols, error: cErr } = await supabase.from('daily_reports').select('*').limit(0)
  console.log('Columns:', Object.keys(cols?.[0] || {}))
}
check()
