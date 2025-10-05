import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth

  try {
    const svc = createServiceRoleClient()
    const { data, error } = await svc
      .from('unified_document_system')
      .select('file_url, document_type, category_type')
      .eq('id', params.id)
      .maybeSingle()
    if (error || !data?.file_url) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 })
    }
    // Non-blocking audit log
    try {
      const server = createClient()
      await server.from('audit_logs').insert({
        user_id: auth.userId,
        action: 'ptw_download',
        success: true,
        timestamp: new Date().toISOString(),
        details: { document_id: params.id },
      } as any)
    } catch (err) {
      // Non-blocking: ignore audit log failure
      console.debug('audit_logs insert failed', err)
    }
    return NextResponse.redirect(data.file_url, { status: 302 })
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
