import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Helper function to check if table exists
async function tableExists(supabase: any, tableName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .maybeSingle()
    
    return !error && !!data
  } catch {
    return false
  }
}

// GET endpoint to subscribe to real-time analytics events
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile with better error handling
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, organization:organizations(*)')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile lookup error in realtime analytics:', {
        error: profileError,
        userId: user.id,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check permissions
    if (!['site_manager', 'admin', 'system_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if required analytics tables exist
    const analyticsEventsExists = await tableExists(supabase, 'analytics_events')
    const analyticsMetricsExists = await tableExists(supabase, 'analytics_metrics')
    
    if (!analyticsEventsExists || !analyticsMetricsExists) {
      console.error('Analytics tables missing for realtime subscription:', {
        analyticsEventsExists,
        analyticsMetricsExists
      })
      return NextResponse.json({ 
        error: 'Analytics system not initialized',
        details: 'Required analytics tables are missing'
      }, { status: 503 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const siteId = searchParams.get('siteId')

    // For site managers, verify access if site_members table exists
    if (profile.role === 'site_manager' && siteId) {
      const siteMembersExists = await tableExists(supabase, 'site_members')
      if (siteMembersExists) {
        const { data: siteAccess, error: siteAccessError } = await supabase
          .from('site_members')
          .select('site_id')
          .eq('user_id', user.id)
          .eq('site_id', siteId)
          .eq('role', 'site_manager')
          .single()

        if (siteAccessError) {
          console.warn('Site access verification failed, allowing org-level access:', siteAccessError)
        } else if (!siteAccess) {
          return NextResponse.json({ error: 'Access denied to this site' }, { status: 403 })
        }
      }
    }

    // Return subscription configuration
    // The actual real-time subscription will be handled on the client side
    return NextResponse.json({
      channel: `analytics:${profile.organization_id}${siteId ? `:${siteId}` : ''}`,
      tables: ['analytics_events', 'analytics_metrics'],
      filters: {
        organization_id: profile.organization_id,
        site_id: siteId
      },
      permissions: {
        canSubscribe: true,
        role: profile.role
      }
    })

  } catch (error) {
    console.error('Analytics realtime setup error:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
      timestamp: new Date().toISOString(),
      url: request.url,
      method: 'GET'
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST endpoint to emit real-time analytics events
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if request has a body
    const contentLength = request.headers.get('content-length')
    if (!contentLength || contentLength === '0') {
      return NextResponse.json({ error: 'Request body is required' }, { status: 400 })
    }
    
    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }
    const { eventType, siteId, eventData } = body
    
    // Validate required fields
    if (!eventType) {
      return NextResponse.json({ error: 'eventType is required' }, { status: 400 })
    }
    
    // Check if this is a RUM event (these can be anonymous)
    const isRumEvent = eventType.startsWith('rum_')
    
    let user = null
    let profile = null
    
    if (!isRumEvent) {
      // For non-RUM events, require authentication
      const { data: userData, error: authError } = await supabase.auth.getUser()
      if (authError || !userData.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      user = userData.user

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role, organization_id')
        .eq('id', user.id)
        .single()

      if (profileError || !profileData) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }
      profile = profileData
    } else {
      // For RUM events, try to get user if available but don't require it
      const { data: userData } = await supabase.auth.getUser()
      if (userData?.user) {
        user = userData.user
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role, organization_id')
          .eq('id', user.id)
          .single()
        profile = profileData
      }
    }

    // Validate event type
    const validEventTypes = [
      'report_submitted',
      'report_approved',
      'attendance_marked',
      'material_requested',
      'equipment_checked_out',
      'issue_reported',
      'metric_updated',
      // RUM event types
      'rum_page_view',
      'rum_session_update',
      'rum_error',
      'rum_unhandled_rejection',
      'rum_interaction',
      'rum_resource_timing'
    ]

    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
    }

    // Check if analytics_events table exists before inserting
    const analyticsEventsExists = await tableExists(supabase, 'analytics_events')
    if (!analyticsEventsExists) {
      console.error('Analytics events table does not exist for event creation')
      return NextResponse.json({ 
        error: 'Analytics system not initialized',
        details: 'analytics_events table is missing'
      }, { status: 503 })
    }

    // Insert analytics event with graceful error handling
    try {
      const insertData = {
        event_type: String(eventType),
        organization_id: profile?.organization_id || null,
        site_id: siteId || null,
        user_id: user?.id || null,
        event_data: eventData || {},
        event_timestamp: new Date().toISOString(),
        metadata: {
          userAgent: request.headers.get('user-agent') || 'unknown',
          ip: request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              '0.0.0.0',
          isRumEvent: Boolean(isRumEvent),
        }
      }

      const { data, error } = await supabase
        .from('analytics_events')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        const errorInfo = error instanceof Error ? {
          message: error.message,
          code: (error as any).code,
          details: (error as any).details,
          hint: (error as any).hint
        } : { message: String(error) }

        console.error('Error creating analytics event:', {
          ...errorInfo,
          eventType,
          siteId,
          organizationId: profile?.organization_id,
          timestamp: new Date().toISOString()
        })

        // For RUM events, return success to avoid breaking monitoring
        if (isRumEvent) {
          return NextResponse.json({ 
            success: true, 
            warning: 'Event logged but storage may have failed',
            event: { id: 'failed-storage', event_type: eventType }
          })
        }

        // Handle specific database errors
        if (errorInfo.code === '23503') {
          return NextResponse.json({ 
            error: 'Invalid reference data',
            details: 'Referenced organization or site does not exist'
          }, { status: 400 })
        }

        if (errorInfo.code === '42P01') {
          return NextResponse.json({ 
            error: 'Analytics system not properly initialized',
            details: 'Required database tables are missing'
          }, { status: 503 })
        }

        return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
      }

      // Successfully inserted event
      const insertedEvent = data
    } catch (insertError) {
      console.error('Analytics event insertion exception:', {
        error: insertError.message,
        stack: insertError.stack,
        eventType,
        isRumEvent,
        timestamp: new Date().toISOString()
      })

      // For RUM events, always return success to avoid breaking performance monitoring
      if (isRumEvent) {
        return NextResponse.json({ 
          success: true, 
          warning: 'Event processing encountered an error',
          event: { id: 'exception-occurred', event_type: eventType }
        })
      }

      return NextResponse.json({ error: 'Failed to process event' }, { status: 500 })
    }

    // Trigger metric recalculation if needed (only for authenticated events)
    if (profile && ['report_submitted', 'report_approved', 'attendance_marked'].includes(eventType)) {
      // Run aggregation in the background (fire and forget)
      supabase.rpc('aggregate_daily_analytics', {
        p_organization_id: profile.organization_id,
        p_site_id: siteId,
        p_date: new Date().toISOString().split('T')[0]
      }).then(() => {
        console.log('Analytics aggregation triggered')
      }).catch((err) => {
        console.error('Analytics aggregation failed:', err)
      })
    }

    return NextResponse.json({
      success: true,
      event: data
    })

  } catch (error) {
    const errorInfo = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    } : {
      message: String(error),
      stack: 'No stack trace available',
      name: 'Unknown',
      cause: undefined
    }
    
    console.error('Analytics event creation error:', {
      ...errorInfo,
      timestamp: new Date().toISOString(),
      url: request.url,
      method: 'POST'
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}