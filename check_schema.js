const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function check() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  console.log('Checking worker_assignments schema...')
  const { data: sample, error: sErr } = await supabase
    .from('worker_assignments')
    .select('*')
    .limit(1)
  if (sErr) console.error('Sample error:', sErr.message)
  console.log('Columns:', Object.keys(sample?.[0] || {}))

  const { error: insErr } = await supabase.from('worker_assignments').insert({
    worker_name: 'SchemaTest',
  })
  console.log('Insert error msg:', insErr?.message)
}
check()
