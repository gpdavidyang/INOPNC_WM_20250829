import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_INVOICE_DOC_TYPES } from '@/lib/invoice/doc-types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('organization_id') || undefined
    const stage = searchParams.get('stage') || undefined
    const limit = Math.min(2000, Number(searchParams.get('limit') || '1000'))

    // 0) Load doc types registry if available (fallback to defaults)
    let types: any[] = []
    try {
      const { data: tdata } = await supabase
        .from('invoice_document_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      if (Array.isArray(tdata) && tdata.length > 0) {
        types = tdata.map((r: any) => ({
          code: r.code,
          label: r.label,
          required: {
            start: !!r.is_required_start,
            progress: !!r.is_required_progress,
            completion: !!r.is_required_completion,
          },
          allowMultipleVersions: r.allow_multiple_versions !== false,
          sortOrder: Number(r.sort_order || 0),
          isActive: r.is_active !== false,
        }))
      }
    } catch (_) {
      // ignore
    }

    // unified_documents 우선, 없으면 unified_document_system 폴백
    // 1) unified_documents
    let rows: any[] = []
    try {
      let q = supabase
        .from('unified_documents')
        .select(
          'id, site_id, site:site_id(id,name), category_type, document_type, status, created_at, metadata'
        )
        .eq('category_type', 'invoice')
        .order('created_at', { ascending: false })
      if (orgId) q = q.eq('customer_company_id', orgId)
      if (stage) q = q.eq('metadata->>stage', stage)
      const { data, error } = await q.limit(limit)
      if (error) throw error
      rows = Array.isArray(data) ? data : []
    } catch (_) {
      // 2) unified_document_system 폴백
      let q2 = supabase
        .from('unified_document_system')
        .select('id, site_id, site:sites(id,name), category_type, status, created_at, metadata')
        .eq('category_type', 'invoice')
        .order('created_at', { ascending: false })
      if (orgId) q2 = q2.eq('metadata->>organization_id', orgId)
      if (stage) q2 = q2.eq('metadata->>stage', stage)
      const { data } = await q2.limit(limit)
      rows = Array.isArray(data) ? data : []
    }

    // 집계: site × doc_type (최신 1건 기준 존재 여부)
    const docTypes = (types.length > 0 ? types : DEFAULT_INVOICE_DOC_TYPES)
      .filter(d => d.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
    const sitesMap = new Map<
      string,
      { site_id: string; site_name: string; docs: Record<string, any> }
    >()

    for (const r of rows) {
      const docType = r.document_type || r?.metadata?.doc_type || 'other'
      const sid = r.site_id
      if (!sid) continue
      if (!sitesMap.has(sid)) {
        sitesMap.set(sid, {
          site_id: sid,
          site_name: r?.site?.name || '-',
          docs: {},
        })
      }
      const entry = sitesMap.get(sid)!
      const prev = entry.docs[docType]
      const createdAt = new Date(r.created_at || 0).getTime()
      if (!prev || createdAt > prev.createdAt) {
        entry.docs[docType] = { id: r.id, createdAt }
      }
    }

    const sites = Array.from(sitesMap.values())
    // 진행률 계산
    for (const s of sites) {
      const required = docTypes.filter(
        d => d.required.start || d.required.progress || d.required.completion
      )
      let have = 0
      let need = 0
      for (const d of required) {
        need += 1
        if (s.docs[d.code]) have += 1
      }
      s['progress'] = need > 0 ? Math.round((have / need) * 100) : 0
    }

    return NextResponse.json({
      success: true,
      data: {
        docTypes,
        sites,
        totals: { sites: sites.length, documents: rows.length },
      },
    })
  } catch (e) {
    return NextResponse.json({
      success: true,
      data: { docTypes: [], sites: [], totals: { sites: 0, documents: 0 } },
    })
  }
}
