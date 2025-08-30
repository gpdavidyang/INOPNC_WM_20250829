import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    console.log('Fetching available workers for site:', params.id)

    const siteId = params.id

    // Create service client for admin operations (bypasses RLS)
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get all workers not assigned to this site
    // First, get IDs of workers already assigned to this site
    const { data: assignedWorkers } = await serviceClient
      .from('site_workers')
      .select('user_id')
      .eq('site_id', siteId)
      .eq('is_active', true)

    const assignedUserIds = assignedWorkers?.map(w => w.user_id) || []

    // Get ALL profiles that are not admins (we'll include everyone who could potentially work on a site)
    let profilesQuery = serviceClient
      .from('profiles')
      .select('id, full_name, email, phone, role, company')
      .neq('role', 'admin') // Exclude only admins
      .order('full_name')

    // Exclude already assigned workers from profiles
    if (assignedUserIds.length > 0) {
      profilesQuery = profilesQuery.not('id', 'in', `(${assignedUserIds.join(',')})`)
    }

    const { data: profileWorkers, error: profilesError } = await profilesQuery
    
    if (profilesError) {
      console.error('Error fetching from profiles:', profilesError)
    }
    
    console.log('Profiles found:', profileWorkers?.length || 0)
    console.log('Sample profile:', profileWorkers?.[0])

    // Format profiles data
    const formattedWorkers = profileWorkers?.map(worker => ({
      id: worker.id,
      full_name: worker.full_name || 'Unknown',
      email: worker.email || '',
      phone: worker.phone || '',
      role: worker.role || 'worker',
      company: worker.company || ''
    })) || []
    
    console.log('Available workers formatted:', formattedWorkers.length)
    console.log('First few workers:', formattedWorkers.slice(0, 3))

    return NextResponse.json({
      success: true,
      data: formattedWorkers,
      total: formattedWorkers.length,
      site_id: siteId
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}