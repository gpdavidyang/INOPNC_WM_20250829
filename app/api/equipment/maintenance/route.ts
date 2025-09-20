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
      equipmentId,
      equipmentName,
      maintenanceType,
      scheduledDate,
      description,
      assignedTo,
      priority = 'medium'
    } = await request.json()

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, site_id, organization_id')
      .eq('id', authResult.userId)
      .single()

    if (!profile || !['admin', 'system_admin', 'site_manager', 'equipment_manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Create equipment maintenance record
    const { data: maintenance, error: createError } = await supabase
      .from('equipment_maintenance')
      .insert({
        equipment_id: equipmentId,
        equipment_name: equipmentName,
        maintenance_type: maintenanceType,
        scheduled_date: scheduledDate,
        description,
        assigned_to: assignedTo,
        priority,
        status: 'scheduled',
        created_by: authResult.userId,
        organization_id: profile.organization_id
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating maintenance record:', createError)
      return NextResponse.json({ error: 'Failed to create maintenance record' }, { status: 500 })
    }

    // Create notification for assigned worker
    if (assignedTo) {
      const { data: assignedWorker } = await supabase
        .from('profiles')
        .select('id, full_name, push_subscription')
        .eq('id', assignedTo)
        .single()

      if (assignedWorker) {
        const notificationTitle = maintenanceType === 'urgent' 
          ? `긴급 장비 점검: ${equipmentName}`
          : `장비 점검 일정: ${equipmentName}`

        const notificationBody = `${new Date(scheduledDate).toLocaleDateString('ko-KR')}에 ${equipmentName} ${
          maintenanceType === 'routine' ? '정기' : maintenanceType === 'urgent' ? '긴급' : '특별'
        } 점검이 예정되어 있습니다.`

        // Create in-app notification
        await supabase
          .from('notifications')
          .insert({
            user_id: assignedTo,
            type: maintenanceType === 'urgent' ? 'warning' : 'info',
            title: notificationTitle,
            message: notificationBody,
            related_entity_type: 'equipment_maintenance',
            related_entity_id: maintenance.id,
            action_url: `/dashboard/equipment/maintenance/${maintenance.id}`,
            created_by: authResult.userId
          })

        // Send push notification
        if (assignedWorker.push_subscription) {
          try {
            await notificationHelpers.sendEquipmentMaintenance(
              assignedTo,
              equipmentName,
              maintenanceType,
              scheduledDate,
              maintenance.id
            )
          } catch (error) {
            console.error('Failed to send push notification:', error)
          }
        }
      }
    }

    // If urgent, notify all site managers
    if (maintenanceType === 'urgent') {
      const { data: siteManagers } = await supabase
        .from('profiles')
        .select('id, push_subscription')
        .eq('site_id', profile.site_id)
        .eq('role', 'site_manager')
        .eq('status', 'active')

      if (siteManagers?.length) {
        const urgentNotifications = siteManagers.map((manager: unknown) => ({
          user_id: manager.id,
          type: 'warning',
          title: `⚠️ 긴급 장비 점검 필요`,
          message: `${equipmentName} 장비에 긴급 점검이 필요합니다`,
          related_entity_type: 'equipment_maintenance',
          related_entity_id: maintenance.id,
          action_url: `/dashboard/equipment/maintenance/${maintenance.id}`,
          created_by: authResult.userId
        }))

        await supabase
          .from('notifications')
          .insert(urgentNotifications)
      }
    }

    return NextResponse.json({
      success: true,
      data: maintenance,
      message: 'Equipment maintenance scheduled successfully'
    })

  } catch (error: unknown) {
    console.error('Equipment maintenance creation error:', error)
    return NextResponse.json({ 
      error: 'Failed to create equipment maintenance',
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
    const equipmentId = searchParams.get('equipmentId')
    const status = searchParams.get('status') || 'scheduled'
    const upcoming = searchParams.get('upcoming') === 'true'

    // Build query
    let query = supabase
      .from('equipment_maintenance')
      .select(`
        *,
        equipment:equipment_id(*),
        assigned_worker:profiles!equipment_maintenance_assigned_to_fkey(full_name),
        created_by_user:profiles!equipment_maintenance_created_by_fkey(full_name)
      `)

    // Apply filters
    if (equipmentId) {
      query = query.eq('equipment_id', equipmentId)
    }
    
    if (status) {
      query = query.eq('status', status)
    }

    if (upcoming) {
      const now = new Date().toISOString()
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      query = query
        .gte('scheduled_date', now)
        .lte('scheduled_date', weekFromNow)
    }

    query = query.order('scheduled_date', { ascending: true })

    const { data: maintenanceRecords, error: fetchError } = await query

    if (fetchError) {
      console.error('Error fetching maintenance records:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch maintenance records' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      maintenanceRecords: maintenanceRecords || []
    })

  } catch (error: unknown) {
    console.error('Get maintenance records error:', error)
    return NextResponse.json({ 
      error: 'Failed to get maintenance records',
      details: error.message 
    }, { status: 500 })
  }
}
