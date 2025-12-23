import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()
    let serviceClient: any = null
    try {
      serviceClient = createServiceRoleClient()
    } catch {
      // Fallback for dev environments without service role key
      serviceClient = createClient()
    }

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
          address,
          organization_id
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
    console.error('API error (mobile/daily-reports):', error)
    // Fail-soft for mobile: return empty list to keep UI responsive
    return NextResponse.json(
      {
        success: true,
        data: {
          reports: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        warning: 'fallback',
      },
      { status: 200 }
    )
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
    let serviceClient: any = null
    let hasServiceRole = true
    try {
      serviceClient = createServiceRoleClient()
    } catch {
      hasServiceRole = false
      serviceClient = createClient()
    }

    // Check if user can create daily reports (worker/site_manager/admin/system_admin)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id, full_name')
      .eq('id', authResult.userId)
      .single()

    const role = profile?.role || authResult.role || ''

    const canCreate = ['worker', 'site_manager', 'admin', 'system_admin'].includes(role)
    if (!profile || !canCreate) {
      return NextResponse.json({ error: 'Worker or site manager access required' }, { status: 403 })
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
      tasks = [],
      main_manpower = 0,
      additional_manpower = [],
      notes,
      safety_notes,
      materials = [],
    } = body
    const primaryMemberType =
      Array.isArray(member_types) && member_types.length > 0 ? member_types[0] : null
    const primaryProcess = Array.isArray(processes) && processes.length > 0 ? processes[0] : null
    // Validate required fields
    if (!site_id || !work_date) {
      return NextResponse.json(
        { error: 'Missing required fields: site_id, work_date' },
        { status: 400 }
      )
    }

    // Policy: workers and site managers can create for any site (no assignment restriction)

    // Precompute normalized manpower and location/total for reuse
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
    const totalManpowerExact = !isNaN(totalManpowerFromPayload)
      ? totalManpowerFromPayload
      : calculatedManpower
    // Some environments define daily_reports.total_workers as integer; keep exact value separately
    const totalWorkersInt = Number.isFinite(totalManpowerExact) ? Math.round(totalManpowerExact) : 0

    // Check if report already exists for this site and date
    const { data: existingReport } = await serviceClient
      .from('daily_reports')
      .select('id')
      .eq('site_id', site_id)
      .eq('work_date', work_date)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingReport) {
      // Update the existing report instead of erroring out
      const updateBase: any = {
        total_workers: totalWorkersInt,
        work_description,
        safety_notes: safety_notes ?? null,
        special_notes: notes ?? null,
        status,
        updated_at: new Date().toISOString(),
        component_name: primaryMemberType || null,
        process_type: primaryProcess || null,
        work_process:
          Array.isArray(processes) && processes.length > 0 ? processes.join(', ') : null,
        work_section:
          Array.isArray(work_types) && work_types.length > 0 ? work_types.join(', ') : null,
      }

      let updatePayload: any = {
        ...updateBase,
        work_content: {
          memberTypes: Array.isArray(member_types) ? member_types : [],
          workProcesses: Array.isArray(processes) ? processes : [],
          workTypes: Array.isArray(work_types) ? work_types : [],
          tasks: Array.isArray(tasks) ? tasks : [],
          totalManpower: totalManpowerExact,
          mainManpower: Number(main_manpower) || 0,
          additionalManpower: normalizedAdditionalManpower,
        },
        location_info: {
          block: location?.block ?? '',
          dong: location?.dong ?? '',
          unit: location?.unit ?? '',
        },
      }

      const removableForUpdate = new Set([
        'work_content',
        'location_info',
        'safety_notes',
        'special_notes',
        'total_workers',
        'updated_at',
        'work_description',
        'component_name',
        'process_type',
        'work_process',
        'work_section',
      ])

      let updatedReport: any = null
      let lastUpdateError: any = null
      for (let i = 0; i < 8; i++) {
        const res = await serviceClient
          .from('daily_reports')
          .update(updatePayload)
          .eq('id', existingReport.id)
          .select('*')
          .single()

        if (!res.error && res.data) {
          updatedReport = res.data
          break
        }

        lastUpdateError = res.error
        const msg = String(res.error?.message || '')
        const m1 = msg.match(/'([^']+)' column of 'daily_reports'/i)
        const m2 = msg.match(/column\s+"?([a-zA-Z0-9_]+)"?\s+does not exist/i)
        const m3 = msg.match(
          /null value in column\s+"?([a-zA-Z0-9_]+)"?\s+of\s+relation\s+"?daily_reports"?/i
        )
        const missing = (m1?.[1] || m2?.[1]) as string | undefined
        const notNullCol = m3?.[1] as string | undefined

        if (missing && (removableForUpdate.has(missing) || updatePayload[missing] !== undefined)) {
          delete updatePayload[missing]
          continue
        }

        if (notNullCol) {
          switch (notNullCol) {
            case 'member_name':
              updatePayload.member_name = (profile as any)?.full_name || '작업자'
              break
            case 'work_description':
              updatePayload.work_description = updatePayload.work_description || ''
              break
            case 'status':
              // Preserve requested status; default to submitted on update path
              updatePayload.status =
                updatePayload.status || (status === 'submitted' ? 'submitted' : 'draft')
              break
            case 'total_workers':
              updatePayload.total_workers = Number.isFinite(totalWorkersInt) ? totalWorkersInt : 0
              break
            default:
              if (updatePayload[notNullCol] === undefined || updatePayload[notNullCol] === null) {
                updatePayload[notNullCol] = ''
              }
              break
          }
          continue
        }

        if (/schema cache/i.test(msg)) {
          let dropped = false
          for (const col of ['work_content', 'location_info', 'safety_notes', 'special_notes']) {
            if (updatePayload[col] !== undefined) {
              delete updatePayload[col]
              dropped = true
            }
          }
          if (dropped) continue
        }

        break
      }

      if (!updatedReport) {
        console.error('Daily report update error:', lastUpdateError)
        return NextResponse.json(
          {
            error:
              lastUpdateError?.message || 'Failed to update existing daily report for this date',
            details: lastUpdateError,
          },
          { status: 500 }
        )
      }

      // Optionally add materials as additional usage entries
      if (materials && materials.length > 0) {
        const materialRecords = materials
          .filter(
            (material: any) =>
              typeof material?.material_name === 'string' && material.material_name.trim()
          )
          .map((material: any) => ({
            daily_report_id: updatedReport.id,
            material_name: material.material_name,
            material_type: (material.material_code || material.material_name || '')
              .toString()
              .toUpperCase(),
            quantity: Number(material.quantity) || 0,
            unit: material.unit || null,
            unit_price: material.unit_price || null,
            notes: material.notes || null,
          }))
        if (materialRecords.length > 0) {
          try {
            await serviceClient.from('material_usage').insert(materialRecords)
          } catch (e) {
            console.warn('material_usage insert warning (update path):', e)
          }
        }
      }

      // Aggregate additional photos when moving to submitted
      if (status === 'submitted') {
        try {
          await aggregateAdditionalPhotos(serviceClient, updatedReport.id)
        } catch (e) {
          console.warn('aggregateAdditionalPhotos warning (update path):', e)
        }
      }

      const savedAsSubmitted = String(updatedReport?.status) === 'submitted'
      const message =
        status === 'submitted'
          ? savedAsSubmitted
            ? '기존 동일 날짜 작업일지를 제출로 저장했습니다.'
            : '필수 항목이 누락되어 임시 상태로 저장되었습니다.'
          : '기존 동일 날짜 작업일지를 업데이트했습니다.'

      return NextResponse.json({ success: true, data: updatedReport, message })
    }

    // Deprecated additional_notes payload was removed to match current schema

    // If no service-role key is configured, inserts may fail due to RLS
    if (!hasServiceRole && process.env.NODE_ENV !== 'production') {
      return NextResponse.json(
        {
          error:
            'Service role key missing: set SUPABASE_SERVICE_ROLE_KEY in .env.local to enable daily report creation in development.',
        },
        { status: 500 }
      )
    }

    // Build payloads with fallback for schemas missing JSON columns
    const workContentPayload = {
      memberTypes: Array.isArray(member_types) ? member_types : [],
      workProcesses: Array.isArray(processes) ? processes : [],
      workTypes: Array.isArray(work_types) ? work_types : [],
      tasks: Array.isArray(tasks) ? tasks : [],
      totalManpower: totalManpowerExact,
      mainManpower: Number(main_manpower) || 0,
      additionalManpower: normalizedAdditionalManpower,
    }

    const baseInsert = {
      site_id,
      work_date,
      total_workers: totalWorkersInt,
      work_description,
      process_type: primaryProcess || null,
      component_name: primaryMemberType || null,
      work_process: Array.isArray(processes) && processes.length > 0 ? processes.join(', ') : null,
      work_section:
        Array.isArray(work_types) && work_types.length > 0 ? work_types.join(', ') : null,
      safety_notes: safety_notes ?? null,
      special_notes: notes ?? null,
      status,
      created_by: authResult.userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any

    // Progressive insert: remove missing columns and retry up to 6 times
    const removableColumns = new Set([
      'work_content',
      'location_info',
      'safety_notes',
      'special_notes',
      'total_workers',
      'created_at',
      'updated_at',
      'work_description',
      'created_by',
      'component_name',
      'process_type',
      'work_process',
      'work_section',
    ])
    const essentialColumns = new Set(['site_id', 'work_date'])

    let payload: any = {
      ...baseInsert,
      work_content: workContentPayload,
      location_info: locationPayload,
    }

    let report: any = null
    let lastError: any = null
    for (let attempt = 0; attempt < 8; attempt++) {
      const res = await serviceClient.from('daily_reports').insert(payload).select('*').single()
      if (!res.error && res.data) {
        report = res.data
        break
      }
      lastError = res.error
      const msg = String(res.error?.message || '')
      const m1 = msg.match(/'([^']+)' column of 'daily_reports'/i)
      const m2 = msg.match(/column\s+"?([a-zA-Z0-9_]+)"?\s+does not exist/i)
      const m3 = msg.match(
        /null value in column\s+"?([a-zA-Z0-9_]+)"?\s+of\s+relation\s+"?daily_reports"?/i
      )
      const missing = (m1?.[1] || m2?.[1]) as string | undefined
      const notNullCol = m3?.[1] as string | undefined
      // Unique violation fallback: update existing record
      if (/duplicate key value|unique constraint/i.test(msg)) {
        if (existingReport?.id) {
          // Reuse the update path below by simulating existingReport flow
          break
        } else {
          // Try lookup once more (race condition)
          const { data: exist2 } = await serviceClient
            .from('daily_reports')
            .select('id')
            .eq('site_id', site_id)
            .eq('work_date', work_date)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          if (exist2?.id) break
        }
      }
      if (missing && essentialColumns.has(missing)) {
        // Can't proceed if essential columns are missing in this schema
        break
      }
      if (missing && (removableColumns.has(missing) || payload[missing] !== undefined)) {
        delete payload[missing]
        continue
      }
      // Handle NOT NULL violations by supplying sensible defaults
      if (notNullCol) {
        switch (notNullCol) {
          case 'member_name':
            payload.member_name = (profile as any)?.full_name || '작업자'
            break
          case 'work_description':
            payload.work_description = payload.work_description || ''
            break
          case 'status':
            // Preserve requested status from the body; fallback to draft otherwise
            payload.status = payload.status || (status === 'submitted' ? 'submitted' : 'draft')
            break
          case 'total_workers':
            payload.total_workers = Number.isFinite(totalWorkersInt) ? totalWorkersInt : 0
            break
          default:
            // Generic fallback: empty string for unknown text, else 0
            if (payload[notNullCol] === undefined || payload[notNullCol] === null) {
              payload[notNullCol] = ''
            }
            break
        }
        continue
      }
      // If error indicates schema cache for known optional cols, drop them
      if (/schema cache/i.test(msg)) {
        let dropped = false
        for (const col of ['work_content', 'location_info', 'safety_notes', 'special_notes']) {
          if (payload[col] !== undefined) {
            delete payload[col]
            dropped = true
          }
        }
        if (dropped) continue
      }
      break
    }

    if (!report) {
      console.error('Daily report insert error:', lastError)
      return NextResponse.json(
        {
          error: lastError?.message || 'Failed to create daily report',
          details: lastError,
        },
        { status: 500 }
      )
    }

    // If materials provided, insert material usage records
    if (materials && materials.length > 0) {
      const materialRecords = materials
        .filter(
          (material: any) =>
            typeof material?.material_name === 'string' && material.material_name.trim()
        )
        .map((material: any) => ({
          daily_report_id: report.id,
          material_name: material.material_name,
          material_type: (material.material_code || material.material_name || '')
            .toString()
            .toUpperCase(),
          quantity: Number(material.quantity) || 0,
          unit: material.unit || null,
          unit_price: material.unit_price || null,
          notes: material.notes || null,
        }))

      if (materialRecords.length > 0) {
        try {
          await serviceClient.from('material_usage').insert(materialRecords)
        } catch (e) {
          // Ignore if table or columns are not present in this environment
          console.warn('material_usage insert warning:', e)
        }
      }
    }

    // Aggregate additional photos on submitted
    if (status === 'submitted') {
      try {
        await aggregateAdditionalPhotos(serviceClient, report.id)
      } catch (e) {
        console.warn('aggregateAdditionalPhotos warning (insert path):', e)
      }
    }

    const savedAsSubmitted = String(report?.status) === 'submitted'
    const message =
      status === 'submitted'
        ? savedAsSubmitted
          ? '작업일지가 저장되었습니다.'
          : '필수 항목이 누락되어 임시 상태로 저장되었습니다.'
        : '임시 상태로 저장되었습니다.'

    return NextResponse.json({ success: true, data: report, message })
  } catch (error) {
    console.error('POST API error:', error)
    const message = (error as any)?.message || 'Internal server error'
    return NextResponse.json({ error: message, details: String(message) }, { status: 500 })
  }
}

// Helper to aggregate additional photos into daily_reports JSON fields if columns exist
async function aggregateAdditionalPhotos(db: any, reportId: string): Promise<void> {
  try {
    const { data: rows, error } = await db
      .from('daily_report_additional_photos')
      .select('photo_type, file_url, description, upload_order')
      .eq('daily_report_id', reportId)
      .order('upload_order', { ascending: true })

    if (error) return
    const before = [] as Array<{ url: string; description?: string; order: number }>
    const after = [] as Array<{ url: string; description?: string; order: number }>
    ;(rows || []).forEach((r: any) => {
      const item = {
        url: r.file_url,
        description: r.description || undefined,
        order: r.upload_order || 0,
      }
      if (r.photo_type === 'before') before.push(item)
      else if (r.photo_type === 'after') after.push(item)
    })

    // Try to update JSON columns if present; ignore if columns don't exist in this schema
    await db
      .from('daily_reports')
      .update({ additional_before_photos: before, additional_after_photos: after })
      .eq('id', reportId)
  } catch (e) {
    // swallow
  }
}
