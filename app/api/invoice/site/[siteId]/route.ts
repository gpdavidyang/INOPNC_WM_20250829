import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, ctx: { params: { siteId: string } }) {
  const supabase = createClient()
  try {
    const { searchParams } = new URL(request.url)
    const siteId = ctx.params.siteId
    const docType = searchParams.get('doc_type') || undefined

    let q = supabase
      .from('unified_documents')
      .select(
        `id, title, file_url, file_name, file_type, version, uploaded_by, created_at, metadata, document_type, storage_path`
      )
      .eq('category_type', 'invoice')
      .eq('site_id', siteId)
      .order('version', { ascending: false })
      .order('created_at', { ascending: false })

    if (docType) q = q.eq('document_type', docType)

    const { data, error } = await q
    if (error) throw error

    // Group by document_type
    const grouped: Record<string, any[]> = {}
    for (const r of data || []) {
      const t = r.document_type || r?.metadata?.doc_type || 'other'
      if (!grouped[t]) grouped[t] = []
      grouped[t].push(r)
    }

    return NextResponse.json({ success: true, data: grouped })
  } catch (e) {
    return NextResponse.json({ success: false, data: {} })
  }
}
