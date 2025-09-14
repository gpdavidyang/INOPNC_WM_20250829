import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'


// Simple wrapper for API monitoring
function withApiMonitoring(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    return handler(request)
  }
}

interface SessionData {
  activeUsers: number
  totalSessions: number
  avgSessionDuration: number
  errorRate: number
  topPages: Array<{ page: string; views: number }>
  deviceBreakdown: Array<{ type: string; count: number }>
}

export const GET = withApiMonitoring(
  async (request: NextRequest) => {
    try {
      const supabase = createClient()
      const { searchParams } = new URL(request.url)
      const timeRange = searchParams.get('timeRange') || '24h'
      
      // Calculate time range
      const now = new Date()
      const startTime = new Date()
      switch (timeRange) {
        case '1h':
          startTime.setHours(now.getHours() - 1)
          break
        case '24h':
          startTime.setDate(now.getDate() - 1)
          break
        case '7d':
          startTime.setDate(now.getDate() - 7)
          break
        case '30d':
          startTime.setDate(now.getDate() - 30)
          break
        default:
          startTime.setDate(now.getDate() - 1)
      }

      // Get session metrics from analytics_events table
      const { data: sessionEvents, error: sessionError } = await supabase
        .from('analytics_events')
        .select('event_type, event_data, created_at')
        .in('event_type', ['rum_session_update', 'rum_page_view', 'rum_error'])
        .gte('created_at', startTime.toISOString())
        .order('created_at', { ascending: false })

      if (sessionError) {
        console.error('Error fetching session data:', sessionError)
        return NextResponse.json({ error: 'Failed to fetch session data' }, { status: 500 })
      }

      // Process session data
      const sessions = new Map()
      const pageViews = new Map()
      const deviceTypes = new Map()
      let totalErrors = 0
      let totalSessionTime = 0
      let sessionsWithDuration = 0

      sessionEvents?.forEach((event: unknown) => {
        const eventData = event.event_data
        
        if (event.event_type === 'rum_session_update' && eventData.id) {
          const sessionId = eventData.id
          const existingSession = sessions.get(sessionId)
          
          if (!existingSession || new Date(event.created_at) > new Date(existingSession.lastUpdate)) {
            sessions.set(sessionId, {
              id: sessionId,
              duration: eventData.duration || 0,
              pageViews: eventData.pageViews || 0,
              errors: eventData.errors || 0,
              device: eventData.device,
              lastUpdate: event.created_at,
            })
          }
        } else if (event.event_type === 'rum_page_view' && eventData.url) {
          const url = new URL(eventData.url)
          const page = url.pathname
          pageViews.set(page, (pageViews.get(page) || 0) + 1)
        } else if (event.event_type === 'rum_error') {
          totalErrors++
        }
      })

      // Calculate active users (sessions updated in last 30 minutes)
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)
      const activeUsers = Array.from(sessions.values()).filter(
        (session: unknown) => new Date(session.lastUpdate) > thirtyMinutesAgo
      ).length

      // Calculate average session duration and device breakdown
      sessions.forEach((session: unknown) => {
        if (session.duration > 0) {
          totalSessionTime += session.duration
          sessionsWithDuration++
        }
        
        if (session.device?.type) {
          const deviceType = session.device.type
          deviceTypes.set(deviceType, (deviceTypes.get(deviceType) || 0) + 1)
        }
      })

      // Calculate error rate
      const totalSessions = sessions.size
      const errorRate = totalSessions > 0 ? (totalErrors / totalSessions) * 100 : 0

      // Get top pages
      const topPages = Array.from(pageViews.entries())
        .map(([page, views]: [any, any]) => ({ page, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5)

      // Get device breakdown
      const deviceBreakdown = Array.from(deviceTypes.entries())
        .map(([type, count]: [any, any]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)

      const sessionData: SessionData = {
        activeUsers,
        totalSessions,
        avgSessionDuration: sessionsWithDuration > 0 ? totalSessionTime / sessionsWithDuration : 0,
        errorRate,
        topPages,
        deviceBreakdown,
      }

      return NextResponse.json(sessionData)
    } catch (error) {
      console.error('Error in Session Data API:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)
