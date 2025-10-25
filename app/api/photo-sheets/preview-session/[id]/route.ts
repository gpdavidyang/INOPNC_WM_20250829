import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth, canAccessData } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('photo_sheet_previews')
      .select('payload, created_by')
      .eq('id', ctx.params.id)
      .single()
    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    // Basic access: the creator or admin roles only; for simplicity allow same session user
    if (
      data.created_by &&
      data.created_by !== auth.userId &&
      auth.role !== 'admin' &&
      auth.role !== 'system_admin'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ success: true, data: data.payload })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch preview' }, { status: 500 })
  }
}
