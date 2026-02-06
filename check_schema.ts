import { createServiceRoleClient } from './lib/supabase/service-role'

async function check() {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase.rpc('get_table_info', { t_name: 'worker_assignments' })
  if (error) {
    // If RPC fails, try information_schema via raw SQL if possible,
    // but usually we don't have direct SQL access.
    // We can try to fetch one row and see all columns.
    const { data: sample } = await supabase.from('worker_assignments').select('*').limit(1)
    console.log('Columns in worker_assignments:', Object.keys(sample?.[0] || {}))

    // Try to insert a dummy row and see the error
    const { error: insErr } = await supabase.from('worker_assignments').insert({
      daily_report_id: '00000000-0000-0000-0000-000000000000',
      worker_name: 'Test',
    })
    console.log('Test Insert Error (shows required columns):', insErr?.message)
  } else {
    console.log('Table Info:', data)
  }
}
check()
