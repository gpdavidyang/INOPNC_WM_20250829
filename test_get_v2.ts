import { createServiceRoleClient } from './lib/supabase/service-role'

async function test() {
  try {
    const supabase = createServiceRoleClient()
    console.log('Testing query...')
    const { data, error } = await supabase
      .from('daily_reports')
      .select(
        `
      *,
      sites(id, name),
      profiles:created_by(id, full_name),
      worker_assignments(*, profiles(id, full_name, role)),
      material_usage(*)
    `
      )
      .limit(1)

    if (error) {
      console.error('Query Error:', JSON.stringify(error, null, 2))
    } else {
      console.log('Query Success!')
      console.log('Data count:', data?.length)
    }
  } catch (err: any) {
    console.error('Script Runtime Error:', err.message)
  }
}

test()
