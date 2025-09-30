import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'
import { updateSite } from '@/app/actions/admin/sites'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth

  if (!auth.role || !['admin', 'system_admin'].includes(auth.role)) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }

  const supabase = createClient()
  const { data, error } = await supabase.from('sites').select('*').eq('id', params.id).maybeSingle()
  if (error || !data) {
    return NextResponse.json({ success: false, error: 'Site not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth

  if (!auth.role || !['admin', 'system_admin'].includes(auth.role)) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const result = await updateSite({ id: params.id, ...(body || {}) })

  return NextResponse.json(result, { status: result.success ? 200 : 400 })
}
