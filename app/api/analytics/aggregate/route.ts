import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'


export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', authResult.userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const { date } = body

    const aggregationDate = date || new Date().toISOString().split('T')[0]

    if (profile.role === 'system_admin') {
      const { error: rpcError } = await (supabase.rpc('run_daily_analytics_aggregation', {
        p_date: aggregationDate,
      } as unknown) as unknown)

      if (rpcError) {
        console.error('Error running full aggregation:', rpcError)
        return NextResponse.json({ error: 'Failed to run aggregation' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Analytics aggregation completed successfully',
        date: aggregationDate,
      })
    }

    if (!profile.organization_id) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { error: orgError } = await (supabase.rpc('run_daily_analytics_aggregation_for_org', {
      p_date: aggregationDate,
      p_organization_id: profile.organization_id,
      p_user_id: authResult.userId,
    } as unknown) as unknown)

    if (orgError) {
      console.error('Error running organization aggregation:', orgError)
      return NextResponse.json({ error: 'Failed to run aggregation' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Organization analytics aggregation completed successfully',
      date: aggregationDate,
    })
  } catch (error) {
    console.error('Analytics full aggregation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET endpoint to check aggregation status
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', authResult.userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const userRole = profile.role ?? authResult.role ?? 'worker'
    const restrictedOrgId = authResult.isRestricted ? authResult.restrictedOrgId ?? null : null
    const organizationId = restrictedOrgId ?? profile.organization_id ?? null

    if (!['admin', 'system_admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const today = new Date().toISOString().split('T')[0]

    let query = supabase
      .from('analytics_daily_stats')
      .select('stat_date, updated_at, site_id, organization_id')
      .eq('stat_date', today)
      .order('updated_at', { ascending: false })

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error checking aggregation status:', error)
      return NextResponse.json({ error: 'Failed to check status' }, { status: 500 })
    }

    // Count sites that have been aggregated today
    const aggregatedSites = new Set(data?.map((d: unknown) => d.site_id) || [])
    
    // Get total sites count
    let sitesQuery = supabase
      .from('sites')
      .select('id', { count: 'exact' })
      .eq('is_active', true)

    if (organizationId) {
      sitesQuery = sitesQuery.eq('organization_id', organizationId)
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
