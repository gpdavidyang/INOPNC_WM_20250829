
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'


// Simple wrapper for API monitoring
function withApiMonitoring(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    return handler(request)
  }
}

export const GET = withApiMonitoring(
  async (request: NextRequest) => {
    try {
      const authResult = await requireApiAuth()
      if (authResult instanceof NextResponse) {
        return authResult
      }

      const supabase = createClient()

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, organization_id')
        .eq('id', authResult.userId)
        .single()

      if (!profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }

      // Check if user has admin permissions
      if (!['admin', 'system_admin'].includes(profile.role)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }

      // Try to get stored performance budget configuration
      const { data: config, error } = await supabase
        .from('system_config')
        .select('config_value')
        .eq('config_key', 'performance_budgets')
        .eq('organization_id', profile.organization_id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching performance budget config:', error)
        return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 })
      }

      // Return stored config or default empty array
      return NextResponse.json({
        budgets: config?.config_value || [],
      })
    } catch (error) {
      console.error('Error in performance budgets GET:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)

export const POST = withApiMonitoring(
  async (request: NextRequest) => {
    try {
      const authResult = await requireApiAuth()
      if (authResult instanceof NextResponse) {
        return authResult
      }

      const supabase = createClient()

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, organization_id')
        .eq('id', authResult.userId)
        .single()

      if (!profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }

      // Check if user has admin permissions
      if (!['admin', 'system_admin'].includes(profile.role)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }

      const body = await request.json()
      const { budgets } = body

      if (!Array.isArray(budgets)) {
        return NextResponse.json({ error: 'Invalid budgets format' }, { status: 400 })
      }

      // Validate budget structure
      for (const budget of budgets) {
        if (!budget.name || !budget.metric || !budget.thresholds) {
          return NextResponse.json({ error: 'Invalid budget structure' }, { status: 400 })
        }
        if (!budget.thresholds.good || !budget.thresholds.warning || !budget.thresholds.critical) {
          return NextResponse.json({ error: 'Invalid threshold structure' }, { status: 400 })
        }
      }

      // Store performance budget configuration
      const { error } = await supabase
        .from('system_config')
        .upsert({
          config_key: 'performance_budgets',
          config_value: budgets,
          organization_id: profile.organization_id,
          updated_by: authResult.userId,
          updated_at: new Date().toISOString(),
        })

      if (error) {
        console.error('Error saving performance budget config:', error)
        return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Performance budgets saved successfully',
      })
    } catch (error) {
      console.error('Error in performance budgets POST:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)
