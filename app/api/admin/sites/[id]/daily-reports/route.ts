import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

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

        return { ...r, worker_count, document_count, total_manhours }
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
