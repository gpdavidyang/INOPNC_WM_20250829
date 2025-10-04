import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { listSharedDocuments } from '@/lib/api/adapters/documents'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth
  if (!['admin', 'system_admin'].includes(auth.role || '')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const sp = new URL(request.url).searchParams
  const page = Math.max(1, parseInt(sp.get('page') || '1'))
  const pageSize = Math.max(1, parseInt(sp.get('limit') || '20'))
  const search = (sp.get('search') || '').trim() || undefined
  const status = (sp.get('status') || '').trim() || undefined
  const siteId = (sp.get('site_id') || '').trim() || undefined

  const result = await listSharedDocuments({ page, pageSize, search, status, siteId })
  const pages = Math.max(1, Math.ceil(result.total / pageSize))
  return NextResponse.json({
    success: true,
    data: { documents: result.items, total: result.total, pages },
  })
}
