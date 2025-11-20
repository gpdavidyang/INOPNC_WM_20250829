import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const ADMIN_ROLES = new Set(['admin', 'system_admin'])

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) {
      return auth
    }

    if (!ADMIN_ROLES.has(auth.role || '')) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const supabase = createClient()
    let serviceSupabase = supabase
    let hasServiceClient = false
    try {
      serviceSupabase = createServiceClient()
      hasServiceClient = true
    } catch (error) {
      console.warn(
        '[communication overview] service client unavailable, falling back to session client'
      )
    }
    const { searchParams } = new URL(request.url)
    const mode = (searchParams.get('mode') || 'announcements').toLowerCase()
    const search = (searchParams.get('search') || '').trim()
    const targetRole = (searchParams.get('targetRole') || '').trim()
    const pageParam = Number.parseInt(searchParams.get('page') || '1', 10)
    const pageSizeParam = Number.parseInt(searchParams.get('pageSize') || '', 10)
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
    const defaultSize = mode === 'logs' ? 20 : 50
    const pageSize =
      Number.isFinite(pageSizeParam) && pageSizeParam > 0
        ? Math.min(pageSizeParam, 200)
        : defaultSize

    if (mode === 'logs') {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      const siteMapCache: Record<string, string> = {}
      let siteMapLoaded = false
      const loadSiteMap = async () => {
        if (!siteMapLoaded) {
          const { data: siteRows } = await supabase.from('sites').select('id, name')
          siteRows?.forEach(site => {
            if (site?.id) siteMapCache[site.id] = site?.name || site.id
          })
          siteMapLoaded = true
        }
        return siteMapCache
      }

      if (hasServiceClient) {
        let query = serviceSupabase
          .from('communication_overview_v')
          .select(
            `
            log_id,
            log_notification_type,
            log_title,
            log_body,
            log_status,
            log_sent_at,
            log_user_id,
            log_target_role,
            log_target_site_id,
            log_target_site_name,
            log_target_partner_company_id,
            log_target_partner_company_name,
            announcement_id,
            announcement_title,
            announcement_created_at,
            dispatch_id,
            dispatch_batch_id,
            dispatch_status,
            dispatch_created_at,
            log_is_starred,
            latest_engagement_type
          `,
            { count: 'exact' }
          )
          .order('log_sent_at', { ascending: false, nullsLast: true })
          .order('dispatch_created_at', { ascending: false, nullsLast: true })
          .order('announcement_created_at', { ascending: false, nullsLast: true })

        if (search) {
          const filterValue = search.replace(/'/g, "''")
          query = query.or(
            [
              `log_title.ilike.%${filterValue}%`,
              `log_body.ilike.%${filterValue}%`,
              `announcement_title.ilike.%${filterValue}%`,
              `log_notification_type.ilike.%${filterValue}%`,
            ].join(',')
          )
        }

        if (targetRole) {
          query = query.eq('log_target_role', targetRole)
        }

        const { data, error, count } = await query.range(from, to)

        if (!error) {
          const logs =
            data?.map(row => {
              const fallbackId = row.dispatch_id || row.announcement_id
              const sentAt =
                row.log_sent_at || row.dispatch_created_at || row.announcement_created_at
              const status = row.log_status || row.dispatch_status || 'pending'
              return {
                id: row.log_id || fallbackId,
                notification_type: row.log_notification_type || 'site_announcement',
                title: row.log_title || row.announcement_title,
                body: row.log_body || '',
                status,
                sent_at: sentAt,
                user_id: row.log_user_id,
                target_role: row.log_target_role,
                target_site_id: row.log_target_site_id,
                target_partner_company_id: row.log_target_partner_company_id,
                target_site_name: row.log_target_site_name,
                target_partner_company_name: row.log_target_partner_company_name,
                announcement_id: row.announcement_id,
                announcement_title: row.announcement_title,
                dispatch_id: row.dispatch_id,
                dispatch_batch_id: row.dispatch_batch_id,
                starred: Boolean(row.log_is_starred),
                has_delivery_log: Boolean(row.log_id),
                dispatch_status: row.dispatch_status,
              }
            }) || []

          if (logs.length > 0) {
            const initialStars = Object.fromEntries(
              logs
                .filter(log => log.id && log.has_delivery_log)
                .map(log => [log.id as string, Boolean(log.starred)])
            )

            return NextResponse.json({
              success: true,
              mode,
              total: count || logs.length,
              page,
              pageSize,
              logs,
              initialStars,
              filters: { targetRole },
            })
          }

          console.warn(
            '[communication overview] overview view returned no rows, falling back to raw tables'
          )
        }

        console.error('[communication overview] logs query failed (service):', error)
      }

      // Fallback query using dispatches if service client unavailable or service query failed
      let dispatchQuery = supabase
        .from('announcement_dispatches')
        .select(
          `
          id,
          announcement_id,
          status,
          created_at,
          target_roles,
          target_site_ids,
          announcement:announcements (
            id,
            title,
            content,
            target_roles,
            target_sites,
            created_at
          )
        `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })

      if (search) {
        const filterValue = search.replace(/'/g, "''")
        dispatchQuery = dispatchQuery.or(
          [
            `announcement.title.ilike.%${filterValue}%`,
            `announcement.content.ilike.%${filterValue}%`,
          ].join(',')
        )
      }

      if (targetRole) {
        dispatchQuery = dispatchQuery.contains('target_roles', [targetRole])
      }

      const {
        data: dispatchData,
        error: dispatchError,
        count: dispatchCount,
      } = await dispatchQuery.range(from, to)

      if (dispatchError) {
        console.warn(
          '[communication overview] dispatch query unavailable, falling back to announcements:',
          dispatchError.message
        )
      }

      let fallbackLogs =
        (!dispatchError ? dispatchData : [])?.map(row => {
          const announcement = row.announcement as
            | {
                id: string
                title: string
                content?: string
                target_roles: string[] | null
                target_sites: string[] | null
                created_at: string
              }
            | null
            | undefined
          const primaryRole =
            (row.target_roles && row.target_roles[0]) ||
            (announcement?.target_roles && announcement.target_roles[0]) ||
            ''
          const primarySite =
            (row.target_site_ids && row.target_site_ids[0]) ||
            (announcement?.target_sites && announcement.target_sites[0]) ||
            null
          return {
            id: row.id,
            notification_type: 'site_announcement',
            title: announcement?.title || '공지',
            body: '',
            status: row.status || 'pending',
            sent_at: row.created_at,
            user_id: null,
            target_role: primaryRole,
            target_site_id: primarySite,
            target_partner_company_id: null,
            target_site_name: null,
            target_partner_company_name: null,
            announcement_id: row.announcement_id,
            announcement_title: announcement?.title || '공지',
            dispatch_id: row.id,
            dispatch_batch_id: null,
            starred: false,
            has_delivery_log: false,
            dispatch_status: row.status || 'pending',
          }
        }) || []

      if (fallbackLogs.length) {
        const siteMap = await loadSiteMap()
        fallbackLogs = fallbackLogs.map(log => {
          const siteId = log.target_site_id as string | null
          return {
            ...log,
            target_site_name: siteId ? siteMap[siteId] || siteId : null,
          }
        })
      }

      if (dispatchError || !fallbackLogs?.length) {
        let announcementsQuery = supabase
          .from('announcements')
          .select(
            `
            id,
            title,
            content,
            target_roles,
            target_sites,
            created_at
          `,
            { count: 'exact' }
          )
          .order('created_at', { ascending: false })

        if (search) {
          const filterValue = search.replace(/'/g, "''")
          announcementsQuery = announcementsQuery.or(
            `title.ilike.%${filterValue}%,content.ilike.%${filterValue}%`
          )
        }

        if (targetRole) {
          announcementsQuery = announcementsQuery.contains('target_roles', [targetRole])
        }

        const {
          data: announcementRows,
          error: announcementError,
          count: announcementCount,
        } = await announcementsQuery.range(from, to)

        if (announcementError) {
          console.error(
            '[communication overview] fallback announcements query failed:',
            announcementError
          )
          return NextResponse.json({
            success: true,
            mode,
            total: 0,
            page,
            pageSize,
            logs: [],
            initialStars: {},
            filters: { targetRole },
          })
        }

        const siteMap = await loadSiteMap()
        fallbackLogs =
          announcementRows?.map(row => {
            const siteId = row.target_sites?.[0] || null
            return {
              id: row.id,
              notification_type: 'site_announcement',
              title: row.title || '공지',
              body: row.content || '',
              status: 'pending',
              sent_at: row.created_at,
              user_id: null,
              target_role: row.target_roles?.[0] || '',
              target_site_id: siteId,
              target_partner_company_id: null,
              target_site_name: siteId ? siteMap[siteId] || siteId : null,
              target_partner_company_name: null,
              announcement_id: row.id,
              announcement_title: row.title || '공지',
              dispatch_id: null,
              dispatch_batch_id: null,
              starred: false,
              has_delivery_log: false,
              dispatch_status: 'pending',
            }
          }) || []

        return NextResponse.json({
          success: true,
          mode,
          total: announcementCount || fallbackLogs.length,
          page,
          pageSize,
          logs: fallbackLogs,
          initialStars: {},
          filters: { targetRole },
        })
      }

      return NextResponse.json({
        success: true,
        mode,
        total: dispatchCount || fallbackLogs.length,
        page,
        pageSize,
        logs: fallbackLogs,
        initialStars: {},
        filters: { targetRole },
      })
    }

    let announcementsQuery = supabase
      .from('announcements')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (search) {
      const filterValue = search.replace(/'/g, "''")
      announcementsQuery = announcementsQuery.or(
        `title.ilike.%${filterValue}%,content.ilike.%${filterValue}%`
      )
    }

    const { data: announcements, error: announcementsError, count } = await announcementsQuery

    if (announcementsError) {
      console.error('[communication overview] announcements query failed:', announcementsError)
      return NextResponse.json(
        { success: false, error: 'Failed to load announcements' },
        { status: 500 }
      )
    }

    const activeCount = (announcements || []).filter(a => a?.is_active).length

    return NextResponse.json({
      success: true,
      mode,
      announcements: announcements || [],
      stats: {
        total: count || announcements?.length || 0,
        active: activeCount,
      },
    })
  } catch (error) {
    console.error('[communication overview] unexpected error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
