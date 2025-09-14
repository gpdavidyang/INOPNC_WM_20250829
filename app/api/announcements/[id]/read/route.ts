import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'


export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id: announcementId } = params

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if already marked as read
    const { data: existingRead } = await supabase
      .from('announcement_reads')
      .select('id')
      .eq('announcement_id', announcementId)
      .eq('user_id', user.id)
      .single()

    if (existingRead) {
      return NextResponse.json({ 
        success: true, 
        message: 'Already marked as read' 
      })
    }

    // Create read record
    const { data: readRecord, error: readError } = await supabase
      .from('announcement_reads')
      .insert({
        announcement_id: announcementId,
        user_id: user.id,
        read_at: new Date().toISOString()
      })
      .select()
      .single()

    if (readError) {
      console.error('Error marking announcement as read:', readError)
      return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 })
    }

    // Update related notification as read
    await supabase
      .from('notifications')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('related_entity_type', 'announcement')
      .eq('related_entity_id', announcementId)

    // Log the read action
    await supabase
      .from('announcement_logs')
      .insert({
        announcement_id: announcementId,
        action: 'read',
        performed_by: user.id,
        performed_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      data: readRecord,
      message: 'Announcement marked as read'
    })

  } catch (error: unknown) {
    console.error('Mark announcement as read error:', error)
    return NextResponse.json({ 
      error: 'Failed to mark announcement as read',
      details: error.message 
    }, { status: 500 })
  }
}
