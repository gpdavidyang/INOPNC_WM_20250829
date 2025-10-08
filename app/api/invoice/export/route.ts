import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Returns manifest of latest files per doc_type for a site
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const siteId = searchParams.get('site_id') || ''
  if (!siteId) return NextResponse.json({ error: 'site_id required' }, { status: 400 })
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('unified_documents')
      .select('id, document_type, file_url, file_name, version, created_at')
      .eq('category_type', 'invoice')
      .eq('site_id', siteId)
      .order('version', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) throw error

    const latest: Record<string, any> = {}
    for (const r of data || []) {
      const t = r.document_type || 'other'
      if (!latest[t]) latest[t] = r
    }

    // Sign URLs
    const manifest: Array<{ doc_type: string; file_name: string; url: string }> = []
    for (const [docType, r] of Object.entries(latest)) {
      let url = r.file_url as string
      try {
        const u = await fetch(`/api/files/signed-url?url=${encodeURIComponent(url)}` as any)
        const j = await u.json()
        url = j?.url || url
      } catch {
        /* ignore */
      }
      manifest.push({ doc_type: docType, file_name: r.file_name || 'file', url })
    }

    return NextResponse.json({ success: true, data: { site_id: siteId, files: manifest } })
  } catch (e) {
    return NextResponse.json({ success: true, data: { site_id: siteId, files: [] } })
  }
}
