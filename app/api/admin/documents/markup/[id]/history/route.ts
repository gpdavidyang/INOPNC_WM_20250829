import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth
  if (!['admin', 'system_admin'].includes(auth.role || '')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }
  const supabase = createClient()
  const { data, error } = await supabase
    .from('markup_document_history')
    .select(
      `
      *,
      user:profiles!markup_document_history_changed_by_fkey(id, full_name, email)
    `
    )
    .eq('document_id', params.id)
    .order('changed_at', { ascending: false })

  if (error)
    return NextResponse.json({ success: false, error: 'Failed to fetch history' }, { status: 500 })
  return NextResponse.json({ success: true, data: { history: data || [] } })
}
