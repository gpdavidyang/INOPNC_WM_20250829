import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    const supabase = createClient()
    // admin/system_admin만 허용
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', auth.userId)
      .single()
    if (!profile || !['admin', 'system_admin'].includes(profile.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('organization_id') || undefined

    // Be tolerant to schema differences: avoid requiring is_active/status columns
    let q = supabase.from('sites').select('id, name')
    if (orgId) q = q.eq('organization_id', orgId)
    const { data, error } = await q.order('name')
    if (error) throw error
    return NextResponse.json({ success: true, sites: data || [] })
  } catch (e) {
    return NextResponse.json({ success: true, sites: [] })
  }
}
