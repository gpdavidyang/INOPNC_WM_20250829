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

    // Load all company-shared documents (is_public=true)
    const { data: docs, error } = await service
      .from('documents')
      .select('id, file_url, folder_path')
      .eq('is_public', true)

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message || 'Query failed' },
        { status: 500 }
      )
    }

    const rows = docs || []
    if (rows.length === 0) {
      return NextResponse.json({ success: true, removed: 0 })
    }

    // Build storage paths to remove
    const paths: string[] = []
    for (const d of rows) {
      const folder = (d as any).folder_path as string | null
      if (folder && !paths.includes(folder)) {
        paths.push(folder)
        continue
      }
      const url = (d as any).file_url as string | null
      if (url && url.includes('/storage/v1/object/public/documents/')) {
        const p = url.split('/storage/v1/object/public/documents/')[1]
        if (p && !paths.includes(p)) paths.push(p)
      }
    }

    if (paths.length > 0) {
      await service.storage.from('documents').remove(paths)
    }

    // Delete DB rows (documents)
    const { error: delErr, count } = await service
      .from('documents')
      .delete({ count: 'exact' })
      .eq('is_public', true)

    if (delErr) {
      return NextResponse.json(
        { success: false, error: delErr.message || 'Delete failed' },
        { status: 500 }
      )
    }

    // Also clear unified_document_system entries for company shared docs
    try {
      await service
        .from('unified_document_system')
        .delete()
        .eq('category_type', 'shared')
        .eq('is_archived', false)
    } catch (_) {
      // best-effort
    }

    return NextResponse.json({ success: true, removed: count || rows.length })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
