import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'
import { deleteSites } from '@/app/actions/admin/sites'

export const dynamic = 'force-dynamic'

// DELETE /api/admin/sites/:id
// Guard: prevent deletion if daily reports exist
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    const id = params.id
    const supabase = createClient()
    const { count } = await supabase
      .from('daily_reports')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', id)

    if ((count || 0) > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            '현장에 연결된 작업일지가 있어 삭제할 수 없습니다. 먼저 작업일지를 정리하거나 현장 상태를 완료로 변경하세요.',
        },
        { status: 409 }
      )
    }

    const result = await deleteSites([id])
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
    return NextResponse.json({ success: true, message: result.message })
  } catch (e) {
    console.error('[admin/sites:DELETE] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
