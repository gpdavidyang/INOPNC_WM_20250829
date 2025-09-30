import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    if (auth.role !== 'admin' && auth.role !== 'system_admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const service = createServiceRoleClient()

    // 1) Pick company documents (is_public=true) whose title/file_name contains '공도면'
    const { data: docs, error } = await service
      .from('documents')
      .select('id, title, file_name, file_url, file_size, mime_type, owner_id, description')
      .eq('is_public', true)
      .or('title.ilike.%공도면%,file_name.ilike.%공도면%')

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message || 'Query failed' },
        { status: 500 }
      )
    }

    const candidates = (docs || []).filter(d => d.file_url)
    if (candidates.length === 0) {
      return NextResponse.json({ success: true, migrated: 0, updated: 0 })
    }

    // 2) Skip those already present in site_documents (matched by file_url)
    const urls = Array.from(new Set(candidates.map(d => d.file_url)))
    const { data: existing } = await service
      .from('site_documents')
      .select('id, file_url')
      .in('file_url', urls)

    const existingSet = new Set((existing || []).map((e: any) => e.file_url))
    const toInsert = candidates.filter(d => !existingSet.has(d.file_url as string))

    let inserted = 0
    let updated = 0

    if (toInsert.length > 0) {
      const payload = toInsert.map(d => ({
        site_id: null,
        document_type: 'blueprint',
        file_name: d.file_name || d.title || 'blueprint',
        file_url: d.file_url,
        file_size: d.file_size || 0,
        mime_type: d.mime_type || 'application/octet-stream',
        uploaded_by: d.owner_id || auth.userId,
        is_active: true,
        version: 1,
        notes: 'Migrated from company documents (공도면)',
      }))
      const { error: insErr, count } = await service
        .from('site_documents')
        .insert(payload, { count: 'exact' })
      if (insErr) {
        return NextResponse.json(
          { success: false, error: insErr.message || 'Insert failed' },
          { status: 500 }
        )
      }
      inserted = count || toInsert.length
    }

    // 3) Update original documents to hide from company list
    if (inserted > 0) {
      const insertedUrls = new Set(toInsert.map(d => d.file_url))
      const movedIds = candidates.filter(d => insertedUrls.has(d.file_url as string)).map(d => d.id)
      if (movedIds.length > 0) {
        const { error: updErr, count: updCount } = await service
          .from('documents')
          .update({
            is_public: false,
            description: (candidates[0]?.description || '') + ' [migrated:blueprint]',
          })
          .in('id', movedIds)
          .select('id', { count: 'exact', head: true })
        if (!updErr) updated = updCount || movedIds.length
      }
    }

    return NextResponse.json({ success: true, migrated: inserted, updated })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
