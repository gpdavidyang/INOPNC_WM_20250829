import { withSignedPhotoUrls } from '@/lib/admin/site-photos'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (!['admin', 'system_admin', 'site_manager'].includes(authResult.role || '')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = (() => {
      try {
        return createServiceClient()
      } catch {
        return createClient()
      }
    })()
    const svc = supabase

    const siteId = params.id
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const date = searchParams.get('date') // YYYY-MM or YYYY-MM-DD
    const q = (searchParams.get('q') || '').trim()
    const sort = (searchParams.get('sort') as 'date' | 'status' | 'workers') || 'date'
    const order = (searchParams.get('order') as 'asc' | 'desc') || 'desc'
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50')))
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'))

    const { data: siteRow } = await supabase
      .from('sites')
      .select('id,name,address,organization_id')
      .eq('id', siteId)
      .maybeSingle()
    const siteInfo = siteRow
      ? {
          id: String(siteRow.id),
          name: siteRow.name ?? null,
          address: siteRow.address ?? null,
          organization_id: siteRow.organization_id ?? null,
        }
      : null

    const orgId = siteInfo?.organization_id ? String(siteInfo.organization_id) : null
    const { data: orgRow } = orgId
      ? await supabase.from('organizations').select('id,name').eq('id', orgId).maybeSingle()
      : { data: null }
    const orgInfo = orgRow ? { id: String(orgRow.id), name: orgRow.name ?? null } : null

    // Build query - simplified to avoid foreign key issues
    let query = supabase
      .from('daily_reports')
      .select(
        `
        id,
        site_id,
        work_date,
        member_name,
        process_type,
        component_name,
        work_process,
        work_section,
        total_workers,
        npc1000_incoming,
        npc1000_used,
        npc1000_remaining,
        status,
        issues,
        created_at,
        updated_at,
        created_by
      `
      )
      .eq('site_id', siteId)

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (date) {
      // Support exact day or month prefix
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        query = query.eq('work_date', date)
      } else {
        const startDate = `${date}-01`
        const endDate = `${date}-31`
        query = query.gte('work_date', startDate).lte('work_date', endDate)
      }
    }

    if (q) {
      // Search in several text fields
      const pattern = `%${q}%`
      query = query.or(
        `member_name.ilike.${pattern},process_type.ilike.${pattern},component_name.ilike.${pattern},work_process.ilike.${pattern},work_section.ilike.${pattern}`
      )
    }

    // Sort
    if (sort === 'status') {
      query = query.order('status', { ascending: order === 'asc' })
    } else if (sort === 'workers') {
      query = query.order('total_workers', { ascending: order === 'asc', nullsFirst: false })
    } else {
      // date
      query = query.order('work_date', { ascending: order === 'asc', nullsFirst: false })
    }

    // Count total with same filters
    let countQuery = supabase
      .from('daily_reports')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', siteId)
    if (status && status !== 'all') countQuery = countQuery.eq('status', status)
    if (date) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) countQuery = countQuery.eq('work_date', date)
      else countQuery = countQuery.gte('work_date', `${date}-01`).lte('work_date', `${date}-31`)
    }
    if (q) {
      const pattern = `%${q}%`
      countQuery = countQuery.or(
        `member_name.ilike.${pattern},process_type.ilike.${pattern},component_name.ilike.${pattern},work_process.ilike.${pattern},work_section.ilike.${pattern}`
      )
    }
    const { count: totalCount } = await countQuery

    // Pagination
    query = query.range(offset, offset + limit - 1)

    let reports: any[] | null = null
    let error: any = null
    {
      const r = await query
      reports = r.data as any[] | null
      error = r.error
    }

    // Fallback: retry without photo JSON columns if columns don't exist in the schema
    if (error) {
      console.warn(
        '[admin/sites/:id/daily-reports] primary select failed, retrying with minimal fields:',
        error?.message
      )
      let fallback = supabase
        .from('daily_reports')
        .select(
          `
          id,
          site_id,
          work_date,
          member_name,
          process_type,
          component_name,
          work_process,
          work_section,
          total_workers,
          npc1000_incoming,
          npc1000_used,
          npc1000_remaining,
          status,
          issues,
          created_at,
          updated_at,
          created_by
        `
        )
        .eq('site_id', siteId)

      // Reapply filters to fallback query
      if (status && status !== 'all') fallback = fallback.eq('status', status)
      if (date) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) fallback = fallback.eq('work_date', date)
        else fallback = fallback.gte('work_date', `${date}-01`).lte('work_date', `${date}-31`)
      }
      if (q) {
        const pattern = `%${q}%`
        fallback = fallback.or(
          `member_name.ilike.${pattern},process_type.ilike.${pattern},component_name.ilike.${pattern},work_process.ilike.${pattern},work_section.ilike.${pattern}`
        )
      }
      if (sort === 'status') fallback = fallback.order('status', { ascending: order === 'asc' })
      else if (sort === 'workers')
        fallback = fallback.order('total_workers', {
          ascending: order === 'asc',
          nullsFirst: false,
        })
      else fallback = fallback.order('work_date', { ascending: order === 'asc', nullsFirst: false })

      fallback = fallback.range(offset, offset + limit - 1)

      const fr = await fallback
      if (fr.error) {
        console.error('Daily reports minimal query error:', fr.error)
        return NextResponse.json({ error: 'Failed to fetch daily reports' }, { status: 500 })
      }
      reports = fr.data as any[]
      error = null
    }

    // Get additional statistics for the site
    const { data: statsData } = await supabase
      .from('daily_reports')
      .select('status, total_workers')
      .eq('site_id', siteId)

    const statistics = {
      total_reports: statsData?.length || 0,
      submitted_reports: statsData?.filter((r: unknown) => r.status === 'submitted').length || 0,
      draft_reports: statsData?.filter((r: unknown) => r.status === 'draft').length || 0,
      total_workers:
        statsData?.reduce((sum: unknown, r: unknown) => sum + (r.total_workers || 0), 0) || 0,
    }

    // Enrich per report: worker_count, document_count, total_manhours
    const list = Array.isArray(reports) ? reports : []
    const authorIds = Array.from(
      new Set(
        list
          .map((r: any) => (typeof r?.created_by === 'string' ? r.created_by : null))
          .filter((id): id is string => Boolean(id))
      )
    )
    const authorProfilesMap = new Map<
      string,
      {
        id: string
        full_name: string
        email: string | null
      }
    >()

    if (authorIds.length > 0) {
      const { data: authorProfiles, error: authorProfilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', authorIds)

      if (authorProfilesError) {
        console.warn('[admin/sites/:id/daily-reports] failed to load author profiles', {
          error: authorProfilesError.message,
        })
      } else if (Array.isArray(authorProfiles)) {
        authorProfiles.forEach(profile => {
          if (!profile?.id) return
          let resolvedName = typeof profile?.full_name === 'string' ? profile.full_name.trim() : ''
          if (!resolvedName && typeof profile?.email === 'string') {
            const [local] = profile.email.split('@')
            if (local) resolvedName = local
          }
          authorProfilesMap.set(profile.id, {
            id: profile.id,
            full_name: resolvedName || profile?.full_name || '',
            email: typeof profile?.email === 'string' ? profile.email : null,
          })
        })
      }
    }

    const reportIds = list
      .map((r: any) => (typeof r?.id === 'string' ? r.id : null))
      .filter((id): id is string => Boolean(id))

    const attachmentCountMap = new Map<string, number>()
    if (reportIds.length > 0) {
      const { data: attachmentRows, error: attachmentError } = await supabase
        .from('document_attachments')
        .select('daily_report_id')
        .in('daily_report_id', reportIds)
      if (attachmentError) {
        console.warn(
          '[admin/sites/:id/daily-reports] failed to load document attachments:',
          attachmentError.message
        )
      } else if (Array.isArray(attachmentRows)) {
        attachmentRows.forEach(row => {
          if (!row?.daily_report_id) return
          const key = String(row.daily_report_id)
          attachmentCountMap.set(key, (attachmentCountMap.get(key) || 0) + 1)
        })
      }
    }

    type PhotoEntry = {
      url?: string | null
      path?: string | null
      storage_path?: string | null
      filename?: string | null
      description?: string | null
      upload_order?: number | null
      order?: number | null
      uploaded_by?: string | null
      uploaded_at?: string | null
      photo_type?: 'before' | 'after' | string | null
    }

    const fallbackPhotoMap = new Map<string, { before: PhotoEntry[]; after: PhotoEntry[] }>()
    if (reportIds.length > 0) {
      try {
        const { data: photoRows, error: photoError } = await supabase
          .from('daily_report_additional_photos')
          .select(
            `
              daily_report_id,
              photo_type,
              file_url,
              file_path,
              file_name,
              description,
              upload_order,
              uploaded_by,
              created_at
            `
          )
          .in('daily_report_id', reportIds)

        if (!photoError && Array.isArray(photoRows)) {
          const signingTasks: Promise<void>[] = []
          for (const row of photoRows) {
            if (!row?.daily_report_id) continue
            const bucket = String(row.photo_type) === 'after' ? 'after' : 'before'
            const entry: PhotoEntry = {
              url: row.file_url || null,
              path: row.file_path || null,
              storage_path: row.file_path || null,
              filename: row.file_name || null,
              description: row.description || null,
              upload_order: typeof row.upload_order === 'number' ? row.upload_order : null,
              order: typeof row.upload_order === 'number' ? row.upload_order : null,
              uploaded_by: row.uploaded_by || null,
              uploaded_at: row.created_at || null,
              photo_type: bucket as 'before' | 'after',
            }
            const existing = fallbackPhotoMap.get(row.daily_report_id) ?? {
              before: [] as PhotoEntry[],
              after: [] as PhotoEntry[],
            }
            existing[bucket as 'before' | 'after'].push(entry)
            fallbackPhotoMap.set(row.daily_report_id, existing)
          }

          fallbackPhotoMap.forEach((group, reportId) => {
            group.before.sort(
              (a, b) => (a.upload_order || a.order || 0) - (b.upload_order || b.order || 0)
            )
            group.after.sort(
              (a, b) => (a.upload_order || a.order || 0) - (b.upload_order || b.order || 0)
            )
            signingTasks.push(
              (async () => {
                const signedBefore =
                  group.before.length > 0 ? await withSignedPhotoUrls(group.before) : group.before
                const signedAfter =
                  group.after.length > 0 ? await withSignedPhotoUrls(group.after) : group.after
                fallbackPhotoMap.set(reportId, { before: signedBefore, after: signedAfter })
              })()
            )
          })
          await Promise.all(signingTasks)
        } else if (photoError) {
          console.warn(
            '[admin/sites/:id/daily-reports] additional photo fallback query error:',
            photoError
          )
        }
      } catch (photoQueryError) {
        console.warn(
          '[admin/sites/:id/daily-reports] failed to load fallback additional photos:',
          photoQueryError
        )
      }
    }

    const enriched = await Promise.all(
      list.map(async (r: any) => {
        // 1. Worker count: direct column first, then assignments count
        let worker_count = Number(r.total_workers) || 0

        // 2. Total manhours: Sum from assignments (new) or work_records (old)
        let total_manhours = 0
        try {
          const [{ count: assignmentCount }, { data: assignments }, { data: legacyRecords }] =
            await Promise.all([
              svc
                .from('worker_assignments')
                .select('id', { count: 'exact', head: true })
                .eq('daily_report_id', r.id),
              svc.from('worker_assignments').select('hours').eq('daily_report_id', r.id),
              svc.from('work_records').select('labor_hours').eq('daily_report_id', r.id),
            ])

          if (worker_count === 0) {
            worker_count = assignmentCount || 0
          }

          if (assignments && assignments.length > 0) {
            const assignmentHours = assignments.reduce(
              (s: number, a: any) => s + (Number(a.hours) || 0),
              0
            )
            total_manhours = normalizeManDaysFromHours(assignmentHours)
          } else if (legacyRecords && legacyRecords.length > 0) {
            const legacyManDays = legacyRecords.reduce(
              (s: number, w: any) => s + (Number(w.labor_hours) || 0),
              0
            )
            total_manhours = normalizeManDays(legacyManDays)
          }
        } catch (e) {
          console.error('Error calculating stats for report', r.id, e)
        }

        if (!total_manhours) {
          const fallbackHours = Number(r.total_labor_hours) || Number(r.total_hours)
          if (fallbackHours > 0) {
            total_manhours = normalizeManDaysFromHours(fallbackHours)
          } else {
            const fallbackWorkers = Number(r.total_workers)
            if (fallbackWorkers > 0) {
              total_manhours = normalizeManDays(fallbackWorkers)
            } else {
              total_manhours = normalizeManDays(extractManpowerFromContent(r.work_content))
            }
          }
        }

        let document_count = 0
        try {
          const day = r.work_date
          const start = `${day}T00:00:00`
          const end = `${day}T23:59:59`
          const { count: dcount } = await supabase
            .from('documents')
            .select('id', { count: 'exact', head: true })
            .eq('site_id', r.site_id)
            .gte('created_at', start)
            .lt('created_at', end)
          const { count: ucount } = await supabase
            .from('unified_document_system')
            .select('id', { count: 'exact', head: true })
            .eq('site_id', r.site_id)
            .eq('is_archived', false)
            .gte('created_at', start)
            .lt('created_at', end)
          document_count = (dcount || 0) + (ucount || 0)
        } catch {
          document_count = document_count || 0
        }

        if (!document_count) {
          document_count = attachmentCountMap.get(String(r.id)) || 0
        }

        const existingProfile =
          r?.created_by_profile && typeof r.created_by_profile === 'object'
            ? (r.created_by_profile as Record<string, unknown>)
            : null
        const createdByProfile =
          (typeof r?.created_by === 'string' && authorProfilesMap.get(r.created_by)) ||
          existingProfile ||
          null

        const fallbackPhotos = fallbackPhotoMap.get(r.id) || { before: [], after: [] }
        const mergedAdditionalBefore =
          Array.isArray(r.additional_before_photos) && r.additional_before_photos.length > 0
            ? r.additional_before_photos
            : fallbackPhotos.before
        const mergedAdditionalAfter =
          Array.isArray(r.additional_after_photos) && r.additional_after_photos.length > 0
            ? r.additional_after_photos
            : fallbackPhotos.after

        return {
          ...r,
          additional_before_photos: mergedAdditionalBefore,
          additional_after_photos: mergedAdditionalAfter,
          worker_count,
          document_count,
          worker_details_count: worker_count,
          daily_documents_count: document_count,
          total_manhours,
          sites: r?.sites ?? siteInfo,
          organization: r?.organization ?? orgInfo,
          created_by_profile: createdByProfile,
          profiles: createdByProfile ?? r?.profiles ?? null,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: enriched,
      total: totalCount ?? 0,
      statistics,
      filters: {
        site_id: siteId,
        status: status || 'all',
        date: date || null,
        q,
        sort,
        order,
        limit,
        offset,
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const normalizeManDaysFromHours = (hours: number): number => {
  if (!Number.isFinite(hours) || hours <= 0) return 0
  return Number((hours / 8).toFixed(1))
}

const normalizeManDays = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) return 0
  return Number(value.toFixed(1))
}

const extractManpowerFromContent = (raw: unknown): number => {
  if (!raw) return 0
  let parsed: any = raw
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = null
    }
  }
  if (!parsed || typeof parsed !== 'object') return 0
  const direct = Number(parsed?.totalManpower || parsed?.total_manpower)
  if (Number.isFinite(direct) && direct > 0) return direct

  const workersArray =
    (Array.isArray(parsed?.workers) && parsed.workers) ||
    (Array.isArray(parsed?.worker_entries) && parsed.worker_entries) ||
    []
  if (workersArray.length === 0) return 0

  const totalHours = workersArray.reduce((sum: number, worker: any) => {
    const hours = Number(worker?.hours ?? worker?.labor_hours ?? worker?.work_hours)
    if (Number.isFinite(hours) && hours > 0) {
      return sum + hours
    }
    return sum + 8
  }, 0)
  if (totalHours === 0) return workersArray.length
  return Number((totalHours / 8).toFixed(1))
}
