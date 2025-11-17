import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { paySalarySnapshot } from '@/lib/services/salary-snapshot.service'

export const dynamic = 'force-dynamic'

type PayEntryInput = Record<string, any>

type NormalizedEntry = { workerId: string; year: number; month: number }

const parseYearMonthFromLabel = (label?: string | null): { year?: number; month?: number } => {
  if (!label) return {}
  const match = label.match(/(\d{4})[^\d]?(\d{1,2})/)
  if (!match) return {}
  return { year: Number(match[1]), month: Number(match[2]) }
}

const normalizeEntry = (raw: PayEntryInput): NormalizedEntry | null => {
  if (!raw || typeof raw !== 'object') return null
  const workerId =
    raw.workerId ||
    raw.userId ||
    raw.worker_id ||
    raw.profile_id ||
    raw.worker?.id ||
    raw.worker?.user_id ||
    raw.worker?.worker_id ||
    raw.id
  const parsed = parseYearMonthFromLabel(raw.month_label || raw.label)
  const year = Number(raw.year ?? raw.snapshotYear ?? raw.snapshot_year ?? parsed.year) || undefined
  const month =
    Number(raw.month ?? raw.snapshotMonth ?? raw.snapshot_month ?? parsed.month) || undefined
  if (!workerId || !year || !month) return null
  return { workerId, year, month }
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth
  if (!['admin', 'system_admin'].includes(auth.role || '')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }
  const body = await request.json().catch(() => ({}))
  const rawEntries: PayEntryInput[] = Array.isArray(body?.entries)
    ? body.entries
    : body && Object.keys(body).length > 0
      ? [body]
      : []
  const normalized = rawEntries
    .map(entry => normalizeEntry(entry))
    .filter((entry): entry is NormalizedEntry => !!entry)
  // Support legacy payloads (workerId/year/month without entries)
  if (!normalized.length && body?.workerId && body?.year && body?.month) {
    normalized.push({
      workerId: body.workerId,
      year: Number(body.year),
      month: Number(body.month),
    })
  }
  if (!normalized.length) {
    return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 })
  }
  const results = []
  for (const entry of normalized) {
    const result = await paySalarySnapshot(entry.workerId, entry.year, entry.month, auth.userId)
    results.push({ entry, ...result })
  }
  const successCount = results.filter(r => r.success).length
  const total = results.length
  const failed = results.filter(r => !r.success)
  return NextResponse.json({
    success: failed.length === 0,
    successCount,
    total,
    errors: failed.map(item => item.error).filter(Boolean),
  })
}
