import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { id: requestId } = params
    const { status, reason } = await request.json()

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Get the material request
    const { data: materialRequest, error: fetchError } = await supabase
      .from('material_requests')
      .select('*, site:sites(*), requested_by:profiles!material_requests_requested_by_fkey(*)')
      .eq('id', requestId)
      .single()

    if (fetchError || !materialRequest) {
      return NextResponse.json({ error: 'Material request not found' }, { status: 404 })
    }

    // Check if user has permission to approve (must be site manager or admin)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, site_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const canApprove = 
      ['admin', 'system_admin'].includes(profile.role) ||
      (profile.role === 'site_manager' && profile.site_id === materialRequest.site_id)

    if (!canApprove) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Update material request status
    const { data: updatedRequest, error: updateError } = await supabase
      .from('material_requests')
      .update({
        status,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        rejection_reason: status === 'rejected' ? reason : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating material request:', updateError)
      return NextResponse.json({ error: 'Failed to update material request' }, { status: 500 })
    }

    // Create notification for the requester
    const notificationTitle = status === 'approved' 
      ? '자재 요청이 승인되었습니다'
      : '자재 요청이 거부되었습니다'

    const notificationBody = status === 'approved'
      ? `${materialRequest.material_name} 자재 요청이 승인되었습니다. 곧 배송됩니다.`
      : `${materialRequest.material_name} 자재 요청이 거부되었습니다. 사유: ${reason || '미제공'}`

    await supabase
      .from('notifications')
      .insert({
        user_id: materialRequest.requested_by,
        type: status === 'approved' ? 'success' : 'error',
        title: notificationTitle,
        message: notificationBody,
        related_entity_type: 'material_request',
        related_entity_id: requestId,
        action_url: `/dashboard/materials/requests/${requestId}`,
        created_by: user.id
      })

    // Send push notification if the user has push enabled
    if (materialRequest.requested_by && materialRequest.requested_by.push_subscription) {
      try {
        await fetch(`${request.nextUrl.origin}/api/notifications/push`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('authorization') || ''
          },
          body: JSON.stringify({
            userIds: [materialRequest.requested_by.id],
            notificationType: 'material_approval',
            payload: {
              title: notificationTitle,
              body: notificationBody,
              urgency: 'high',
              data: {
                requestId,
                status,
                materialName: materialRequest.material_name
              }
            }
          })
        })
      } catch (error) {
        console.error('Failed to send push notification:', error)
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedRequest,
      message: `Material request ${status} successfully`
    })

  } catch (error: unknown) {
    console.error('Material approval error:', error)
    return NextResponse.json({ 
      error: 'Failed to process material approval',
      details: error.message 
    }, { status: 500 })
  }
}