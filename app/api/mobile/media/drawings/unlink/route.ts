import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const { drawingId, worklogId, source } = await request.json()
    if (!drawingId || !worklogId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const svc = createServiceRoleClient()

    if (source === 'markup') {
      // 1. Delete from mapping table
      await svc
        .from('markup_document_worklog_links')
        .delete()
        .eq('markup_document_id', drawingId)
        .eq('worklog_id', worklogId)

      // 2. Clear primary link if it matches
      const { data: doc } = await svc
        .from('markup_documents')
        .select('linked_worklog_id')
        .eq('id', drawingId)
        .maybeSingle()

      if (doc?.linked_worklog_id === worklogId) {
        await svc.from('markup_documents').update({ linked_worklog_id: null }).eq('id', drawingId)
      }
    } else {
      // source === 'shared' (UDS)
      const { data: doc } = await svc
        .from('unified_document_system')
        .select('metadata')
        .eq('id', drawingId)
        .maybeSingle()

      if (doc?.metadata) {
        const metadata = { ...(doc.metadata as Record<string, any>) }

        // Remove from linked_worklog_id if match
        if (metadata.linked_worklog_id === worklogId) {
          metadata.linked_worklog_id = null
        }

        // Remove from linked_worklog_ids array if exists
        if (Array.isArray(metadata.linked_worklog_ids)) {
          metadata.linked_worklog_ids = metadata.linked_worklog_ids.filter(
            (id: string) => id !== worklogId
          )
        }

        // Also check legacy daily_report_id
        if (metadata.daily_report_id === worklogId) {
          metadata.daily_report_id = null
        }

        await svc.from('unified_document_system').update({ metadata }).eq('id', drawingId)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[api/mobile/media/drawings/unlink] error', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
