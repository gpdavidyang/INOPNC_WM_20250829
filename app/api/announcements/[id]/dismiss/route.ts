import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'


export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()
    const { id: announcementId } = params

    // Check if already dismissed
    const { data: existingDismissal } = await supabase
      .from('announcement_dismissals')
      .select('id')
      .eq('announcement_id', announcementId)
      .eq('user_id', authResult.userId)
      .single()

    if (existingDismissal) {
      return NextResponse.json({ 
        success: true, 
        message: 'Already dismissed' 
      })
    }

    // Create dismissal record
    const { data: dismissalRecord, error: dismissError } = await supabase
      .from('announcement_dismissals')
      .insert({
        announcement_id: announcementId,
        user_id: authResult.userId,
        dismissed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dismissError) {
      console.error('Error dismissing announcement:', dismissError)
      return NextResponse.json({ error: 'Failed to dismiss announcement' }, { status: 500 })
    }

    // Mark related notification as read and dismissed
    await supabase
      .from('notifications')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString(),
        dismissed_at: new Date().toISOString()
      })
      .eq('user_id', authResult.userId)
      .eq('related_entity_type', 'announcement')
      .eq('related_entity_id', announcementId)

    // Log the dismissal action
    await supabase
      .from('announcement_logs')
      .insert({
        announcement_id: announcementId,
        action: 'dismissed',
        performed_by: authResult.userId,
        performed_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      data: dismissalRecord,
      message: 'Announcement dismissed'
    })

  } catch (error: unknown) {
    console.error('Dismiss announcement error:', error)
    return NextResponse.json({ 
      error: 'Failed to dismiss announcement',
      details: error.message 
    }, { status: 500 })
  }
}
