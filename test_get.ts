import { createServiceRoleClient } from './lib/supabase/service-role'

async function test() {
  const supabase = createServiceRoleClient()
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
    console.log('Error:', error.message)
    console.log('Detail:', error.details)
    console.log('Hint:', error.hint)
  } else {
    console.log('Success! Data count:', data.length)
    console.log('Sample report:', JSON.stringify(data[0], null, 2))
  }
}

test()
