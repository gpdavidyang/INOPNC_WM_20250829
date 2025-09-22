import { createClient } from '@/lib/supabase/server'
import { getAuthForClient } from '@/lib/auth/ultra-simple'
;('use server')

export async function getSites() {
  // console.log('🔍 getSites called - starting execution')

  try {
    const supabase = createClient()

    // Step 1: Check authentication
    const auth = await getAuthForClient(supabase)
    if (!auth) {
      console.error('❌ Authentication failed in getSites: No auth context')
      return { success: false, error: 'User not authenticated' }
    }

    // console.log('✅ User authenticated:', auth.userId)

    // Step 2: Try to get sites with detailed logging
    // console.log('📍 Querying sites table...')
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('*')
      .order('name', { ascending: true })

    // Step 3: Log query results
    // console.log('📊 Sites query result:', {
    //   success: !sitesError,
    //   sitesCount: sites?.length || 0,
    //   error: sitesError?.message,
    //   sites: sites?.map(s => ({ id: s.id, name: s.name })) || []
    // })

    if (sitesError) {
      console.error('❌ Database error in getSites:', sitesError)
      return { success: false, error: sitesError.message }
    }

    // Step 4: Validate results
    if (!sites || sites.length === 0) {
      console.warn('⚠️ No sites found in database')
      return { success: true, data: [] }
    }

    // console.log('✅ Successfully fetched', sites.length, 'sites')
    return { success: true, data: sites }
  } catch (error) {
    console.error('💥 Unexpected error in getSites:', error)
    return {
      success: false,
      error: `Failed to fetch sites: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}
