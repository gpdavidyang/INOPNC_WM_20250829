import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { calculateWorkerCount } from '@/lib/labor/labor-hour-options'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * Aggregates photos from various sources into the standard photo columns
 */
async function aggregateAdditionalPhotos(supabase: any, reportId: string) {
  try {
    const { data: attachments } = await supabase
      .from('document_attachments')
      .select('file_url, document_type')
      .eq('daily_report_id', reportId)

    if (!attachments || attachments.length === 0) return

    const photoUrls = attachments
      .filter((a: any) => (a.document_type || '').toLowerCase() === 'photo')
      .map((a: any) => a.file_url)

    if (photoUrls.length > 0) {
      // In some schemas, these might be JSON or text arrays. We attempt both.
      await supabase
        .from('daily_reports')
        .update({
          after_photos: photoUrls.length > 0 ? photoUrls : null,
        })
        .eq('id', reportId)
    }
  } catch (e) {
    console.warn('[aggregateAdditionalPhotos] warning:', e)
  }
}

/**
 * Enriches daily reports with related site and profile data
 */
async function enrichReports(reports: any[], supabase: any) {
  if (!reports.length) return reports

  const siteIds = Array.from(new Set(reports.map(r => r.site_id).filter(Boolean)))
  const authorIds = Array.from(new Set(reports.map(r => r.created_by).filter(Boolean)))
  const reportIds = reports.map(r => r.id)
  const reportIdSet = new Set(reportIds.map(id => String(id)))

  try {
    const [
      sitesResult,
      profilesResult,
      assignmentsResult,
      materialsResult,
      attachmentsResult,
      additionalPhotosResult,
      sharedByLinkedWorklogResult,
      sharedByDailyReportIdResult,
      sharedByLinkedArrayResult,
      directMarkupsResult,
      markupLinksResult,
    ] = await Promise.all([
      siteIds.length
        ? supabase
            .from('sites')
            .select('id, name, address, status, organization_id, organizations(name)')
            .in('id', siteIds)
        : Promise.resolve({ data: [] }),
      authorIds.length
        ? supabase.from('profiles').select('id, full_name').in('id', authorIds)
        : Promise.resolve({ data: [] }),
      supabase.from('worker_assignments').select('*').in('daily_report_id', reportIds),
      supabase.from('material_usage').select('*').in('daily_report_id', reportIds),
      supabase
        .from('document_attachments')
        .select('id, daily_report_id, file_url, file_name, file_size, uploaded_at, document_type')
        .in('daily_report_id', reportIds),
      supabase
        .from('daily_report_additional_photos')
        .select('id, daily_report_id, file_url, file_name, file_size, created_at, photo_type')
        .in('daily_report_id', reportIds),
      supabase
        .from('unified_document_system')
        .select('id, title, file_url, file_name, created_at, metadata, sub_category')
        .eq('category_type', 'shared')
        .eq('status', 'active')
        .eq('is_archived', false)
        .in('metadata->>linked_worklog_id', reportIds),
      supabase
        .from('unified_document_system')
        .select('id, title, file_url, file_name, created_at, metadata, sub_category')
        .eq('category_type', 'shared')
        .eq('status', 'active')
        .eq('is_archived', false)
        .in('metadata->>daily_report_id', reportIds),
      siteIds.length
        ? supabase
            .from('unified_document_system')
            .select('id, title, file_url, file_name, created_at, metadata, sub_category, site_id')
            .eq('category_type', 'shared')
            .eq('status', 'active')
            .eq('is_archived', false)
            .in('site_id', siteIds)
            .not('metadata->linked_worklog_ids', 'is', null)
            .order('created_at', { ascending: false })
            .limit(2000)
        : Promise.resolve({ data: [] }),
      supabase
        .from('markup_documents')
        .select(
          'id, title, original_blueprint_url, preview_image_url, created_at, linked_worklog_id'
        )
        .in('linked_worklog_id', reportIds)
        .eq('is_deleted', false)
        .not('original_blueprint_url', 'is', null),
      supabase
        .from('markup_document_worklog_links')
        .select('worklog_id, markup_document_id')
        .in('worklog_id', reportIds),
    ])

    const siteMap = new Map(sitesResult.data?.map((s: any) => [s.id, s]) || [])
    const profileMap = new Map(profilesResult.data?.map((p: any) => [p.id, p]) || [])
    const assignmentsRaw = assignmentsResult.data || []
    const attachmentsRaw = attachmentsResult.data || []
    const additionalPhotosRaw = additionalPhotosResult.data || []
    const sharedDocsRaw = [
      ...(sharedByLinkedWorklogResult.data || []),
      ...(sharedByDailyReportIdResult.data || []),
      ...(sharedByLinkedArrayResult.data || []),
    ]
    const sharedDocsDeduped = Array.from(
      new Map(sharedDocsRaw.map((row: any) => [row?.id, row])).values()
    )
    const directMarkupsRaw = directMarkupsResult.data || []
    const markupLinksRaw = markupLinksResult.data || []

    const attachmentsByReport = new Map<string, any[]>()
    for (const row of attachmentsRaw) {
      const reportId = row?.daily_report_id
      if (!reportId) continue
      if (!attachmentsByReport.has(reportId)) attachmentsByReport.set(reportId, [])
      attachmentsByReport.get(reportId)!.push(row)
    }

    const additionalPhotosByReport = new Map<string, any[]>()
    for (const row of additionalPhotosRaw) {
      const reportId = row?.daily_report_id
      if (!reportId) continue
      if (!additionalPhotosByReport.has(reportId)) additionalPhotosByReport.set(reportId, [])
      additionalPhotosByReport.get(reportId)!.push(row)
    }

    const sharedDrawingsByReport = new Map<string, any[]>()
    for (const row of sharedDocsDeduped) {
      const metadata =
        row?.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
          ? (row.metadata as Record<string, any>)
          : {}
      const linkedWorklogId =
        typeof metadata.linked_worklog_id === 'string' ? metadata.linked_worklog_id : null
      const dailyReportId =
        typeof metadata.daily_report_id === 'string' ? metadata.daily_report_id : null
      const linkedArray: string[] = Array.isArray(metadata.linked_worklog_ids)
        ? metadata.linked_worklog_ids.filter((v: any) => typeof v === 'string')
        : []
      const candidateIds = Array.from(
        new Set(
          [linkedWorklogId, dailyReportId, ...linkedArray]
            .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
            .map(String)
        )
      ).filter(id => reportIdSet.has(id))
      if (candidateIds.length === 0) continue

      const rawType =
        row?.sub_category ||
        metadata?.document_type ||
        metadata?.documentType ||
        metadata?.document_type ||
        metadata?.sub_category
      const normalizedType = String(rawType || '')
        .trim()
        .toLowerCase()
      const isDrawing =
        normalizedType.includes('drawing') ||
        normalizedType.includes('blueprint') ||
        normalizedType.includes('도면') ||
        normalizedType.includes('progress') ||
        normalizedType.includes('completion') ||
        normalizedType.includes('done') ||
        normalizedType.includes('final') ||
        normalizedType.includes('완료')
      if (!isDrawing) continue

      candidateIds.forEach(reportId => {
        if (!sharedDrawingsByReport.has(reportId)) sharedDrawingsByReport.set(reportId, [])
        sharedDrawingsByReport.get(reportId)!.push(row)
      })
    }

    const directMarkupsByReport = new Map<string, any[]>()
    for (const row of directMarkupsRaw) {
      const reportId = row?.linked_worklog_id
      if (!reportId) continue
      if (!directMarkupsByReport.has(reportId)) directMarkupsByReport.set(reportId, [])
      directMarkupsByReport.get(reportId)!.push(row)
    }

    const linkRowsByReport = new Map<string, any[]>()
    const linkedMarkupIds = Array.from(
      new Set(
        markupLinksRaw
          .map((r: any) =>
            typeof r?.markup_document_id === 'string' ? r.markup_document_id : null
          )
          .filter(Boolean)
      )
    )
    for (const row of markupLinksRaw) {
      const reportId = row?.worklog_id
      if (!reportId) continue
      if (!linkRowsByReport.has(reportId)) linkRowsByReport.set(reportId, [])
      linkRowsByReport.get(reportId)!.push(row)
    }

    let linkedMarkups: any[] = []
    if (linkedMarkupIds.length > 0) {
      const { data } = await supabase
        .from('markup_documents')
        .select('id, title, original_blueprint_url, preview_image_url, created_at')
        .in('id', linkedMarkupIds)
        .eq('is_deleted', false)
        .not('original_blueprint_url', 'is', null)
      linkedMarkups = data || []
    }
    const linkedMarkupMap = new Map(linkedMarkups.map((m: any) => [m.id, m]))

    // Fetch profiles for assignments as well
    const assignmentProfileIds = Array.from(
      new Set(assignmentsRaw.map((a: any) => a.profile_id).filter(Boolean))
    )
    let assignmentProfiles: any[] = []
    if (assignmentProfileIds.length > 0) {
      const { data: apData } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('id', assignmentProfileIds)
      assignmentProfiles = apData || []
    }
    const assignmentProfileMap = new Map(assignmentProfiles.map((p: any) => [p.id, p]))

    return reports.map(report => {
      const enriched = { ...report }
      enriched.sites = siteMap.get(report.site_id) || null
      enriched.profiles = profileMap.get(report.created_by) || null
      enriched.worker_assignments = assignmentsRaw
        .filter((a: any) => a.daily_report_id === report.id)
        .map((a: any) => ({
          ...a,
          profiles: assignmentProfileMap.get(a.profile_id) || null,
        }))
      const baseAttachments = attachmentsByReport.get(report.id) || []

      const additionalPhotos = (additionalPhotosByReport.get(report.id) || []).map((p: any) => ({
        id: `additional-photo-${p.id}`,
        daily_report_id: report.id,
        file_url: p.file_url,
        file_name: p.file_name,
        file_size: p.file_size,
        uploaded_at: p.created_at,
        document_type: 'photo',
        metadata: { source: 'daily_report_additional_photos', photo_type: p.photo_type },
      }))

      const sharedDrawings = (sharedDrawingsByReport.get(report.id) || []).map((doc: any) => ({
        id: `linked-shared-${doc.id}`,
        daily_report_id: report.id,
        file_url: doc.file_url,
        file_name: doc.title || doc.file_name || '도면',
        file_size: 0,
        uploaded_at: doc.created_at,
        document_type: 'drawing',
        metadata: {
          source: 'unified_document_system',
          document_id: doc.id,
          sub_category: doc.sub_category,
        },
      }))

      const drawingMap = new Map<string, any>()
      ;(directMarkupsByReport.get(report.id) || []).forEach((m: any) => {
        if (m?.id) drawingMap.set(m.id, m)
      })
      ;(linkRowsByReport.get(report.id) || []).forEach((row: any) => {
        const markupId = row?.markup_document_id
        const doc = markupId ? linkedMarkupMap.get(markupId) : null
        if (doc?.id) drawingMap.set(doc.id, doc)
      })
      const linkedDrawings = Array.from(drawingMap.values()).map((m: any) => ({
        id: `linked-drawing-${m.id}`,
        daily_report_id: report.id,
        file_url: m.original_blueprint_url,
        file_name: m.title || '도면',
        file_size: 0,
        uploaded_at: m.created_at,
        document_type: 'drawing',
        metadata: {
          source: 'markup_documents',
          markup_document_id: m.id,
          preview_image_url: m.preview_image_url,
        },
      }))

      enriched.document_attachments = [
        ...baseAttachments,
        ...additionalPhotos,
        ...sharedDrawings,
        ...linkedDrawings,
      ]
      enriched.material_usage =
        materialsResult.data?.filter((m: any) => m.daily_report_id === report.id) || []
      return enriched
    })
  } catch (error) {
    console.error('[enrichReports] error:', error)
    return reports
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) return authResult

    const supabase = createClient()
    let serviceClient: any = null
    try {
      serviceClient = createServiceRoleClient()
    } catch {
      serviceClient = supabase
    }

    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('site_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = supabase.from('daily_reports').select('*', { count: 'exact' })

    if (siteId) query = query.eq('site_id', siteId)
    if (startDate) query = query.gte('work_date', startDate)
    if (endDate) query = query.lte('work_date', endDate)
    if (status) query = query.eq('status', status)

    const { data, count, error } = await query
      .order('work_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    // Use service client for enrichment to bypass potential RLS constraints on joins
    const enriched = await enrichReports(data || [], serviceClient)

    return NextResponse.json({
      success: true,
      data: {
        reports: enriched,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        currentPage: page,
      },
    })
  } catch (error: any) {
    console.error('[GET /api/mobile/daily-reports] error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) return authResult

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
      workers = [],
      main_manpower = 0,
      additional_manpower = [],
      author_id = null,
      author_name = null,
      notes,
      safety_notes,
      materials = [],
    } = body

    console.log('[POST /api/mobile/daily-reports] Payload:', JSON.stringify(body, null, 2))

    if (!site_id || !work_date) {
      return NextResponse.json({ error: 'site_id and work_date are required' }, { status: 400 })
    }

    const supabase = createClient()
    let serviceClient: any = null
    try {
      serviceClient = createServiceRoleClient()
    } catch {
      serviceClient = createClient()
    }

    // Prepare effective workers
    let effectiveWorkers = Array.isArray(workers) && workers.length > 0 ? [...workers] : []
    if (effectiveWorkers.length === 0) {
      // Try to parse profiles if they are in additional_manpower
      if (Number(main_manpower) > 0) {
        effectiveWorkers.push({
          id: author_id || authResult.userId,
          name: author_name || '작업자',
          hours: Number(main_manpower) * 8,
          is_main: true,
        })
      }
      if (Array.isArray(additional_manpower)) {
        additional_manpower.forEach((am: any) => {
          if (Number(am.manpower) > 0) {
            effectiveWorkers.push({
              id: am.id || am.workerId || null,
              name: am.name || am.workerName || '추가 작업자',
              hours: Number(am.manpower) * 8,
              is_main: false,
            })
          }
        })
      }
    }

    const totalManpowerSum = effectiveWorkers.reduce(
      (sum, w) => sum + (Number(w.hours) || 0) / 8,
      0
    )
    const reportTotalWorkers = calculateWorkerCount(totalManpowerSum) || Number(total_workers) || 1

    // 1. Create or get report
    const { data: existing } = await serviceClient
      .from('daily_reports')
      .select('id')
      .eq('site_id', site_id)
      .eq('work_date', work_date)
      .maybeSingle()

    let reportId = existing?.id
    let reportData: any = null

    const primaryMemberType =
      Array.isArray(member_types) && member_types.length > 0 ? member_types[0] : null
    const primaryProcess = Array.isArray(processes) && processes.length > 0 ? processes[0] : null

    const basePayload: any = {
      site_id,
      work_date,
      work_description,
      member_name: author_name || '작업자',
      total_workers: reportTotalWorkers,
      total_labor_hours: totalManpowerSum * 8,
      status,
      updated_at: new Date().toISOString(),
      component_name: primaryMemberType,
      process_type: primaryProcess,
      work_process: Array.isArray(processes) ? processes.join(', ') : null,
      work_section: Array.isArray(work_types) ? work_types.join(', ') : null,
      special_notes: notes,
      safety_notes: safety_notes,
      location_info: location,
      additional_notes: JSON.stringify({
        tasks,
        materials,
        effectiveWorkers,
      }),
      work_content: {
        memberTypes: member_types,
        workProcesses: processes,
        workTypes: work_types,
        tasks,
        materials,
        workers: effectiveWorkers,
      },
      member_types,
    }

    if (reportId) {
      // Update with progressive retry to handle schema variations
      let updatePayload = { ...basePayload }
      const removable = [
        'location_info',
        'additional_notes',
        'safety_notes',
        'special_notes',
        'work_description',
        'component_name',
        'process_type',
        'work_process',
        'work_section',
        'work_content',
        'member_types',
      ]

      let lastError: any = null
      for (let i = 0; i < 10; i++) {
        const { data, error } = await serviceClient
          .from('daily_reports')
          .update(updatePayload)
          .eq('id', reportId)
          .select('*')
          .single()

        if (!error) {
          reportData = data
          break
        }

        lastError = error
        console.error(`[POST] Update attempt ${i + 1} failed:`, error.message)

        const msg = error.message.toLowerCase()
        const match =
          msg.match(/column "(.*?)" does not exist/i) ||
          msg.match(/'(.*?)' column of 'daily_reports'/i)
        const col = match?.[1]
        if (col && removable.includes(col)) {
          console.log(`[POST] Removing column '${col}' and retrying update...`)
          delete (updatePayload as any)[col]
          continue
        }
        break
      }
      if (!reportData && lastError) {
        console.error('[POST] Update failed finally with:', lastError)
      }
    } else {
      // Insert with progressive retry
      let insertPayload = {
        ...basePayload,
        created_by: authResult.userId,
        created_at: new Date().toISOString(),
      }
      const removable = [
        'location_info',
        'additional_notes',
        'safety_notes',
        'special_notes',
        'work_description',
        'component_name',
        'process_type',
        'work_process',
        'work_section',
        'work_content',
        'member_types',
      ]

      let lastError: any = null
      for (let i = 0; i < 10; i++) {
        const { data, error } = await serviceClient
          .from('daily_reports')
          .insert(insertPayload)
          .select('*')
          .single()

        if (!error) {
          reportData = data
          reportId = data.id
          break
        }

        lastError = error
        console.error(`[POST] Insert attempt ${i + 1} failed:`, error.message)

        const msg = error.message.toLowerCase()
        const match =
          msg.match(/column "(.*?)" does not exist/i) ||
          msg.match(/'(.*?)' column of 'daily_reports'/i)
        const col = match?.[1]
        if (col && removable.includes(col)) {
          console.log(`[POST] Removing column '${col}' and retrying insert...`)
          delete (insertPayload as any)[col]
          continue
        }
        break
      }
      if (!reportId && lastError) {
        console.error('[POST] Insert failed finally with:', lastError)
        throw new Error(`Failed to create daily report: ${lastError.message}`)
      }
    }

    if (!reportId) {
      throw new Error('Failed to create or update daily report record.')
    }

    // 2. Clear and Insert Workers
    await serviceClient.from('worker_assignments').delete().eq('daily_report_id', reportId)
    if (effectiveWorkers.length > 0) {
      const workerRows = effectiveWorkers.map(w => ({
        daily_report_id: reportId,
        profile_id: w.id && w.id.length > 30 ? w.id : null,
        worker_name: w.name || '미정',
        hours: Number(w.hours) || 0,
        work_hours: Number(w.hours) || 0,
        labor_hours: (Number(w.hours) || 0) / 8,
      }))

      // Try insert, ignore errors for optional columns by wrapping each or using a safe subset
      try {
        await serviceClient.from('worker_assignments').insert(workerRows)
      } catch (e) {
        const minimalRows = workerRows.map(r => ({
          daily_report_id: r.daily_report_id,
          profile_id: r.profile_id,
          worker_name: r.worker_name,
          hours: r.hours,
          work_hours: r.work_hours,
          labor_hours: r.labor_hours,
        }))
        await serviceClient
          .from('worker_assignments')
          .insert(minimalRows)
          .catch((err: any) => {
            console.error('CRITICAL: Worker insert failed even with minimal columns:', err)
          })
      }
    }

    // 3. Clear and Insert Materials
    await serviceClient.from('material_usage').delete().eq('daily_report_id', reportId)
    const filteredMaterials = (materials || []).filter((m: any) => m.material_name?.trim())
    if (filteredMaterials.length > 0) {
      const materialRowsValue = filteredMaterials.map((m: any) => ({
        daily_report_id: reportId,
        material_name: m.material_name,
        quantity: Number(m.quantity) || 0,
        quantity_val: Number(m.quantity_val) || Number(m.quantity) || 0,
        amount: Number(m.amount) || Number(m.quantity) || 0,
        unit: m.unit || null,
        notes: m.notes || null,
        material_type: String(m.material_code || m.material_name || '').toUpperCase(),
      }))

      try {
        await serviceClient.from('material_usage').insert(materialRowsValue)
      } catch (e) {
        console.warn('Material insert failed:', e)
      }
    }

    // 4. Photos
    if (status === 'submitted') {
      await aggregateAdditionalPhotos(serviceClient, reportId)
    }

    return NextResponse.json({
      success: true,
      data: reportData,
      message: '작업일지가 성공적으로 저장되었습니다.',
    })
  } catch (error: any) {
    console.error('[POST /api/mobile/daily-reports] error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
