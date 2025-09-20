import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (authResult.role !== 'admin' && authResult.role !== 'system_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = createClient()

    // Fetch all daily reports with site and user information
    const { data: reports, error } = await supabase
      .from('daily_reports')
      .select(`
        *,
        sites(
          id,
          name,
          address
        ),
        submitted_by_profile:profiles!daily_reports_submitted_by_fkey(
          id,
          full_name,
          role
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Daily reports query error:', error)
      return NextResponse.json({ error: 'Failed to fetch daily reports' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: reports || []
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (authResult.role !== 'admin' && authResult.role !== 'system_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = createClient()

    // Get request body
    const body = await request.json()
    const { 
      site_id, 
      partner_company_id,
      work_date, 
      work_content, 
      location_info,
      additional_notes 
    } = body

    // Validate required fields
    if (!site_id || !partner_company_id || !work_date) {
      return NextResponse.json({ 
        error: 'Missing required fields: site_id, partner_company_id, work_date' 
      }, { status: 400 })
    }

    // Create daily report with partner company
    const { data: report, error: insertError } = await supabase
      .from('daily_reports')
      .insert({
        site_id,
        partner_company_id,
        work_date,
        work_content: work_content || '',
        location_info: location_info || {},
        additional_notes: additional_notes || '',
        submitted_by: authResult.userId,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        sites(
          id,
          name,
          address
        ),
        partner_companies(
          id,
          company_name,
          company_type
        )
      `)
      .single()

    if (insertError) {
      console.error('Daily report insert error:', insertError)
      return NextResponse.json({ 
        error: 'Failed to create daily report',
        details: insertError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: report,
      message: 'Daily report created successfully'
    })

  } catch (error) {
    console.error('POST API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
