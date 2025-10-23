import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

// PATCH /api/admin/signup-requests/:id
// Allows editing user-provided fields before approval
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth
  try {
    const body = await req.json().catch(() => ({}))
    const allowed: Record<string, any> = {}
    const whitelist = ['full_name', 'email', 'company', 'job_title', 'phone', 'job_type']
    for (const k of whitelist) if (body?.[k] !== undefined) allowed[k] = body[k]
    if (Object.keys(allowed).length === 0) {
      return NextResponse.json(
        { success: false, error: '수정할 항목이 없습니다.' },
        { status: 400 }
      )
    }
    // Use service role to bypass potential RLS restrictions for admin operation
    const supabase = createServiceRoleClient()
    const { error } = await supabase
      .from('signup_requests')
      .update({ ...allowed, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('status', 'pending')
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[admin signup-requests PATCH] error:', e)
    return NextResponse.json(
      { success: false, error: '업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/signup-requests/:id
// Only non-approved requests can be deleted (pending or rejected)
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth

  // Role guard: admin/system_admin only
  if (!['admin', 'system_admin'].includes(String(auth.role || ''))) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }

  try {
    // Use service role to avoid RLS interference for admin deletion
    const supabase = createServiceRoleClient()

    // Load current status
    const { data: request, error: fetchErr } = await supabase
      .from('signup_requests')
      .select('status')
      .eq('id', params.id)
      .single()

    if (fetchErr || !request) {
      return NextResponse.json(
        { success: false, error: '요청을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (String(request.status || '').toLowerCase() === 'approved') {
      return NextResponse.json(
        { success: false, error: '승인된 요청은 삭제할 수 없습니다.' },
        { status: 400 }
      )
    }

    // Try soft delete first (hide even if hard delete fails due to FK/replica lag)
    let softOk = false
    try {
      const { error: softErr } = await supabase
        .from('signup_requests')
        .update({ status: 'deleted' as any, updated_at: new Date().toISOString() })
        .eq('id', params.id)
      softOk = !softErr
    } catch (err) {
      console.warn('[admin signup-requests DELETE] soft delete attempt failed (non-fatal):', err)
    }

    // Then try hard delete
    let hardOk = false
    try {
      const { error: delErr } = await supabase.from('signup_requests').delete().eq('id', params.id)
      hardOk = !delErr
    } catch (err) {
      console.warn('[admin signup-requests DELETE] hard delete attempt failed (non-fatal):', err)
    }

    if (!softOk && !hardOk) {
      return NextResponse.json(
        { success: false, error: '삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[admin signup-requests DELETE] exception:', e)
    return NextResponse.json(
      { success: false, error: '삭제 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
