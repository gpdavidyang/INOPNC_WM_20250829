import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const supabase = createClient()

    // Ensure only admin/system_admin/site_manager can seed
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, site_id, organization_id')
      .eq('id', auth.userId)
      .single()

    if (!profile || !['admin', 'system_admin', 'site_manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const explicitSiteId: string | undefined = body?.siteId

    // Determine target sites for seeded announcements
    let targetSiteIds: string[] = []
    if (explicitSiteId) {
      targetSiteIds = [explicitSiteId]
    } else if (profile.role === 'site_manager' && profile.site_id) {
      targetSiteIds = [profile.site_id]
    } else if (auth.isRestricted && auth.restrictedOrgId) {
      const { data: orgSites } = await supabase
        .from('sites')
        .select('id')
        .eq('organization_id', auth.restrictedOrgId)
      targetSiteIds = (orgSites || []).map(s => (s as { id: string }).id)
    } else {
      // Admin/system admin: seed across all sites to make it visible everywhere
      const { data: allSites } = await supabase.from('sites').select('id')
      targetSiteIds = (allSites || []).map(s => (s as { id: string }).id)
    }

    // Fallback: if still empty and user has a site, use it
    if (targetSiteIds.length === 0 && profile.site_id) {
      targetSiteIds = [profile.site_id]
    }

    const now = new Date()
    const samples = [
      {
        title: '시스템 점검 안내',
        content: '다음 주 화요일 02:00~04:00 시스템 점검이 진행됩니다.',
        priority: 'high',
      },
      {
        title: '안전 교육 일정 공지',
        content: '월말 안전 교육이 예정되어 있으니 필수 참석 바랍니다.',
        priority: 'urgent',
      },
      {
        title: '신규 기능 업데이트',
        content: '모바일 작업일지 V2가 배포되었습니다. 새 기능을 확인하세요.',
        priority: 'normal',
      },
      {
        title: '자재 반입 절차 변경',
        content: '자재 반입 승인 절차가 간소화되었습니다. 문서를 확인하세요.',
        priority: 'low',
      },
      {
        title: '휴무일 안내',
        content: '다음 주 월요일 현장 전체 휴무입니다. 일정에 참고하세요.',
        priority: 'normal',
      },
    ]

    const rows = samples.map(s => ({
      title: s.title,
      content: s.content,
      priority: s.priority,
      target_sites: targetSiteIds,
      target_roles: [],
      is_active: true,
      created_by: auth.userId,
      created_at: now.toISOString(),
    }))

    const { data, error } = await supabase.from('announcements').insert(rows).select('*')
    if (error) {
      console.error('Seed announcements error:', error)
      return NextResponse.json({ error: 'Failed to seed announcements' }, { status: 500 })
    }

    return NextResponse.json({ success: true, count: data?.length || 0, announcements: data })
  } catch (e) {
    console.error('Seed announcements unexpected error:', e)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
