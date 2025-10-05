import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { listSiteAssignments } from '@/lib/api/adapters/site-assignments'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth
  if (!auth.role || !['admin', 'system_admin', 'site_manager'].includes(auth.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const siteId = params.id
  const sp = new URL(request.url).searchParams
  const q = sp.get('q') || undefined
  const role = sp.get('role') || undefined
  const sort = (sp.get('sort') as 'name' | 'role' | 'company' | 'date') || 'date'
  const order = (sp.get('order') as 'asc' | 'desc') || 'desc'

  const result = await listSiteAssignments(siteId, true, {
    search: q,
    role: role || undefined,
    sort,
    order,
    limit: 5000,
    offset: 0,
  })

  const preset = (sp.get('preset') || 'basic') as 'basic' | 'full'
  let cols = (sp.get('cols') || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  if (cols.length === 0) {
    cols =
      preset === 'full'
        ? ['name', 'email', 'company', 'role', 'assigned_date', 'user_id']
        : ['name', 'email', 'company', 'role', 'assigned_date']
  }

  const rows = result.rows.map(r => ({
    name: r.profile?.full_name || '',
    email: r.profile?.email || '',
    company: r.profile?.organization?.name || '',
    role: r.role || '',
    assigned_date: r.assigned_date || r.assigned_at || '',
    user_id: r.user_id,
  }))

  const data = rows.map(row => {
    const o: Record<string, any> = {}
    cols.forEach(c => {
      o[c] = (row as any)[c]
    })
    return o
  })

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '배정')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="site_${siteId}_assignments.xlsx"`,
      'Cache-Control': 'no-store',
    },
  })
}
