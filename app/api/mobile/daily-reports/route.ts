import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()
    const serviceClient = createServiceRoleClient()

    // Check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id, site_id, partner_company_id')
      .eq('id', authResult.userId)
      .single()

    const role = profile?.role || authResult.role || ''
    const organizationId = profile?.organization_id

    const allowedRoles = new Set([
      'worker',
      'site_manager',
      'admin',
      'system_admin',
      'customer_manager',
      'partner',
    ])

    if (!profile || (role && !allowedRoles.has(role))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('site_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build base query
    let query = serviceClient.from('daily_reports').select(`
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
        ),
        worker_assignments(
          id,
          profile_id,
          worker_name,
          labor_hours,
          profiles(
            id,
            full_name
          )
        ),
        material_usage(
          id,
          material_type,
          quantity,
          unit
        ),
        document_attachments(
          id,
          file_name,
          file_url,
          file_size,
          document_type,
          uploaded_at
        )
      `)

    // Partner/customer_manager: restrict to allowed site ids
    if (role === 'partner' || role === 'customer_manager') {
      const allowedSiteIds = new Set<string>()
      const legacyFallbackEnabled = process.env.ENABLE_SITE_PARTNERS_FALLBACK === 'true'

      if (profile?.partner_company_id) {
        const { data: mappingRows, error: mappingError } = await supabase
          .from('partner_site_mappings')
          .select('site_id, is_active')
          .eq('partner_company_id', profile.partner_company_id)

        if (!mappingError) {
          ;(mappingRows || []).forEach(row => {
            if (row?.site_id && row.is_active) allowedSiteIds.add(row.site_id)
          })
        }

        if ((mappingError || allowedSiteIds.size === 0) && legacyFallbackEnabled) {
          const { data: legacyRows } = await supabase
            .from('site_partners')
            .select('site_id, contract_status')
            .eq('partner_company_id', profile.partner_company_id)

          ;(legacyRows || []).forEach(row => {
            if (row?.site_id && row.contract_status !== 'terminated')
              allowedSiteIds.add(row.site_id)
          })
        }
      }

      if (allowedSiteIds.size === 0) {
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

      const allowedIds = Array.from(allowedSiteIds)
      // If client requested a specific site, ensure it's allowed
      if (siteId && !allowedSiteIds.has(siteId)) {
        return NextResponse.json({ error: 'Not authorized for this site' }, { status: 403 })
      }
      query = query.in('site_id', allowedIds)
    }

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
      if (status === 'approved') {
        // Treat 'approved' tab as inclusive of legacy/alternate states
        query = query.in('status', ['approved', 'submitted', 'completed'])
      } else {
        query = query.eq('status', status)
      }
    }

    // 더 이상 조직 기반 필터를 적용하지 않는다. 모든 현장 데이터를 허용

    // Get total count
    const { count: totalCount } = await query.select('*', { count: 'exact', head: true })

    const { data: reports, error } = await query
      .order('work_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Daily reports query error:', error)
      return NextResponse.json({ error: 'Failed to fetch daily reports' }, { status: 500 })
    }

    const enrichedReports = await enrichReportsWithDetails(reports || [])

    const totalPages = Math.ceil((totalCount || 0) / limit)

    return NextResponse.json({
      success: true,
      data: {
        reports: enrichedReports,
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

async function enrichReportsWithDetails(reports: any[]) {
  if (!reports.length) return reports

  try {
    const serviceClient = createServiceRoleClient()

    const siteIds = Array.from(
      new Set(reports.map(report => report?.site_id).filter((id): id is string => Boolean(id)))
    )

    const authorIds = Array.from(
      new Set(reports.map(report => report?.created_by).filter((id): id is string => Boolean(id)))
    )

    const workerProfileIds = Array.from(
      new Set(
        reports
          .flatMap(report => report?.worker_assignments ?? [])
          .map((assignment: any) => assignment?.profile_id)
          .filter((id): id is string => Boolean(id))
      )
    )

    const profileIds = Array.from(new Set([...authorIds, ...workerProfileIds]))

    const [sitesResult, profilesResult, sitePartnersResult] = await Promise.all([
      siteIds.length
        ? serviceClient.from('sites').select('id, name, address, status').in('id', siteIds)
        : Promise.resolve({ data: [] }),
      profileIds.length
        ? serviceClient.from('profiles').select('id, full_name, role').in('id', profileIds)
        : Promise.resolve({ data: [] }),
      siteIds.length
        ? serviceClient
            .from('site_partners')
            .select('site_id, assigned_date, created_at, partner_companies(company_name)')
            .in('site_id', siteIds)
        : Promise.resolve({ data: [] }),
    ])

    const siteMap = new Map<string, any>((sitesResult.data ?? []).map(site => [site.id, site]))

    const profileMap = new Map<string, any>((profilesResult.data ?? []).map(p => [p.id, p]))

    const partnerMap = new Map<string, string>()
    ;(sitePartnersResult.data ?? []).forEach((row: any) => {
      const siteId = row?.site_id
      const name = row?.partner_companies?.company_name
      if (!siteId || !name) return

      // 최신 매핑 우선: assigned_date > created_at > 기존 값 유지
      const current = partnerMap.get(siteId)

      const toDateVal = (v: any) => {
        if (!v) return 0
        const t = new Date(v as string).getTime()
        return Number.isFinite(t) ? t : 0
      }

      const existingRow = (sitePartnersResult.data as any[]).find(
        r => r?.site_id === siteId && r?.partner_companies?.company_name === current
      )

      const existingScore = existingRow
        ? Math.max(toDateVal(existingRow.assigned_date), toDateVal(existingRow.created_at))
        : -1
      const nextScore = Math.max(toDateVal(row.assigned_date), toDateVal(row.created_at))

      if (!current || nextScore >= existingScore) {
        partnerMap.set(siteId, name)
      }
    })

    return reports.map(report => {
      const enriched = { ...report }

      const siteInfo = siteMap.get(report?.site_id)
      if (siteInfo) {
        enriched.sites = siteInfo
      }

      const authorProfile = profileMap.get(report?.created_by)
      if (authorProfile) {
        enriched.profiles = authorProfile
      }

      if (Array.isArray(report?.worker_assignments)) {
        enriched.worker_assignments = report.worker_assignments.map((assignment: any) => {
          if (assignment?.worker_name) return assignment
          const profile = profileMap.get(assignment?.profile_id)
          if (!profile) return assignment
          return {
            ...assignment,
            worker_name: profile.full_name,
            profiles: profile,
          }
        })
      }

      // Attach partner company name if available
      const partnerName = partnerMap.get(report?.site_id)
      if (partnerName) {
        enriched.partner_company_name = partnerName
      }

      return enriched
    })
  } catch (error) {
    console.error('Failed to enrich daily reports with site/profile details:', error)
    return reports
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()

    // Check if user is site_manager or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', authResult.userId)
      .single()

    const role = profile?.role || authResult.role || ''

    if (!profile || !['site_manager', 'admin', 'system_admin'].includes(role)) {
      return NextResponse.json({ error: 'Site manager or admin access required' }, { status: 403 })
    }

    // Get request body
    const body = await request.json()
    const {
      site_id,
      work_date,
      work_description,
      total_workers,
      status = 'draft',
      member_types = [],
      processes = [],
      work_types = [],
      location = {},
      main_manpower = 0,
      additional_manpower = [],
      notes,
      safety_notes,
      materials = [],
    } = body

    // Validate required fields
    if (!site_id || !work_date || !work_description) {
      return NextResponse.json(
        { error: 'Missing required fields: site_id, work_date, work_description' },
        { status: 400 }
      )
    }

    // For site managers, verify they can create reports for this site
    if (role === 'site_manager') {
      const { data: siteAssignment } = await supabase
        .from('site_assignments')
        .select('id')
        .eq('user_id', authResult.userId)
        .eq('role', 'site_manager')
        .eq('site_id', site_id)
        .eq('is_active', true)
        .is('unassigned_date', null)
        .order('assigned_date', { ascending: false })
        .limit(1)
        .maybeSingle()

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

    const normalizedAdditionalManpower = Array.isArray(additional_manpower)
      ? additional_manpower.map((item: any, index: number) => ({
          name: item?.name || item?.worker_name || `추가 인력 ${index + 1}`,
          manpower: Number(item?.manpower) || 0,
        }))
      : []

    const locationPayload = {
      block: location?.block ?? '',
      dong: location?.dong ?? '',
      unit: location?.unit ?? '',
    }

    const totalManpowerFromPayload = Number(total_workers)
    const calculatedManpower =
      (Number(main_manpower) || 0) +
      normalizedAdditionalManpower.reduce((sum, item) => sum + item.manpower, 0)
    const totalManpower = !isNaN(totalManpowerFromPayload)
      ? totalManpowerFromPayload
      : calculatedManpower

    const additionalNotesPayload = {
      memberTypes: Array.isArray(member_types) ? member_types : [],
      workContents: Array.isArray(processes) ? processes : [],
      workTypes: Array.isArray(work_types) ? work_types : [],
      mainManpower: Number(main_manpower) || 0,
      additionalManpower: normalizedAdditionalManpower,
      notes: notes || '',
      safetyNotes: safety_notes || '',
    }

    // Create daily report
    const { data: report, error: insertError } = await supabase
      .from('daily_reports')
      .insert({
        site_id,
        work_date,
        total_workers: totalManpower,
        work_description,
        safety_notes: safety_notes ?? null,
        special_notes: notes ?? null,
        status,
        additional_notes: additionalNotesPayload,
        location_info: locationPayload,
        created_by: authResult.userId,
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

    // If materials provided, insert material usage records
    if (materials && materials.length > 0) {
      const materialRecords = materials.map((material: any) => ({
        daily_report_id: report.id,
        material_name: material.material_name,
        quantity: material.quantity,
        unit: material.unit,
        unit_price: material.unit_price || null,
        notes: material.notes || null,
      }))

      await supabase.from('material_usage').insert(materialRecords)
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
