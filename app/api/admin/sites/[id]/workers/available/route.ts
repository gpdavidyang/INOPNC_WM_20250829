import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (authResult.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    const supabase = createClient()
    
    console.log('Fetching available workers for site:', params.id)

    const siteId = params.id

    // Get all workers not assigned to this site
    // First, get IDs of workers already assigned to this site
    const { data: assignedWorkers } = await supabase
      .from('site_assignments')
      .select('user_id')
      .eq('site_id', siteId)
      .eq('is_active', true)

    const assignedUserIds = assignedWorkers?.map((w: unknown) => w.user_id) || []

    // Get ALL profiles (including admins who might work on sites)
    let profilesQuery = supabase
      .from('profiles')
      .select('id, full_name, email, phone, role, company')
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
    const formattedWorkers = profileWorkers?.map((worker: unknown) => ({
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
