import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

// GET /api/admin/sites/:id/materials/transactions
// Query: q (material name/code), limit, offset
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const siteId = params.id
    if (!siteId) {
      return NextResponse.json({ success: false, error: 'Missing site id' }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim().toLowerCase()
    const limit = Math.max(1, Math.min(200, Number(searchParams.get('limit') || '21') || 21))
    const offset = Math.max(0, Number(searchParams.get('offset') || '0') || 0)

    const svc = createServiceRoleClient()

    // Step 1: get transactions (paged) and total count
    let baseQuery = svc
      .from('material_transactions')
      .select(
        `
        id,
        site_id,
        material_id,
        transaction_type,
        transaction_date,
        quantity,
        reference_type,
        reference_id,
        notes,
        materials(id, name, code, unit)
      `,
        { count: 'exact' }
      )
      .eq('site_id', siteId)
      .order('transaction_date', { ascending: false, nullsFirst: false })

    const { data: txns, error, count } = await baseQuery.range(offset, offset + limit - 1)
    if (error) throw error

    const transactions = txns || []

    // Step 2: hydrate materials info (from materials master)
    const matIds = Array.from(new Set(transactions.map((t: any) => t.material_id).filter(Boolean)))
    let materialsMap = new Map<string, { name: string; code: string; unit: string }>()
    if (matIds.length > 0) {
      const { data: mats, error: matErr } = await svc
        .from('materials')
        .select('id, name, code, unit')
        .in('id', matIds)
      if (matErr) throw matErr
      for (const m of mats || []) {
        materialsMap.set(String(m.id), {
          name: m.name || '',
          code: m.code || '',
          unit: m.unit || '',
        })
      }
    }

    // Step 3: optional q filter by material name/code (client expects server-side)
    const hydrated = transactions
      .map((t: any) => {
        const materialMeta =
          t.materials && Object.keys(t.materials).length > 0
            ? {
                name: t.materials?.name || '',
                code: t.materials?.code || '',
                unit: t.materials?.unit || '',
              }
            : materialsMap.get(String(t.material_id)) || { name: '', code: '', unit: '' }

        return {
          ...t,
          materials: materialMeta,
        }
      })
      .filter(t => {
        if (!q) return true
        const name = (t.materials?.name || '').toLowerCase()
        const code = (t.materials?.code || '').toLowerCase()
        return name.includes(q) || code.includes(q)
      })

    return NextResponse.json({ success: true, data: hydrated, total: count || 0 })
  } catch (e) {
    console.error('[admin/sites/:id/materials/transactions] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
