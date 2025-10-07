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
    const SINGLE_CODE = (process.env.NEXT_PUBLIC_SINGLE_MATERIAL_CODE || 'INC-1000').toUpperCase()

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
        .select('id, material_id, transaction_type, quantity, transaction_date, reference_type')
        .eq('site_id', siteId)
        .eq('transaction_type', 'in')
        .gte('transaction_date', fromDate)
        .lte('transaction_date', toDate)
        .order('transaction_date', { ascending: false })
        .limit(limit),
      svc
        .from('material_transactions')
        .select(
          'id, material_id, transaction_type, quantity, transaction_date, reference_type, reference_id'
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
    const matIds = Array.from(
      new Set(
        [...txIn, ...txOut]
          .map((t: any) => t.material_id)
          .filter((id: any): id is string => Boolean(id))
      )
    )
    let materialMap = new Map<string, { code: string; name: string; unit: string }>()
    if (matIds.length > 0) {
      const { data: mats } = await svc
        .from('materials')
        .select('id, code, name, unit')
        .in('id', matIds)
      for (const m of mats || []) {
        materialMap.set(String(m.id), {
          code: m.code || '',
          name: m.name || '',
          unit: m.unit || '',
        })
      }
    }

    const inboundItemsAll = txIn.map((t: any) => ({
      material_code: materialMap.get(String(t.material_id))?.code || '',
      material_name: materialMap.get(String(t.material_id))?.name || '',
      unit: materialMap.get(String(t.material_id))?.unit || '',
      quantity: Number(t.quantity || 0),
      date: t.transaction_date,
      source: t.reference_type === 'shipment' ? 'shipment' : 'transaction',
    }))

    const inboundItems = inboundItemsAll.filter(
      it => String(it.material_code || '').toUpperCase() === SINGLE_CODE
    )

    const usageItemsAll = txOut.map((t: any) => ({
      material_code: materialMap.get(String(t.material_id))?.code || '',
      material_name: materialMap.get(String(t.material_id))?.name || '',
      unit: materialMap.get(String(t.material_id))?.unit || '',
      quantity: Number(t.quantity || 0),
      date: t.transaction_date,
      daily_report_id: t.reference_type === 'daily_report' ? t.reference_id : null,
    }))

    const usageItems = usageItemsAll.filter(
      it => String(it.material_code || '').toUpperCase() === SINGLE_CODE
    )

    const inboundTotal = inboundItems.reduce((s, it) => s + (Number(it.quantity) || 0), 0)
    const usageTotal = usageItems.reduce((s, it) => s + (Number(it.quantity) || 0), 0)

    // Inventory snapshot
    const { data: invRows } = await svc
      .from('material_inventory')
      .select('id, material_id, current_stock')
      .eq('site_id', siteId)
      .order('updated_at', { ascending: false })
      .limit(limit)

    const invMatIds = Array.from(
      new Set(
        (invRows || [])
          .map((r: any) => r.material_id)
          .filter((id: any): id is string => Boolean(id))
      )
    )
    if (invMatIds.length > 0) {
      const { data: invMats } = await svc
        .from('materials')
        .select('id, code, name, unit')
        .in('id', invMatIds)
      for (const m of invMats || []) {
        materialMap.set(String(m.id), {
          code: m.code || '',
          name: m.name || '',
          unit: m.unit || '',
        })
      }
    }

    const inventoryItems = (invRows || [])
      .map((r: any) => ({
        material_code: materialMap.get(String(r.material_id))?.code || '',
        material_name: materialMap.get(String(r.material_id))?.name || '',
        unit: materialMap.get(String(r.material_id))?.unit || '',
        current_stock: Number(r.current_stock || 0),
      }))
      .filter(it => String(it.material_code || '').toUpperCase() === SINGLE_CODE)

    return NextResponse.json({
      success: true,
      data: {
        site_id: siteId,
        period: { from: fromDate, to: toDate },
        inbound: { total: inboundTotal, items: inboundItems },
        usage: { total: usageTotal, items: usageItems },
        inventory: { count: inventoryItems.length, items: inventoryItems },
      },
    })
  } catch (e) {
    console.error('[mobile/materials/site/:id/summary] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
