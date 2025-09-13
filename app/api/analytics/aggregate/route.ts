import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Only system admins can run full aggregation
    if (profile.role !== 'system_admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { date } = body

    // Run the daily aggregation for all sites
    const { error } = await (supabase.rpc('run_daily_analytics_aggregation', {
      p_date: date || new Date().toISOString().split('T')[0]
    } as any) as any)

    if (error) {
      console.error('Error running full aggregation:', error)
      return NextResponse.json({ error: 'Failed to run aggregation' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Analytics aggregation completed successfully',
      date: date || new Date().toISOString().split('T')[0]
    })

  } catch (error) {
    console.error('Analytics full aggregation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check aggregation status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check permissions
    if (!['admin', 'system_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get the latest aggregation status
    const today = new Date().toISOString().split('T')[0]
    
    let query = supabase
      .from('analytics_daily_stats')
      .select('stat_date, updated_at, site_id')
      .eq('stat_date', today)
      .order('updated_at', { ascending: false })

    if (profile.role !== 'system_admin') {
      query = query.eq('organization_id', profile.organization_id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error checking aggregation status:', error)
      return NextResponse.json({ error: 'Failed to check status' }, { status: 500 })
    }

    // Count sites that have been aggregated today
    const aggregatedSites = new Set(data?.map((d: any) => d.site_id) || [])
    
    // Get total sites count
    let sitesQuery = supabase
      .from('sites')
      .select('id', { count: 'exact' })
      .eq('is_active', true)

    if (profile.role !== 'system_admin') {
      sitesQuery = sitesQuery.eq('organization_id', profile.organization_id)
    }

    const { count: totalSites } = await sitesQuery

    const lastUpdate = data && data.length > 0 ? data[0].updated_at : null

    return NextResponse.json({
      status: {
        date: today,
        aggregatedSites: aggregatedSites.size,
        totalSites: totalSites || 0,
        isComplete: aggregatedSites.size === totalSites,
        lastUpdate,
        completionRate: totalSites ? ((aggregatedSites.size / totalSites) * 100).toFixed(2) : 0
      }
    })

  } catch (error) {
    console.error('Analytics status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}