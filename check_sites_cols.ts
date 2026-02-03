import { createServiceRoleClient } from './lib/supabase/service-role.ts'

async function checkColumns() {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase.from('sites').select('*').limit(1)
  if (error) {
    console.error('Error:', error)
    return
  }
  if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]))
  } else {
    console.log('No data found in sites table')
    // Try to get one even if deleted
    const { data: data2 } = await supabase.from('sites').select('*').limit(1)
    if (data2 && data2.length > 0) {
      console.log('Columns (including potentially deleted):', Object.keys(data2[0]))
    }
  }
}

checkColumns()
