import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const url = new URL(request.url)
    const scope = url.searchParams.get('scope') || 'my' // 'my' | 'all'

    const service = createServiceRoleClient()

    // Only admin/system_admin can delete all users' drafts
    const isAdmin = auth.role === 'admin' || auth.role === 'system_admin'
    const filterByUser = scope !== 'all' || !isAdmin

    // First select ids to know how many will be deleted
    let selectQuery = service
      .from('daily_reports')
      .select('id', { count: 'exact' })
      .eq('status', 'draft')
    if (filterByUser) selectQuery = selectQuery.eq('created_by', auth.userId)
    const { data: toDelete, count, error: selectError } = await selectQuery

    if (selectError) {
      console.error('[delete-drafts] select error:', selectError)
      return NextResponse.json({ error: 'Failed to list drafts' }, { status: 500 })
    }

    if (!toDelete || toDelete.length === 0) {
      return NextResponse.json({ success: true, deleted: 0 })
    }

    let deleteQuery = service.from('daily_reports').delete().eq('status', 'draft')
    if (filterByUser) deleteQuery = deleteQuery.eq('created_by', auth.userId)
    const { error: deleteError } = await deleteQuery

    if (deleteError) {
      console.error('[delete-drafts] delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete drafts' }, { status: 500 })
    }

    return NextResponse.json({ success: true, deleted: count || toDelete.length })
  } catch (error) {
    console.error('[delete-drafts] unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
