import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const ALLOWED_ROLES = new Set(['admin', 'system_admin', 'site_manager'])

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth

  if (!ALLOWED_ROLES.has(auth.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createClient()
  const { id } = params

  try {
    const { data: doc, error } = await supabase
      .from('unified_document_system')
      .select('id, file_url')
      .eq('id', id)
      .single()

    if (error || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const fileUrl: string | undefined = doc.file_url

    const { error: deleteError } = await supabase
      .from('unified_document_system')
      .delete()
      .eq('id', id)
    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
    }

    if (fileUrl && fileUrl.includes('/storage/v1/object/public/')) {
      try {
        const url = new URL(fileUrl, process.env.NEXT_PUBLIC_SUPABASE_URL)
        const prefix = '/storage/v1/object/public/documents/'
        const idx = url.pathname.indexOf(prefix)
        if (idx >= 0) {
          const storagePath = url.pathname.slice(idx + prefix.length)
          if (storagePath) {
            await supabase.storage.from('documents').remove([storagePath])
          }
        }
      } catch {
        // ignore parse errors
      }
    }

    return NextResponse.json({
      success: true,
      data: { id },
    })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
