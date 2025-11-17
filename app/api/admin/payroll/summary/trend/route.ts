import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { listSalarySnapshots } from '@/lib/services/salary-snapshot.service'

export const dynamic = 'force-dynamic'

type TrendEntry = {
  month: string
  count: number
  gross: number
  deductions: number
  net: number
}

const trendCache = new Map<number, { data: TrendEntry[]; expiresAt: number }>()
const CACHE_TTL_MS = 60 * 1000 // 1 minute cache

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth
  if (!['admin', 'system_admin'].includes(auth.role || '')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const sp = new URL(request.url).searchParams
  const months = Math.max(1, Math.min(12, parseInt(sp.get('months') || '3')))

  const cached = trendCache.get(months)
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ success: true, data: cached.data, cached: true })
  }

  // Fetch last N snapshots (DB-backed) and group by month label
  const { snapshots } = await listSalarySnapshots({ limit: months * 100 })
  const map = new Map<
    string,
    { month: string; count: number; gross: number; deductions: number; net: number }
  >()
  for (const s of snapshots) {
    const label = s.month_label || `${s.year}-${String(s.month).padStart(2, '0')}`
    const e = map.get(label) || { month: label, count: 0, gross: 0, deductions: 0, net: 0 }
    e.count += 1
    e.gross += s.salary?.total_gross_pay || 0
    e.deductions += s.salary?.total_deductions || 0
    e.net += s.salary?.net_pay || 0
    map.set(label, e)
  }
  const data = Array.from(map.values())
    .sort((a, b) => (a.month < b.month ? -1 : 1))
    .slice(-months)

  trendCache.set(months, { data, expiresAt: Date.now() + CACHE_TTL_MS })
  return NextResponse.json({ success: true, data })
}
