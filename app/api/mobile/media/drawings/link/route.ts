import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { syncMarkupWorklogLinks } from '@/lib/documents/worklog-links'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) {
    return auth
  }

  const body = await request.json().catch(() => null)
  const markupId = body?.markupId || body?.markup_id
  const worklogId = body?.worklogId || body?.worklog_id

  if (!markupId || !worklogId) {
    return NextResponse.json(
      { success: false, error: 'markupId and worklogId are required' },
      { status: 400 }
    )
  }

  try {
    await syncMarkupWorklogLinks(markupId, [worklogId])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[mobile/media/drawings/link] failed', error)
    return NextResponse.json({ success: false, error: 'Failed to link drawing' }, { status: 500 })
  }
}
