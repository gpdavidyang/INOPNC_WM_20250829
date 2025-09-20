import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth, getAuthForClient } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()
    const {
      title,
      content,
      priority = 'medium', // low, medium, high, urgent
      siteIds = [],
      targetRoles = [], // specific roles to notify
      expiresAt,
      attachments = [],
    } = await request.json()

    // Verify user authentication
    // Check if user has permission to create announcements
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, site_id, organization_id')
      .eq('id', authResult.userId)
      .single()

    if (!profile || !['admin', 'system_admin', 'site_manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Validate site access for site managers
    let targetSiteIds = siteIds
    if (profile.role === 'site_manager') {
      // Site managers can only announce to their own site
      targetSiteIds = [profile.site_id]
    }

    // Create announcement record
    const { data: announcement, error: createError } = await supabase
      .from('announcements')
      .insert({
        title,
        content,
        priority,
        target_sites: targetSiteIds,
        target_roles: targetRoles,
        created_by: authResult.userId,
        is_active: true,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating announcement:', createError)
      return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: announcement,
      message: 'Announcement created successfully',
    })
  } catch (error) {
    console.error('Announcement creation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create announcement',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')
    const status = searchParams.get('status') || 'active'
    const priority = searchParams.get('priority')

    // For unauthenticated users, return empty list to prevent 500 errors
    const authResult = await getAuthForClient(supabase)
    if (!authResult) {
      console.log('Announcements: User not authenticated, returning empty list')
      return NextResponse.json({
        success: true,
        announcements: [],
      })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, site_id')
      .eq('id', authResult.userId)
      .single()

    if (!profile) {
      console.log('Announcements: Profile not found, returning empty list')
      return NextResponse.json({
        success: true,
        announcements: [],
      })
    }

    // Build query with corrected column names
    let query = supabase.from('announcements').select('*').eq('is_active', true) // Use is_active instead of status

    // Filter by site using correct column name
    if (siteId) {
      query = query.contains('target_sites', [siteId])
    } else if (profile.role === 'worker' || profile.role === 'site_manager') {
      // Workers and site managers only see announcements for their site
      if (profile.site_id) {
        query = query.contains('target_sites', [profile.site_id])
      }
    }

    // Filter by priority
    if (priority) {
      query = query.eq('priority', priority)
    }

    // Filter by role if user is not admin
    if (!['admin', 'system_admin'].includes(profile.role || '')) {
      query = query.or(`target_roles.is.null,target_roles.cs.{${profile.role}}`)
    }

    query = query.order('created_at', { ascending: false })

    const { data: announcements, error: fetchError } = await query

    if (fetchError) {
      console.error('Error fetching announcements:', fetchError)
      // Return empty list instead of 500 to prevent frontend errors
      return NextResponse.json({
        success: true,
        announcements: [],
      })
    }

    return NextResponse.json({
      success: true,
      announcements: announcements || [],
    })
  } catch (error) {
    console.error('Get announcements error:', error)
    // Return empty list instead of 500 to prevent infinite error loops
    return NextResponse.json({
      success: true,
      announcements: [],
    })
  }
}
