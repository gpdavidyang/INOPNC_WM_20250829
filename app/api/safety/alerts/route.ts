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
    const { 
      title,
      message,
      severity = 'high', // critical, high, medium, low
      siteId,
      incidentType,
      location,
      affectedWorkers = []
    } = await request.json()

    // Check if user has permission to create safety alerts
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, site_id, organization_id')
      .eq('id', authResult.userId)
      .single()

    const role = profile?.role || authResult.role || ''

    if (!profile || !['admin', 'system_admin', 'site_manager', 'safety_manager'].includes(role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Validate site access
    if (role === 'site_manager' && profile.site_id !== siteId) {
      return NextResponse.json({ error: 'Cannot create alerts for other sites' }, { status: 403 })
    }

    // Create safety alert record
    const { data: safetyAlert, error: createError } = await supabase
      .from('safety_alerts')
      .insert({
        title,
        message,
        severity,
        site_id: siteId,
        incident_type: incidentType,
        location,
        affected_workers: affectedWorkers,
        created_by: authResult.userId,
        organization_id: profile.organization_id,
        status: 'active'
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating safety alert:', createError)
      return NextResponse.json({ error: 'Failed to create safety alert' }, { status: 500 })
    }

    // Get all workers at the site for notifications
    const { data: siteWorkers } = await supabase
      .from('profiles')
      .select('id, full_name, push_subscription')
      .eq('site_id', siteId)
      .eq('status', 'active')

    if (siteWorkers?.length) {
      // Create notifications for all site workers
      const notifications = siteWorkers.map((worker: unknown) => ({
        user_id: worker.id,
        type: severity === 'critical' ? 'error' : 'warning',
        title: `⚠️ ${title}`,
        message,
        related_entity_type: 'safety_alert',
        related_entity_id: safetyAlert.id,
        action_url: `/dashboard/safety/alerts/${safetyAlert.id}`,
        created_by: authResult.userId
      }))

      await supabase
        .from('notifications')
        .insert(notifications)

      // Send push notifications
      try {
        await notificationHelpers.sendSafetyAlert(
          [siteId],
          message,
          safetyAlert.id
        )
      } catch (error) {
        console.error('Failed to send push notifications:', error)
      }
    }

    return NextResponse.json({
      success: true,
      data: safetyAlert,
      message: 'Safety alert created and notifications sent'
    })

  } catch (error: unknown) {
    console.error('Safety alert creation error:', error)
    return NextResponse.json({ 
      error: 'Failed to create safety alert',
      details: error.message 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')
    const status = searchParams.get('status') || 'active'

    // Get user profile to check site access
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, site_id')
      .eq('id', authResult.userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const role = profile.role || authResult.role || ''

    // Build query
    let query = supabase
      .from('safety_alerts')
      .select(`
        *,
        site:sites(name),
        created_by_user:profiles!safety_alerts_created_by_fkey(full_name)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })

    // Filter by site if specified or if user is site-specific
    if (siteId) {
      query = query.eq('site_id', siteId)
    } else if (role === 'worker' || role === 'site_manager') {
      query = query.eq('site_id', profile.site_id)
    }

    const { data: alerts, error: fetchError } = await query

    if (fetchError) {
      console.error('Error fetching safety alerts:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch safety alerts' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      alerts: alerts || []
    })

  } catch (error: unknown) {
    console.error('Get safety alerts error:', error)
    return NextResponse.json({ 
      error: 'Failed to get safety alerts',
      details: error.message 
    }, { status: 500 })
  }
}
