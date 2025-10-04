import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { listSalarySnapshots } from '@/lib/services/salary-snapshot.service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth
  if (!['admin', 'system_admin'].includes(auth.role || '')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const sp = new URL(request.url).searchParams
  const workerId = (sp.get('workerId') || '').trim() || undefined
  const year = parseInt(sp.get('year') || '0') || undefined
  const month = parseInt(sp.get('month') || '0') || undefined
  const status = (sp.get('status') || '').trim() as any
  const limit = parseInt(sp.get('limit') || '100')

  const result = await listSalarySnapshots({ workerId, year, month, status, limit })
  return NextResponse.json({ success: true, data: { snapshots: result.snapshots } })
}
