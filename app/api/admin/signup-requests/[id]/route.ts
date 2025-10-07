import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'

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
    const supabase = createClient()
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
