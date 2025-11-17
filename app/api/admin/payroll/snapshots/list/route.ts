import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { SalarySnapshot } from '@/lib/services/salary-snapshot.service'

async function fetchSnapshotsFromStorage(params: {
  serviceClient: ReturnType<typeof createServiceRoleClient> | null
  year?: number
  month?: number
  status?: 'issued' | 'approved' | 'paid'
  employmentType?: string
  limit: number
}) {
  const { serviceClient, year, month, status, employmentType, limit } = params
  if (!serviceClient) return []
  const storage = serviceClient.storage.from('documents')
  const { data: workerDirs, error } = await storage.list('salary-snapshots', { limit: 1000 })
  if (error) {
    console.error('Failed to list salary snapshot directories:', error)
    return []
  }
  const snapshots: SalarySnapshot[] = []
  for (const dir of workerDirs || []) {
    const workerId = dir?.name
    if (!workerId) continue
    const { data: files, error: listError } = await storage.list(`salary-snapshots/${workerId}`, {
      limit: 200,
      sortBy: { column: 'name', order: 'desc' },
    })
    if (listError) {
      console.warn('Failed to list snapshot files for worker', workerId, listError)
      continue
    }
    for (const file of files || []) {
      if (!file.name.endsWith('.json')) continue
      const base = file.name.replace(/\.json$/, '')
      const [fileYear, fileMonth] = base.split('-').map(s => Number(s))
      if (year && fileYear !== year) continue
      if (month && fileMonth !== month) continue
      const { data: blob, error: downloadError } = await storage.download(
        `salary-snapshots/${workerId}/${file.name}`
      )
      if (downloadError || !blob) continue
      try {
        const text = await blob.text()
        const json = JSON.parse(text) as SalarySnapshot
        if (status && json.status !== status) continue
        if (employmentType && json.employment_type !== employmentType) continue
        snapshots.push(json)
        if (snapshots.length >= limit) break
      } catch (err) {
        console.warn('Failed to parse snapshot JSON', workerId, file.name, err)
      }
    }
    if (snapshots.length >= limit) break
  }
  snapshots.sort((a, b) => {
    const aTime = new Date(a.issued_at).getTime()
    const bTime = new Date(b.issued_at).getTime()
    return bTime - aTime
  })
  return snapshots.slice(0, limit)
}

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    if (!['admin', 'system_admin'].includes(auth.role || '')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = (searchParams.get('status') || undefined) as
      | 'issued'
      | 'approved'
      | 'paid'
      | undefined
    const year = searchParams.get('year') ? Number(searchParams.get('year')) : undefined
    const month = searchParams.get('month') ? Number(searchParams.get('month')) : undefined
    const employmentType = searchParams.get('employmentType') || undefined
    // siteId is handled on client (derived from work_records by month)
    const limitRaw = searchParams.get('limit')
    const limit = Math.min(200, Math.max(10, limitRaw ? Number(limitRaw) || 100 : 100))

    const supabase = createClient()

    // Base query from snapshots table
    let query = supabase
      .from('salary_snapshots')
      .select(
        'worker_id, year, month, data_json, issued_at, issuer_id, status, approved_at, approver_id, paid_at, payer_id'
      )
      .order('issued_at', { ascending: false })
      .limit(limit)

    if (year) query = query.eq('year', year)
    if (month) query = query.eq('month', month)
    if (status) query = query.eq('status', status)
    if (employmentType) query = query.contains('data_json', { employment_type: employmentType })

    const { data, error } = await query
    if (error) {
      const isMissingTable =
        typeof error.message === 'string' && error.message.includes('does not exist')
      if (!isMissingTable) {
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to fetch snapshots' },
          { status: 500 }
        )
      }
      const fallbackClient = (() => {
        try {
          return createServiceRoleClient()
        } catch (e) {
          console.error('Failed to create service role client for snapshots fallback:', e)
          return null
        }
      })()
      const storageSnapshots = await fetchSnapshotsFromStorage({
        serviceClient: fallbackClient,
        year,
        month,
        status,
        employmentType,
        limit,
      })
      console.log('[salary snapshots] storage fallback', {
        year,
        month,
        status,
        employmentType,
        count: storageSnapshots.length,
      })
      return NextResponse.json({ success: true, data: storageSnapshots })
    }

    const snapshots: SalarySnapshot[] = (data || [])
      .map((row: any) => {
        const snap = (row?.data_json || null) as SalarySnapshot | null
        if (!snap) return null
        snap.worker_id = snap.worker_id || row.worker_id
        snap.year = snap.year || row.year
        snap.month = snap.month || row.month
        // Normalize status/meta from columns
        snap.status = (row.status as any) || snap.status || 'issued'
        snap.approved_at = row.approved_at || snap.approved_at || null
        snap.approver_id = row.approver_id || snap.approver_id || null
        snap.paid_at = row.paid_at || snap.paid_at || null
        snap.payer_id = row.payer_id || snap.payer_id || null
        return snap
      })
      .filter(Boolean) as SalarySnapshot[]

    return NextResponse.json({ success: true, data: snapshots })
  } catch (e: any) {
    console.error('GET /api/admin/payroll/snapshots/list error:', e)
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
