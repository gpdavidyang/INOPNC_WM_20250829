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

  try {
    const [sitesResult, profilesResult, assignmentsResult, materialsResult] = await Promise.all([
      siteIds.length
        ? supabase.from('sites').select('id, name').in('id', siteIds)
        : Promise.resolve({ data: [] }),
      authorIds.length
        ? supabase.from('profiles').select('id, full_name').in('id', authorIds)
        : Promise.resolve({ data: [] }),
      supabase.from('worker_assignments').select('*').in('daily_report_id', reportIds),
      supabase.from('material_usage').select('*').in('daily_report_id', reportIds),
    ])

    const siteMap = new Map(sitesResult.data?.map((s: any) => [s.id, s]) || [])
    const profileMap = new Map(profilesResult.data?.map((p: any) => [p.id, p]) || [])
    const assignmentsRaw = assignmentsResult.data || []

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
        tasks,
        materials,
        workers: effectiveWorkers,
      },
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
      ]

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

        const msg = error.message.toLowerCase()
        const match =
          msg.match(/column "(.*?)" does not exist/i) ||
          msg.match(/'(.*?)' column of 'daily_reports'/i)
        const col = match?.[1]
        if (col && removable.includes(col)) {
          delete (updatePayload as any)[col]
          continue
        }
        break
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
      ]

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

        const msg = error.message.toLowerCase()
        const match =
          msg.match(/column "(.*?)" does not exist/i) ||
          msg.match(/'(.*?)' column of 'daily_reports'/i)
        const col = match?.[1]
        if (col && removable.includes(col)) {
          delete (insertPayload as any)[col]
          continue
        }
        break
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
