import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile with organization information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile lookup error:', {
        error: profileError,
        userId: user.id,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check if user has admin permissions
    if (!['admin', 'system_admin'].includes(profile.role)) {
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        details: 'Admin access required' 
      }, { status: 403 })
    }

    // Return profile data in expected format
    return NextResponse.json({
      id: profile.id,
      email: profile.email,
      name: profile.full_name || profile.name,
      full_name: profile.full_name,
      role: profile.role,
      status: profile.status,
      organization_id: profile.organization_id,
      organization: profile.organization,
      phone: profile.phone,
      created_at: profile.created_at,
      updated_at: profile.updated_at
    })

  } catch (error) {
    const errorDetails = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : { message: String(error), stack: 'N/A', name: 'Unknown' }

    console.error('Admin profile API error:', {
      ...errorDetails,
      timestamp: new Date().toISOString(),
      url: request.url
    })
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}