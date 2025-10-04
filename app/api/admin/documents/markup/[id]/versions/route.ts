import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { listMarkupDocumentVersions } from '@/lib/api/adapters/documents'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth
  if (!['admin', 'system_admin'].includes(auth.role || '')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const items = await listMarkupDocumentVersions(params.id)
  return NextResponse.json({ success: true, data: { versions: items } })
}
