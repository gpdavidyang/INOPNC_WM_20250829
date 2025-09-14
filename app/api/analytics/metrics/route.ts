import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'


export const dynamic = 'force-dynamic'

// Helper function to check if table exists
async function tableExists(supabase: unknown, tableName: string): Promise<boolean> {
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

    // Check permissions
    if (!['site_manager', 'admin', 'system_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if analytics_metrics table exists
    const metricsTableExists = await tableExists(supabase, 'analytics_metrics')
    if (!metricsTableExists) {
      console.error('Analytics metrics table does not exist')
      return NextResponse.json({ 
        error: 'Analytics system not initialized',
        details: 'Please run database migrations'
      }, { status: 503 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const metricType = searchParams.get('type')
    const siteId = searchParams.get('siteId')
    const days = Math.min(Math.max(parseInt(searchParams.get('days') || '30'), 1), 365) // Clamp between 1-365
    const organizationId = searchParams.get('organizationId') || profile.organization_id

    // Validate metric type
    const validMetricTypes = [
      'daily_report_completion',
      'material_usage',
      'attendance_rate',
      'equipment_utilization',
      'site_productivity',
      'safety_incidents',
      'approval_time',
      'worker_efficiency',
      // Web Vitals metrics
      'web_vitals_cls',
      'web_vitals_fid',
      'web_vitals_fcp',
      'web_vitals_lcp',
      'web_vitals_ttfb',
      'api_response_time'
    ]

    if (metricType && !validMetricTypes.includes(metricType)) {
      return NextResponse.json({ error: 'Invalid metric type' }, { status: 400 })
    }

    // Build query with safer date handling
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    let query = supabase
      .from('analytics_metrics')
      .select('*')
      .gte('metric_date', startDate.toISOString().split('T')[0])
      .order('metric_date', { ascending: false })

    // Apply filters based on role and permissions
    if (profile.role !== 'system_admin') {
      query = query.eq('organization_id', profile.organization_id)
    } else if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    if (metricType) {
      query = query.eq('metric_type', metricType)
    }

    if (siteId) {
      query = query.eq('site_id', siteId)
    }

    // For site managers, filter by their sites if site_members table exists
    if (profile.role === 'site_manager') {
      const siteMembersExists = await tableExists(supabase, 'site_members')
      if (siteMembersExists) {
        const { data: assignedSites, error: sitesError } = await supabase
          .from('site_members')
          .select('site_id')
          .eq('user_id', user.id)
          .eq('role', 'site_manager')

        if (sitesError) {
          console.warn('Site membership lookup failed, falling back to organization filter:', sitesError)
          // Fall back to organization-level access
        } else if (assignedSites && assignedSites.length > 0) {
          const siteIds = assignedSites.map((s: unknown) => s.site_id)
          query = query.in('site_id', siteIds)
        } else {
          // Site manager with no assigned sites - return empty result
          return NextResponse.json({
            data: [],
            count: 0,
            filters: {
              type: metricType,
              siteId,
              days,
              organizationId: profile.organization_id
            }
          })
        }
      }
    }

    const { data, error } = await query

    if (error) {
      const errorInfo = error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause,
        code: (error as unknown).code,
        details: (error as unknown).details
      } : {
        message: String(error),
        stack: 'No stack trace available',
        name: 'Unknown',
        cause: undefined,
        code: 'UNKNOWN',
        details: 'No additional details'
      }
      
      console.error('Error fetching analytics metrics:', {
        ...errorInfo,
        timestamp: new Date().toISOString(),
        url: request.url,
        method: 'GET',
        filters: {
          metricType,
          siteId,
          days,
          organizationId,
          userRole: profile?.role
        }
      })

      // Provide more specific error messages
      if (errorInfo.code === '42P01') {
        return NextResponse.json({ 
          error: 'Analytics system not properly initialized',
          details: 'Required database tables are missing'
        }, { status: 503 })
      }

      return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 })
    }

    // Group metrics by type if no specific type requested
    const groupedMetrics = metricType ? data : data?.reduce((acc: unknown, metric: unknown) => {
      if (!acc[metric.metric_type]) {
        acc[metric.metric_type] = []
      }
      acc[metric.metric_type].push(metric)
      return acc
    }, {} as Record<string, any[]>)

    return NextResponse.json({
      data: metricType ? data : groupedMetrics,
      count: data?.length || 0,
      filters: {
        type: metricType,
        siteId,
        days,
        organizationId: profile.role === 'system_admin' ? organizationId : profile.organization_id
      }
    })

  } catch (error) {
    const errorDetails = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : { message: String(error), stack: 'N/A', name: 'Unknown' }

    console.error('Analytics metrics error:', {
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

// POST endpoint for storing performance metrics and triggering aggregation
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
    
    // Check if analytics_metrics table exists
    const metricsTableExists = await tableExists(supabase, 'analytics_metrics')
    if (!metricsTableExists) {
      console.error('Analytics metrics table does not exist for POST operation')
      return NextResponse.json({ 
        error: 'Analytics system not initialized',
        details: 'Please run database migrations'
      }, { status: 503 })
    }
    
    // Check if this is a performance metric submission (Web Vitals, custom metrics, etc.)
    if (body.type && ['web_vitals', 'custom_metric', 'api_performance', 'performance_summary'].includes(body.type)) {
      // Handle performance metric storage with graceful fallbacks
      const {
        type,
        metric,
        value,
        rating,
        delta,
        id,
        navigationType,
        url,
        timestamp,
        endpoint,
        duration,
        unit
      } = body

      // Get current user's organization (if available) with better error handling
      const { data: { user } } = await supabase.auth.getUser()
      let organizationId = null
      
      if (user) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()
          
          if (profileError) {
            console.warn('Profile lookup failed for performance metric:', profileError.message)
          } else {
            organizationId = profile?.organization_id
          }
        } catch (profileError) {
          console.warn('Profile lookup exception for performance metric:', profileError)
        }
      }

      // Graceful metric storage with better error handling
      try {
        let insertData = null

        // Handle performance summary (from performance-metrics.ts)
        if (type === 'performance_summary') {
          // Log the summary but don't store it - just acknowledge receipt
          console.debug('Performance summary received:', {
            timestamp: timestamp || new Date().toISOString(),
            dataKeys: body.data ? Object.keys(body.data) : []
          })
          
          // Return success immediately - no database storage needed
          return NextResponse.json({ 
            success: true,
            message: 'Performance summary logged'
          })
        }

        // Store Web Vitals metrics
        if (type === 'web_vitals' && metric && value !== undefined) {
          insertData = {
            metric_type: `web_vitals_${metric.toLowerCase()}`,
            organization_id: organizationId,
            metric_date: new Date().toISOString().split('T')[0],
            metric_value: Number(value) || 0,
            metric_count: 1,
            dimensions: {
              rating: rating || 'unknown',
              delta: delta || 0,
              navigationType: navigationType || 'unknown',
              url: url ? (typeof url === 'string' ? new URL(url).pathname : String(url)) : null,
            },
            metadata: {
              id: id || null,
              timestamp: timestamp || new Date().toISOString(),
              userAgent: request.headers.get('user-agent') || 'unknown',
            }
          }
        }

        // Store custom performance metrics
        if (type === 'custom_metric' && metric && value !== undefined) {
          insertData = {
            metric_type: String(metric),
            organization_id: organizationId,
            metric_date: new Date().toISOString().split('T')[0],
            metric_value: Number(value) || 0,
            metric_count: 1,
            dimensions: {
              endpoint: endpoint || null,
              unit: unit || null,
              url: url ? (typeof url === 'string' ? new URL(url).pathname : String(url)) : null,
            },
            metadata: {
              timestamp: timestamp || new Date().toISOString(),
              userAgent: request.headers.get('user-agent') || 'unknown',
            }
          }
        }

        // Store API performance metrics
        if (type === 'api_performance' && endpoint && duration !== undefined) {
          insertData = {
            metric_type: 'api_response_time',
            organization_id: organizationId,
            metric_date: new Date().toISOString().split('T')[0],
            metric_value: Number(duration) || 0,
            metric_count: 1,
            dimensions: {
              endpoint: String(endpoint),
              status: body.status || 200,
              method: body.method || 'GET',
            },
            metadata: {
              timestamp: timestamp || new Date().toISOString(),
              userAgent: request.headers.get('user-agent') || 'unknown',
            }
          }
        }

        // Insert the metric if we have data
        if (insertData) {
          const { error } = await supabase
            .from('analytics_metrics')
            .insert(insertData)

          if (error) {
            console.error('Error storing performance metric:', {
              error: error.message,
              code: error.code,
              details: error.details,
              type,
              metric,
              timestamp: new Date().toISOString()
            })
            
            // Return success even if storage fails to prevent client errors
            // Log the error but don't block the user experience
            return NextResponse.json({ 
              success: true, 
              warning: 'Metric logged but storage may have failed' 
            })
          }
        }

        return NextResponse.json({ success: true })
      } catch (metricError) {
        console.error('Performance metric storage exception:', {
          error: metricError?.message || 'Unknown error',
          stack: metricError?.stack,
          type,
          metric,
          timestamp: new Date().toISOString()
        })
        
        // Return success to avoid breaking client-side performance monitoring
        return NextResponse.json({ 
          success: true, 
          warning: 'Metric processing encountered an error' 
        })
      }
    }

    // Handle manual aggregation trigger (existing functionality)
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

    // Only admins can trigger manual aggregation
    if (!['admin', 'system_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { date, siteId } = body

    // Check if aggregation function exists before calling
    try {
      const { error } = await (supabase.rpc('aggregate_daily_analytics', {
        p_organization_id: profile.organization_id,
        p_site_id: siteId || null,
        p_date: date || new Date().toISOString().split('T')[0]
      } as unknown) as unknown)

      if (error) {
        const errorInfo = error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
          cause: error.cause,
          code: (error as unknown).code,
          hint: (error as unknown).hint
        } : {
          message: String(error),
          stack: 'No stack trace available',
          name: 'Unknown',
          cause: undefined,
          code: 'UNKNOWN',
          hint: 'No hint available'
        }
        
        console.error('Error running aggregation RPC:', {
          ...errorInfo,
          timestamp: new Date().toISOString(),
          url: request.url,
          method: 'POST',
          rpcFunction: 'aggregate_daily_analytics',
          parameters: {
            p_organization_id: profile.organization_id,
            p_site_id: siteId || null,
            p_date: date || new Date().toISOString().split('T')[0]
          }
        })

        // Provide more specific error messages
        if (errorInfo.code === '42883') {
          return NextResponse.json({ 
            error: 'Analytics aggregation function not available',
            details: 'Please ensure all database functions are properly installed'
          }, { status: 503 })
        }

        return NextResponse.json({ error: 'Failed to aggregate metrics' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Metrics aggregated successfully'
      })
    } catch (rpcError) {
      console.error('RPC call failed:', rpcError)
      return NextResponse.json({ 
        error: 'Aggregation service unavailable',
        details: 'Analytics aggregation functions are not properly installed'
      }, { status: 503 })
    }

  } catch (error) {
    const errorDetails = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : { message: String(error), stack: 'N/A', name: 'Unknown' }

    console.error('Analytics metrics error:', {
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
