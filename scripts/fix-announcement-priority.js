const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  console.log('🔧 Normalizing announcement priority values...')

  const { data, error } = await supabase.from('announcements').select('id, priority')

  if (error) {
    throw error
  }

  if (!data || data.length === 0) {
    console.log('✅ No invalid priorities found.')
    return
  }

  const allowed = new Set(['low', 'normal', 'high', 'critical', 'urgent'])
  const invalidRows = data.filter(row => !row.priority || !allowed.has(row.priority))

  if (invalidRows.length === 0) {
    console.log('✅ All priorities already valid.')
    return
  }

  console.log(`Found ${invalidRows.length} announcement rows with invalid priority.`)

  for (const row of invalidRows) {
    const { error: updateError } = await supabase
      .from('announcements')
      .update({ priority: 'normal' })
      .eq('id', row.id)
    if (updateError) {
      console.error(`❌ Failed to update announcement ${row.id}:`, updateError)
      throw updateError
    }
  }

  console.log('✅ All invalid priorities reset to "medium". Re-run the migration afterwards.')
}

main().catch(err => {
  console.error('Normalization script failed:', err)
  process.exit(1)
})
