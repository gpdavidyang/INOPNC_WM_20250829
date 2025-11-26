import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

async function loadProfile(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('role, site_id, organization_id')
    .eq('id', userId)
    .single()
  if (error || !data) throw new Error('권한 정보를 확인할 수 없습니다.')
  return data
}

async function loadAnnouncement(supabase: ReturnType<typeof createClient>, id: string) {
  const { data, error } = await supabase.from('announcements').select('*').eq('id', id).single()
  if (error || !data) throw new Error('공지 정보를 찾을 수 없습니다.')
  return data
}

const allowedPriorities = new Set(['low', 'medium', 'high', 'critical', 'urgent'])

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const supabase = createClient()
    const profile = await loadProfile(auth.userId)
    if (!['admin', 'system_admin', 'site_manager'].includes(profile.role || '')) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
    }

    const existing = await loadAnnouncement(supabase, params.id)
    if (profile.role === 'site_manager') {
      if (!profile.site_id || !existing.target_sites?.includes(profile.site_id)) {
        return NextResponse.json({ error: '해당 공지를 수정할 권한이 없습니다.' }, { status: 403 })
      }
    }

    const body = await request.json().catch(() => ({}))
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (body.title !== undefined) updateData.title = String(body.title)
    if (body.content !== undefined) updateData.content = String(body.content)
    if (body.priority !== undefined) {
      const nextPriority = String(body.priority)
      updateData.priority = allowedPriorities.has(nextPriority) ? nextPriority : existing.priority
    }
    if (body.siteIds !== undefined || body.target_sites !== undefined) {
      const nextSites: string[] = Array.isArray(body.siteIds ?? body.target_sites)
        ? (body.siteIds ?? body.target_sites)
        : existing.target_sites || []
      if (profile.role === 'site_manager') {
        updateData.target_sites = profile.site_id ? [profile.site_id] : nextSites
      } else {
        updateData.target_sites = nextSites.length ? nextSites : null
      }
    }
    if (body.targetRoles !== undefined || body.target_roles !== undefined) {
      const nextRoles: string[] = Array.isArray(body.targetRoles ?? body.target_roles)
        ? (body.targetRoles ?? body.target_roles)
        : existing.target_roles || []
      updateData.target_roles = nextRoles
    }
    if (body.is_active !== undefined) updateData.is_active = Boolean(body.is_active)

    const { data, error } = await supabase
      .from('announcements')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('announcement update failed', error)
      return NextResponse.json({ error: '공지 수정에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 400 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const supabase = createClient()
    const profile = await loadProfile(auth.userId)

    if (!['admin', 'system_admin', 'site_manager'].includes(profile.role || '')) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
    }

    const existing = await loadAnnouncement(supabase, params.id)
    if (profile.role === 'site_manager') {
      if (!profile.site_id || !existing.target_sites?.includes(profile.site_id)) {
        return NextResponse.json({ error: '해당 공지를 삭제할 권한이 없습니다.' }, { status: 403 })
      }
    }

    const { error } = await supabase.from('announcements').delete().eq('id', params.id)
    if (error) {
      console.error('announcement delete failed', error)
      return NextResponse.json({ error: '삭제에 실패했습니다.' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 400 }
    )
  }
}
