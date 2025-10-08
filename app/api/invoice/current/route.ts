import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  try {
    const body = await request.json()
    const siteId: string = body?.site_id
    const docType: string = body?.doc_type
    const documentId: string = body?.document_id
    if (!siteId || !docType || !documentId) {
      return NextResponse.json(
        { error: 'site_id, doc_type, document_id required' },
        { status: 400 }
      )
    }

    // Fetch family
    const { data: docs, error } = await supabase
      .from('unified_documents')
      .select('id, metadata')
      .eq('category_type', 'invoice')
      .eq('site_id', siteId)
      .eq('document_type', docType)
    if (error) throw error

    // Update all: selected -> is_current=true, others -> false
    for (const d of docs || []) {
      const isCurrent = d.id === documentId
      const meta = { ...(d.metadata || {}), is_current: isCurrent }
      await supabase.from('unified_documents').update({ metadata: meta }).eq('id', d.id)
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
