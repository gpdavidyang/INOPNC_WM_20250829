import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

// GET /api/mobile/materials/site/:id/summary
// Query: date_from(YYYY-MM-DD), date_to(YYYY-MM-DD), limit(number)
// Returns inbound (in), usage (out), and inventory snapshot for the site
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const siteId = params.id
    if (!siteId) {
      return NextResponse.json({ success: false, error: 'Missing site id' }, { status: 400 })
    }

    const supabase = createClient()
    const svc = createServiceRoleClient()

    // Resolve role/profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, partner_company_id')
      .eq('id', auth.userId)
      .single()

    const role = profile?.role || auth.role || ''
    const allowedRoles = new Set([
      'worker',
      'site_manager',
      'admin',
      'system_admin',
      'customer_manager',
      'partner',
    ])
    if (!profile || (role && !allowedRoles.has(role))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Partner/customer_manager must be restricted to mapped sites
    if (role === 'partner' || role === 'customer_manager') {
      const allowedSiteIds = new Set<string>()
      const legacyFallbackEnabled = process.env.ENABLE_SITE_PARTNERS_FALLBACK === 'true'
      const partnerCompanyId = (profile as any)?.partner_company_id

      if (partnerCompanyId) {
        const { data: mappingRows } = await supabase
          .from('partner_site_mappings')
          .select('site_id, is_active')
          .eq('partner_company_id', partnerCompanyId)

        ;(mappingRows || []).forEach(row => {
          if (row?.site_id && row.is_active) allowedSiteIds.add(row.site_id)
        })

        if (allowedSiteIds.size === 0 && legacyFallbackEnabled) {
          const { data: legacyRows } = await supabase
            .from('site_partners')
            .select('site_id, contract_status')
            .eq('partner_company_id', partnerCompanyId)
          ;(legacyRows || []).forEach(row => {
            if (row?.site_id && row.contract_status !== 'terminated')
              allowedSiteIds.add(row.site_id)
          })
        }
      }

      if (allowedSiteIds.size === 0 || !allowedSiteIds.has(siteId)) {
        return NextResponse.json({ error: 'Not authorized for this site' }, { status: 403 })
      }
    }

    const { searchParams } = new URL(req.url)
    const dateFromParam = (searchParams.get('date_from') || '').trim()
    const dateToParam = (searchParams.get('date_to') || '').trim()
    const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit') || '10') || 10))

    // Default range: last 7 days (inclusive)
    const today = new Date()
    const toStr = (d: Date) => d.toISOString().slice(0, 10)
    const toDate = dateToParam || toStr(today)
    const fromDate = dateFromParam || toStr(new Date(today.getTime() - 6 * 86400000))

    // Fetch transactions for inbound (in) and usage (out)
    const [{ data: txnIn }, { data: txnOut }] = await Promise.all([
      svc
        .from('material_transactions')
        .select(
          'id, material_id, transaction_type, quantity, transaction_date, reference_type, materials(id, code, name, unit)'
        )
        .eq('site_id', siteId)
        .eq('transaction_type', 'in')
        .gte('transaction_date', fromDate)
        .lte('transaction_date', toDate)
        .order('transaction_date', { ascending: false })
        .limit(limit),
      svc
        .from('material_transactions')
        .select(
          'id, material_id, transaction_type, quantity, transaction_date, reference_type, reference_id, materials(id, code, name, unit)'
        )
        .eq('site_id', siteId)
        .in('transaction_type', ['out', 'usage'])
        .gte('transaction_date', fromDate)
        .lte('transaction_date', toDate)
        .order('transaction_date', { ascending: false })
        .limit(limit),
    ])

    const txIn = txnIn || []
    const txOut = txnOut || []

    // Hydrate materials for name/code/unit
    type MaterialSummary = {
      material_id: string
      material_code: string
      material_name: string
      unit: string
      inbound: {
        total: number
        items: Array<{ date: string; quantity: number; source: string }>
      }
      usage: {
        total: number
        items: Array<{
          date: string
          quantity: number
          reference_type: string | null
          reference_id: string | null
        }>
      }
      inventory: {
        current_stock: number
        minimum_stock: number | null
        status: 'normal' | 'low' | 'critical'
        updated_at: string | null
      }
    }

    const summaryByMaterial = new Map<string, MaterialSummary>()

    const normalizeMeta = (meta?: any) => ({
      code: meta?.code || '',
      name: meta?.name || '',
      unit: meta?.unit || '',
    })

    const ensureEntry = (
      materialId: string | null | undefined,
      meta?: any
    ): MaterialSummary | null => {
      const key = materialId ? String(materialId) : ''
      if (!key) {
        return null
      }

      let entry = summaryByMaterial.get(key)
      const normalized = normalizeMeta(meta)

      if (!entry) {
        entry = {
          material_id: key,
          material_code: normalized.code || '',
          material_name: normalized.name || normalized.code || '자재',
          unit: normalized.unit || '',
          inbound: { total: 0, items: [] },
          usage: { total: 0, items: [] },
          inventory: {
            current_stock: 0,
            minimum_stock: null,
            status: 'normal',
            updated_at: null,
          },
        }
        summaryByMaterial.set(key, entry)
      } else {
        if (!entry.material_code && normalized.code) {
          entry.material_code = normalized.code
        }
        if (
          (!entry.material_name || entry.material_name === '자재') &&
          (normalized.name || normalized.code)
        ) {
          entry.material_name = normalized.name || normalized.code
        }
        if (!entry.unit && normalized.unit) {
          entry.unit = normalized.unit
        }
      }

      return entry
    }

    for (const tx of txIn) {
      const entry = ensureEntry(tx.material_id, tx.materials)
      if (!entry) continue
      const quantity = Number(tx.quantity || 0)
      entry.inbound.total += quantity
      entry.inbound.items.push({
        date: tx.transaction_date,
        quantity,
        source: tx.reference_type === 'shipment' ? 'shipment' : 'transaction',
      })
    }

    for (const tx of txOut) {
      const entry = ensureEntry(tx.material_id, tx.materials)
      if (!entry) continue
      const quantity = Number(tx.quantity || 0)
      entry.usage.total += quantity
      entry.usage.items.push({
        date: tx.transaction_date,
        quantity,
        reference_type: tx.reference_type || null,
        reference_id: tx.reference_type === 'daily_report' ? tx.reference_id : null,
      })
    }

    const { data: invRows } = await svc
      .from('material_inventory')
      .select(
        'id, material_id, current_stock, minimum_stock, updated_at, materials(id, code, name, unit)'
      )
      .eq('site_id', siteId)
      .order('updated_at', { ascending: false })
      .limit(limit)

    for (const row of invRows || []) {
      const entry = ensureEntry(row.material_id, row.materials)
      if (!entry) continue
      const currentStock = Number(row.current_stock ?? 0)
      const minimumStock =
        row.minimum_stock !== null && row.minimum_stock !== undefined
          ? Number(row.minimum_stock)
          : null

      entry.inventory.current_stock = currentStock
      entry.inventory.minimum_stock = minimumStock
      entry.inventory.updated_at = row.updated_at || null

      if (minimumStock !== null) {
        entry.inventory.status =
          currentStock <= 0 ? 'critical' : currentStock < minimumStock ? 'low' : 'normal'
      } else {
        entry.inventory.status = currentStock <= 0 ? 'critical' : 'normal'
      }

      if (!entry.material_code && row.materials?.code) {
        entry.material_code = row.materials.code
      }
      if (
        (!entry.material_name || entry.material_name === '자재') &&
        (row.materials?.name || row.materials?.code)
      ) {
        entry.material_name = row.materials?.name || row.materials?.code
      }
      if (!entry.unit && row.materials?.unit) {
        entry.unit = row.materials.unit
      }
    }

    const materialsSummary = Array.from(summaryByMaterial.values()).sort((a, b) =>
      a.material_name.localeCompare(b.material_name, 'ko', { numeric: true })
    )

    return NextResponse.json({
      success: true,
      data: {
        site_id: siteId,
        period: { from: fromDate, to: toDate },
        materials: materialsSummary,
      },
    })
  } catch (e) {
    console.error('[mobile/materials/site/:id/summary] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
