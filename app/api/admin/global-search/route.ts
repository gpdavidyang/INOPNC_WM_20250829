import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type SearchItemType = 'site' | 'user' | 'worklog' | 'document'

interface SearchItem {
  id: string
  type: SearchItemType
  title: string
  subtitle?: string
  description?: string
  url: string
  badge?: string
  badgeColor?: 'green' | 'blue' | 'yellow' | 'red' | 'gray'
}

const DEFAULT_LIMIT_ADMIN = 20
const DEFAULT_LIMIT_NON_ADMIN = 5
const MAX_LIMIT = 20

const siteStatusBadge: Record<string, { label: string; color: SearchItem['badgeColor'] }> = {
  active: { label: '진행중', color: 'blue' },
  planning: { label: '계획', color: 'yellow' },
  completed: { label: '완료', color: 'green' },
  inactive: { label: '중단', color: 'gray' },
}

const reportStatusBadge: Record<string, { label: string; color: SearchItem['badgeColor'] }> = {
  draft: { label: '임시', color: 'yellow' },
  submitted: { label: '제출', color: 'blue' },
  approved: { label: '승인', color: 'green' },
  completed: { label: '승인', color: 'green' },
  rejected: { label: '반려', color: 'red' },
}

const roleBadge: Record<string, { label: string; color: SearchItem['badgeColor'] }> = {
  admin: { label: '관리자', color: 'blue' },
  system_admin: { label: '시스템 관리자', color: 'blue' },
  site_manager: { label: '현장관리자', color: 'green' },
  production_manager: { label: '생산관리자', color: 'green' },
  worker: { label: '작업자', color: 'gray' },
  partner: { label: '파트너', color: 'gray' },
  customer_manager: { label: '고객사', color: 'gray' },
}

function escapeIlike(raw: string): string {
  return raw.replace(/[%_]/g, '\\$&').replace(/,/g, '\\,')
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) {
      return auth
    }

    const role = auth.role || ''
    const isAdmin = ['admin', 'system_admin'].includes(role)
    const isPartner = ['partner', 'customer_manager'].includes(role)
    const isSiteScoped = ['site_manager', 'production_manager'].includes(role)

    const { searchParams } = new URL(request.url)
    const rawQuery = (searchParams.get('q') || '').trim()
    const limitParam = Number(
      searchParams.get('limit') || (isAdmin ? DEFAULT_LIMIT_ADMIN : DEFAULT_LIMIT_NON_ADMIN)
    )
    const perTypeLimit = Math.max(
      1,
      Math.min(
        MAX_LIMIT,
        Number.isFinite(limitParam)
          ? limitParam
          : isAdmin
            ? DEFAULT_LIMIT_ADMIN
            : DEFAULT_LIMIT_NON_ADMIN
      )
    )

    if (!rawQuery) {
      return NextResponse.json({
        success: true,
        query: '',
        items: [],
        counts: { site: 0, user: 0, worklog: 0, document: 0 },
      })
    }

    const query = escapeIlike(rawQuery)
    const supabase = createClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id, partner_company_id, site_id')
      .eq('id', auth.userId)
      .maybeSingle()

    const allowedOrgId =
      auth.restrictedOrgId || profile?.organization_id || profile?.partner_company_id || null
    const allowedSiteIds: string[] = []

    if (profile?.site_id) {
      allowedSiteIds.push(profile.site_id)
    }

    if (isPartner && allowedOrgId) {
      const { data: orgSites } = await supabase
        .from('sites')
        .select('id')
        .eq('organization_id', allowedOrgId)
        .limit(200)
      if (orgSites) {
        orgSites.forEach(site => {
          if ((site as { id: string }).id) {
            allowedSiteIds.push((site as { id: string }).id)
          }
        })
      }
    }

    // If site-scoped role without explicit site list but with org, collect site ids for that org
    if (isSiteScoped && !allowedSiteIds.length && allowedOrgId) {
      const { data: orgSites } = await supabase
        .from('sites')
        .select('id')
        .eq('organization_id', allowedOrgId)
        .limit(200)
      if (orgSites) {
        orgSites.forEach(site => {
          if ((site as { id: string }).id) {
            allowedSiteIds.push((site as { id: string }).id)
          }
        })
      }
    }

    const hasSiteScope = allowedSiteIds.length > 0
    const siteFilterRequired = isPartner || isSiteScoped

    // Build queries with scope
    const siteQuery = supabase
      .from('sites')
      .select('id, name, address, status, organization_id')
      .or(`name.ilike.%${query}%,address.ilike.%${query}%`)
      .order('updated_at', { ascending: false })
      .limit(perTypeLimit)

    if (siteFilterRequired && !isAdmin) {
      if (hasSiteScope) {
        siteQuery.in('id', allowedSiteIds)
      } else if (allowedOrgId) {
        siteQuery.eq('organization_id', allowedOrgId)
      } else {
        // No scope → empty
        siteQuery.eq('id', '___none___')
      }
    } else if (!isAdmin && allowedOrgId) {
      siteQuery.eq('organization_id', allowedOrgId)
    }

    const userQuery =
      isAdmin && !isPartner
        ? supabase
            .from('profiles')
            .select('id, full_name, email, role, organization_id')
            .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
            .order('updated_at', { ascending: false })
            .limit(perTypeLimit)
        : null

    const worklogQuery = supabase
      .from('daily_reports')
      .select(
        'id, work_date, member_name, process_type, status, site:sites(id, name, organization_id)'
      )
      .or(
        [
          'member_name.ilike.%' + query + '%',
          'process_type.ilike.%' + query + '%',
          'work_description.ilike.%' + query + '%',
        ].join(',')
      )
      .order('work_date', { ascending: false })
      .limit(perTypeLimit)

    if (siteFilterRequired && !isAdmin) {
      if (hasSiteScope) {
        worklogQuery.in('site_id', allowedSiteIds)
      } else if (allowedOrgId) {
        worklogQuery.eq('site.organization_id', allowedOrgId)
      } else {
        worklogQuery.eq('site_id', '___none___')
      }
    } else if (!isAdmin && allowedOrgId) {
      worklogQuery.eq('site.organization_id', allowedOrgId)
    }

    const documentQuery = supabase
      .from('unified_document_system')
      .select(
        'id, title, file_name, description, category_type, status, site:sites(id, name, organization_id)'
      )
      .eq('is_archived', false)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,file_name.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(perTypeLimit)

    if (siteFilterRequired && !isAdmin) {
      if (hasSiteScope) {
        documentQuery.in('site_id', allowedSiteIds)
      } else if (allowedOrgId) {
        documentQuery.eq('site.organization_id', allowedOrgId)
      } else {
        documentQuery.eq('site_id', '___none___')
      }
    } else if (!isAdmin && allowedOrgId) {
      documentQuery.eq('site.organization_id', allowedOrgId)
    }

    const [sitesRes, usersRes, worklogsRes, documentsRes] = await Promise.all([
      siteQuery,
      userQuery,
      worklogQuery,
      documentQuery,
    ])

    const siteItems: SearchItem[] =
      sitesRes.data?.map(site => {
        const badgeMeta = site.status ? siteStatusBadge[site.status] : null
        return {
          id: site.id,
          type: 'site',
          title: site.name,
          subtitle: site.address || undefined,
          url: isAdmin ? `/dashboard/admin/sites/${site.id}` : `/mobile/sites/${site.id}`,
          badge: badgeMeta?.label,
          badgeColor: badgeMeta?.color,
        }
      }) || []

    const userItems: SearchItem[] =
      usersRes?.data?.map(user => {
        const badgeMeta = user.role ? roleBadge[user.role] : null
        return {
          id: user.id,
          type: 'user',
          title: user.full_name || '이름 미입력',
          subtitle: user.email || undefined,
          description: user.organization_id ? `조직: ${user.organization_id}` : undefined,
          url: `/dashboard/admin/users/${user.id}`,
          badge: badgeMeta?.label || user.role || undefined,
          badgeColor: badgeMeta?.color,
        }
      }) || []

    const worklogItems: SearchItem[] =
      worklogsRes.data?.map(report => {
        const badgeMeta = report.status ? reportStatusBadge[report.status] : null
        const siteName = (report as any)?.site?.name
        const basePath = isAdmin ? '/dashboard/admin/daily-reports' : '/mobile/daily-reports'
        return {
          id: report.id,
          type: 'worklog',
          title: `${report.work_date} • ${report.member_name || '작업일지'}`,
          subtitle: siteName ? `현장: ${siteName}` : undefined,
          description: report.process_type || undefined,
          url: `${basePath}/${report.id}`,
          badge: badgeMeta?.label || report.status || undefined,
          badgeColor: badgeMeta?.color,
        }
      }) || []

    const documentItems: SearchItem[] =
      documentsRes.data?.map(doc => {
        const siteName = (doc as any)?.site?.name
        const basePath = isAdmin ? '/dashboard/admin/documents' : '/documents/hub'
        return {
          id: doc.id,
          type: 'document',
          title: doc.title || doc.file_name || '문서',
          subtitle: doc.file_name || undefined,
          description: siteName ? `현장: ${siteName}` : undefined,
          url: isAdmin ? `${basePath}/${doc.id}` : basePath,
          badge: doc.category_type || undefined,
          badgeColor: 'blue',
        }
      }) || []

    const items: SearchItem[] = [
      ...(sitesRes.error ? [] : siteItems),
      ...(usersRes?.error ? [] : userItems),
      ...(worklogsRes.error ? [] : worklogItems),
      ...(documentsRes.error ? [] : documentItems),
    ]

    const counts = {
      site: siteItems.length,
      user: userItems.length,
      worklog: worklogItems.length,
      document: documentItems.length,
    }

    if (sitesRes.error || usersRes?.error || worklogsRes.error || documentsRes.error) {
      const errors = [
        sitesRes.error,
        usersRes?.error,
        worklogsRes.error,
        documentsRes.error,
      ].filter(Boolean)
      console.error('[global-search] partial failure', errors)
    }

    return NextResponse.json({
      success: true,
      query: rawQuery,
      items,
      counts,
    })
  } catch (error) {
    console.error('[global-search] failed', error)
    return NextResponse.json({ error: 'Failed to run search' }, { status: 500 })
  }
}
