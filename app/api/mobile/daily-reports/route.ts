import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is site_manager or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['site_manager', 'admin', 'system_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Site manager or admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('site_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build query
    let query = supabase.from('daily_reports').select(`
        *,
        sites(
          id,
          name,
          address
        ),
        profiles!daily_reports_created_by_fkey(
          id,
          full_name,
          role
        )
      `)

    // Apply filters
    if (siteId) {
      query = query.eq('site_id', siteId)
    }

    if (startDate) {
      query = query.gte('work_date', startDate)
    }

    if (endDate) {
      query = query.lte('work_date', endDate)
    }

    if (status) {
      query = query.eq('status', status)
    }

    // For site managers, only show reports from their assigned sites
    if (profile.role === 'site_manager') {
      // Get sites assigned to this site manager
      const { data: assignedSites } = await supabase
        .from('site_managers')
        .select('site_id')
        .eq('user_id', user.id)

      if (assignedSites && assignedSites.length > 0) {
        const siteIds = assignedSites.map(s => s.site_id)
        query = query.in('site_id', siteIds)
      } else {
        // No sites assigned, return empty result
        return NextResponse.json({
          success: true,
          data: {
            reports: [],
            totalCount: 0,
            totalPages: 0,
            currentPage: page,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        })
      }
    }

    // Get total count
    const { count: totalCount } = await query.select('*', { count: 'exact', head: true })

    // Get paginated data
    const { data: reports, error } = await query
      .order('work_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Daily reports query error:', error)
      return NextResponse.json({ error: 'Failed to fetch daily reports' }, { status: 500 })
    }

    const totalPages = Math.ceil((totalCount || 0) / limit)

    return NextResponse.json({
      success: true,
      data: {
        reports: reports || [],
        totalCount: totalCount || 0,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is site_manager or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['site_manager', 'admin', 'system_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Site manager or admin access required' }, { status: 403 })
    }

    // Get request body
    const body = await request.json()
    const {
      site_id,
      work_date,
      weather,
      temperature_high,
      temperature_low,
      work_start_time,
      work_end_time,
      total_workers,
      work_description,
      safety_notes,
      special_notes,
      materials_used,
      equipment_used,
      status = 'draft',
    } = body

    // Validate required fields
    if (!site_id || !work_date || !weather || !work_description) {
      return NextResponse.json(
        {
          error: 'Missing required fields: site_id, work_date, weather, work_description',
        },
        { status: 400 }
      )
    }

    // For site managers, verify they can create reports for this site
    if (profile.role === 'site_manager') {
      const { data: siteAssignment } = await supabase
        .from('site_managers')
        .select('id')
        .eq('user_id', user.id)
        .eq('site_id', site_id)
        .single()

      if (!siteAssignment) {
        return NextResponse.json({ error: 'Not authorized for this site' }, { status: 403 })
      }
    }

    // Check if report already exists for this site and date
    const { data: existingReport } = await supabase
      .from('daily_reports')
      .select('id')
      .eq('site_id', site_id)
      .eq('work_date', work_date)
      .single()

    if (existingReport) {
      return NextResponse.json(
        {
          error: 'Daily report already exists for this date',
        },
        { status: 400 }
      )
    }

    // Create daily report
    const { data: report, error: insertError } = await supabase
      .from('daily_reports')
      .insert({
        site_id,
        work_date,
        weather,
        temperature_high,
        temperature_low,
        work_start_time,
        work_end_time,
        total_workers,
        work_description,
        safety_notes,
        special_notes,
        status,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(
        `
        *,
        sites(
          id,
          name,
          address
        ),
        profiles!daily_reports_created_by_fkey(
          id,
          full_name,
          role
        )
      `
      )
      .single()

    if (insertError) {
      console.error('Daily report insert error:', insertError)
      return NextResponse.json(
        {
          error: 'Failed to create daily report',
          details: insertError.message,
        },
        { status: 500 }
      )
    }

    // If materials_used provided, insert material usage records
    if (materials_used && materials_used.length > 0) {
      const materialRecords = materials_used.map((material: any) => ({
        daily_report_id: report.id,
        material_name: material.material_name,
        quantity: material.quantity,
        unit: material.unit,
        unit_price: material.unit_price || null,
        notes: material.notes || null,
      }))

      await supabase.from('material_usage').insert(materialRecords)
    }

    // If equipment_used provided, insert equipment usage records
    if (equipment_used && equipment_used.length > 0) {
      const equipmentRecords = equipment_used.map((equipment: any) => ({
        daily_report_id: report.id,
        equipment_name: equipment.equipment_name,
        hours_used: equipment.hours_used,
        operator_name: equipment.operator_name || null,
        fuel_consumption: equipment.fuel_consumption || null,
        notes: equipment.notes || null,
      }))

      await supabase.from('equipment_usage').insert(equipmentRecords)
    }

    return NextResponse.json({
      success: true,
      data: report,
      message: 'Daily report created successfully',
    })
  } catch (error) {
    console.error('POST API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
