import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id: alertId } = params

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the safety alert
    const { data: safetyAlert, error: fetchError } = await supabase
      .from('safety_alerts')
      .select('*')
      .eq('id', alertId)
      .single()

    if (fetchError || !safetyAlert) {
      return NextResponse.json({ error: 'Safety alert not found' }, { status: 404 })
    }

    // Check if user already acknowledged
    const { data: existingAck } = await supabase
      .from('safety_alert_acknowledgments')
      .select('id')
      .eq('alert_id', alertId)
      .eq('user_id', user.id)
      .single()

    if (existingAck) {
      return NextResponse.json({ 
        success: true, 
        message: 'Already acknowledged' 
      })
    }

    // Create acknowledgment record
    const { data: acknowledgment, error: ackError } = await supabase
      .from('safety_alert_acknowledgments')
      .insert({
        alert_id: alertId,
        user_id: user.id,
        acknowledged_at: new Date().toISOString()
      })
      .select()
      .single()

    if (ackError) {
      console.error('Error creating acknowledgment:', ackError)
      return NextResponse.json({ error: 'Failed to acknowledge alert' }, { status: 500 })
    }

    // Update user's notification as read
    await supabase
      .from('notifications')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('related_entity_type', 'safety_alert')
      .eq('related_entity_id', alertId)

    // Check if all required workers have acknowledged (for critical alerts)
    if (safetyAlert.severity === 'critical' && safetyAlert.affected_workers?.length > 0) {
      const { data: allAcks } = await supabase
        .from('safety_alert_acknowledgments')
        .select('user_id')
        .eq('alert_id', alertId)

      const acknowledgedUsers = allAcks?.map((a: any) => a.user_id) || []
      const allAcknowledged = safetyAlert.affected_workers.every(
        (workerId: string) => acknowledgedUsers.includes(workerId)
      )

      if (allAcknowledged) {
        // Update alert status if all affected workers acknowledged
        await supabase
          .from('safety_alerts')
          .update({
            status: 'acknowledged',
            updated_at: new Date().toISOString()
          })
          .eq('id', alertId)
      }
    }

    return NextResponse.json({
      success: true,
      data: acknowledgment,
      message: 'Safety alert acknowledged successfully'
    })

  } catch (error: unknown) {
    console.error('Safety alert acknowledgment error:', error)
    return NextResponse.json({ 
      error: 'Failed to acknowledge safety alert',
      details: error.message 
    }, { status: 500 })
  }
}