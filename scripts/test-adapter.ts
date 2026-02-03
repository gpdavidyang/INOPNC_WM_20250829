import { getSiteLaborSummary } from '@/lib/api/adapters/site-assignments'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function testAdapter() {
  const siteId = '0655796a-4731-45f4-8515-167445ddac0a'
  const targetName = '이현수'

  // Create client just for user ID lookup
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: user } = await supabase
    .from('profiles')
    .select('id')
    .eq('full_name', targetName)
    .single()
  const userId = user?.id
  console.log('User ID:', userId)

  if (userId) {
    console.log('Fetching summary...')
    const result = await getSiteLaborSummary(siteId, [userId])
    console.log('Result:', result)
  }
}

testAdapter()
