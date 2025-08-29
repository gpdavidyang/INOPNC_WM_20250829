import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'system_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get system metrics
    const now = new Date()
    
    // Get active users (logged in within last 30 minutes)
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)
    const { count: activeUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_login_at', thirtyMinutesAgo.toISOString())

    // Get database status (simple ping)
    const { error: dbError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    // Get total users and sites for context
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    const { count: totalSites } = await supabase
      .from('sites')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // Calculate mock metrics (in production, these would come from actual monitoring)
    const systemStatus = {
      status: dbError ? 'down' : 'healthy',
      database: !dbError,
      storage: true, // Mock - would check actual storage
      uptime: process.uptime ? Math.floor(process.uptime()) : 432000,
      memory: {
        used: process.memoryUsage ? process.memoryUsage().heapUsed : 4294967296,
        total: process.memoryUsage ? process.memoryUsage().heapTotal : 8589934592,
        percentage: 50
      },
      activeUsers: activeUsers || 0,
      totalUsers: totalUsers || 0,
      totalSites: totalSites || 0,
      requestsPerMinute: Math.floor(Math.random() * 200) + 100, // Mock
      errorRate: Math.random() * 0.05, // Mock 0-5% error rate
      timestamp: now.toISOString()
    }

    // Update memory percentage
    if (process.memoryUsage) {
      systemStatus.memory.percentage = Math.round(
        (systemStatus.memory.used / systemStatus.memory.total) * 100
      )
    }

    return NextResponse.json(systemStatus)
  } catch (error) {
    console.error('System status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}