import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

const ALLOWED_ROLES = new Set(['admin', 'system_admin', 'site_manager'])

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

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServiceRoleClient()
  try {
    const { id } = params
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const { data: unifiedRow } = await supabase
      .from('unified_documents')
      .select(
        'id, title, file_url, file_name, mime_type, created_at, metadata, uploader:uploaded_by(full_name)'
      )
      .eq('id', id)
      .maybeSingle()

    let row = unifiedRow

    if (!row) {
      const { data: legacyRow } = await supabase
        .from('unified_document_system')
        .select(
          'id, title, file_url, file_name, mime_type, created_at, metadata, uploader:uploaded_by(full_name)'
        )
        .eq('id', id)
        .maybeSingle()
      row = legacyRow || null
    }

    if (!row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const metadata = parseMetadata((row as any)?.metadata)
    const payload = {
      id: row.id,
      title: row.title || metadata?.title || null,
      file_url: row.file_url || metadata?.file_url || null,
      file_name: row.file_name || metadata?.file_name || null,
      mime_type: row.mime_type || metadata?.mime_type || null,
      created_at: row.created_at || metadata?.created_at || null,
      uploader_name: (row as any)?.uploader?.full_name || metadata?.uploader_name || null,
      metadata,
    }

    return NextResponse.json({ success: true, data: payload })
  } catch (error) {
    console.error('[invoice/documents][GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth

  if (!ALLOWED_ROLES.has(auth.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createServiceRoleClient()
  const { id } = params

  try {
    let payload: { fileUrl?: string | null; storagePath?: string | null } = {}
    if (request.headers.get('content-type')?.includes('application/json')) {
      payload = (await request.json().catch(() => ({}))) || {}
    }

    let fileUrl: string | undefined = payload.fileUrl ?? undefined
    let storagePath: string | undefined = payload.storagePath ?? undefined

    const now = new Date().toISOString()
    const { data: legacyRow, error: deleteError } = await supabase
      .from('unified_document_system')
      .update({ status: 'deleted', is_archived: true, updated_at: now })
      .eq('id', id)
      .select('id, file_url, metadata, status')
      .maybeSingle()

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
    }

    let targetRow = legacyRow
    let targetTable: 'legacy' | 'unified' | null = legacyRow ? 'legacy' : null

    if (!targetRow) {
      const { data: unifiedRow, error: unifiedError } = await supabase
        .from('unified_documents')
        .update({ status: 'deleted', is_archived: true, updated_at: now })
        .eq('id', id)
        .select('id, file_url, metadata, status, is_archived')
        .maybeSingle()
      if (unifiedError) {
        console.error('[invoice/delete] unified_documents delete failed', unifiedError)
        return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
      }
      targetRow = unifiedRow || null
      targetTable = unifiedRow ? 'unified' : null
    }

    if (!targetRow) {
      console.log('[invoice/delete] no row found for', id)
      return NextResponse.json({ success: true, data: { id } })
    }

    console.log('[invoice/delete] updated row', id, targetRow.status, targetTable)

    if (!fileUrl && targetRow?.file_url) {
      fileUrl = targetRow.file_url
    }
    if (!storagePath) {
      const parsed = parseMetadata(targetRow?.metadata)
      if (parsed && typeof parsed.storage_path === 'string') {
        storagePath = parsed.storage_path
      }
    }

    if (!storagePath && fileUrl && fileUrl.includes('/storage/v1/object/public/')) {
      try {
        const url = new URL(fileUrl, process.env.NEXT_PUBLIC_SUPABASE_URL)
        const prefix = '/storage/v1/object/public/documents/'
        const idx = url.pathname.indexOf(prefix)
        if (idx >= 0) {
          const inferred = url.pathname.slice(idx + prefix.length)
          if (inferred) storagePath = inferred
        }
      } catch {
        /* ignore parse errors */
      }
    }

    if (storagePath) {
      const { error: storageError } = await supabase.storage.from('documents').remove([storagePath])
      if (storageError) {
        console.error('[invoice/delete] storage remove failed', storageError)
      }
    }

    return NextResponse.json({ success: true, data: { id } })
  } catch (e) {
    console.error('[invoice/delete] error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
