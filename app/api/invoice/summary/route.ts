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

    const parseMetadata = (raw: any): Record<string, any> | null => {
      if (!raw) return null
      if (typeof raw === 'object') return raw as Record<string, any>
      if (typeof raw === 'string') {
        try {
          return JSON.parse(raw) as Record<string, any>
        } catch {
          return null
        }
      }
      return null
    }

    const allowedDocTypes = new Set(
      (types.length > 0 ? types : DEFAULT_INVOICE_DOC_TYPES).map((item: any) =>
        String(item?.code || '')
          .trim()
          .toLowerCase()
      )
    )
    if (!allowedDocTypes.has('other')) allowedDocTypes.add('other')
    const aliasMap: Record<string, string> = {
      기타: 'other',
      기타문서: 'other',
      기타자료: 'other',
      etc: 'other',
      'etc.': 'other',
      etc1: 'other',
      etc2: 'other',
      misc: 'other',
      miscellaneous: 'other',
      others: 'other',
      otherdocs: 'other',
      'other-docs': 'other',
      other_documents: 'other',
      other_document: 'other',
      otherdoc: 'other',
      additional: 'other',
      additional_doc: 'other',
      additional_document: 'other',
    }
    const normalizeDocType = (value: unknown): string | null => {
      if (typeof value !== 'string') return null
      const key = value.trim().toLowerCase()
      if (!key) return null
      if (aliasMap[key]) return aliasMap[key]
      if (allowedDocTypes.has(key)) return key
      return null
    }

    const resolveDocType = (row: any, metadata: Record<string, any> | null): string => {
      const candidates = [
        row?.document_type,
        metadata?.doc_type,
        metadata?.document_type,
        metadata?.docType,
        metadata?.documentType,
        row?.sub_category,
        metadata?.sub_category,
        metadata?.category,
      ]
      for (const candidate of candidates) {
        const normalized = normalizeDocType(candidate)
        if (normalized) return normalized
      }
      return 'other'
    }

    type DocumentRow = Record<string, any> & { __source?: 'unified' | 'legacy' }

    let unifiedRows: DocumentRow[] = []
    try {
      let q = supabase
        .from('unified_documents')
        .select(
          'id, site_id, site:site_id(id,name), category_type, document_type, sub_type, status, is_archived, created_at, metadata, title, file_name'
        )
        .eq('category_type', 'invoice')
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
      if (orgId) q = q.eq('customer_company_id', orgId)
      if (stage) q = q.eq('metadata->>stage', stage)
      const { data, error } = await q.limit(limit)
      if (error) throw error
      unifiedRows = (Array.isArray(data) ? data : []).map(row => ({ ...row, __source: 'unified' }))
    } catch (_) {
      unifiedRows = []
    }

    let legacyRows: DocumentRow[] = []
    try {
      let q2 = supabase
        .from('unified_document_system')
        .select(
          'id, site_id, site:sites(id,name), category_type, sub_category, status, is_archived, created_at, metadata, title, file_name'
        )
        .eq('category_type', 'invoice')
        .order('created_at', { ascending: false })
      if (orgId) q2 = q2.eq('metadata->>organization_id', orgId)
      if (stage) q2 = q2.eq('metadata->>stage', stage)
      const { data } = await q2.limit(limit)
      legacyRows = (Array.isArray(data) ? data : []).map(row => ({ ...row, __source: 'legacy' }))
    } catch (_) {
      legacyRows = []
    }

    const allRows: DocumentRow[] = [...unifiedRows, ...legacyRows]

    const docTypes = (types.length > 0 ? types : DEFAULT_INVOICE_DOC_TYPES)
      .filter(d => d.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)

    const sitesMap = new Map<
      string,
      { site_id: string; site_name: string; docs: Record<string, any> }
    >()
    const uniqueDocs = new Set<string>()

    for (const r of allRows) {
      const sid = r.site_id
      if (!sid) continue
      const metadata = parseMetadata(r.metadata)
      const docType = resolveDocType(r, metadata)
      if (!docType) continue
      const status = typeof r.status === 'string' ? r.status.toLowerCase() : ''
      const isArchived = r?.is_archived === true
      if (status === 'deleted' || status === 'archived' || isArchived) continue
      uniqueDocs.add(`${r.__source || 'legacy'}:${r.id}`)
      if (!sitesMap.has(sid)) {
        sitesMap.set(sid, {
          site_id: sid,
          site_name: r?.site?.name || metadata?.site_name || '-',
          docs: {},
        })
      }
      const entry = sitesMap.get(sid)!
      const normalizedMetadata = parseMetadata(r.metadata)
      const prev = entry.docs[docType]
      const createdAt = new Date(r.created_at || 0).getTime()
      if (!prev || createdAt > prev.createdAt) {
        entry.docs[docType] = {
          id: r.id,
          createdAt,
          title:
            normalizedMetadata?.title ||
            r.title ||
            normalizedMetadata?.file_name ||
            r.file_name ||
            null,
          fileName: r.file_name || normalizedMetadata?.file_name || null,
        }
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
        totals: { sites: sites.length, documents: uniqueDocs.size },
      },
    })
  } catch (e) {
    return NextResponse.json({
      success: true,
      data: { docTypes: [], sites: [], totals: { sites: 0, documents: 0 } },
    })
  }
}
