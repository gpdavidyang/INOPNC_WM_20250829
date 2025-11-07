import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { withSignedPhotoUrls } from '@/lib/admin/site-photos'

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

    const siteId = params.id
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const date = searchParams.get('date') // YYYY-MM or YYYY-MM-DD
    const q = (searchParams.get('q') || '').trim()
    const sort = (searchParams.get('sort') as 'date' | 'status' | 'workers') || 'date'
    const order = (searchParams.get('order') as 'asc' | 'desc') || 'desc'
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50')))
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'))

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
        before_photos,
        after_photos,
        additional_before_photos,
        additional_after_photos,
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
        metadata: Record<string, unknown> | null
      }
    >()

    if (authorIds.length > 0) {
      const { data: authorProfiles, error: authorProfilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, metadata')
        .in('id', authorIds)

      if (authorProfilesError) {
        console.warn('[admin/sites/:id/daily-reports] failed to load author profiles', {
          error: authorProfilesError.message,
        })
      } else if (Array.isArray(authorProfiles)) {
        authorProfiles.forEach(profile => {
          if (!profile?.id) return
          const metadata =
            profile?.metadata && typeof profile.metadata === 'object'
              ? (profile.metadata as Record<string, unknown>)
              : null
          let resolvedName = typeof profile?.full_name === 'string' ? profile.full_name.trim() : ''
          if (!resolvedName && metadata) {
            const nameKeys = ['full_name', 'name', 'name_ko', 'korean_name', 'display_name']
            for (const key of nameKeys) {
              const value = metadata[key]
              if (typeof value === 'string' && value.trim()) {
                resolvedName = value.trim()
                break
              }
            }
          }
          if (!resolvedName && typeof profile?.email === 'string') {
            const [local] = profile.email.split('@')
            if (local) resolvedName = local
          }
          authorProfilesMap.set(profile.id, {
            id: profile.id,
            full_name: resolvedName || profile?.full_name || '',
            email: typeof profile?.email === 'string' ? profile.email : null,
            metadata,
          })
        })
      }
    }

    const reportIds = list
      .map((r: any) => (typeof r?.id === 'string' ? r.id : null))
      .filter((id): id is string => Boolean(id))

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
        let worker_count = Number(r.total_workers)
        if (!Number.isFinite(worker_count)) {
          const { count } = await supabase
            .from('daily_report_workers')
            .select('id', { count: 'exact', head: true })
            .eq('daily_report_id', r.id)
          worker_count = count || 0
        }

        let total_manhours = 0
        try {
          const { data: wr } = await supabase
            .from('work_records')
            .select('labor_hours')
            .eq('daily_report_id', r.id)
          total_manhours = (wr || []).reduce(
            (s: number, w: any) => s + (Number(w.labor_hours) || 0),
            0
          )
        } catch {
          total_manhours = 0
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
          total_manhours,
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
