import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { notifyLowMaterialStock } from '@/lib/notifications/triggers'
import { logInventoryChange } from '@/lib/utils/logging'

export const dynamic = 'force-dynamic'

// POST /api/mobile/daily-reports/:id/materials/apply-usage
// Applies material_usage of a daily report to material_transactions and material_inventory (idempotent)
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const reportId = params.id
    if (!reportId) {
      return NextResponse.json({ success: false, error: 'Missing report id' }, { status: 400 })
    }

    const svc = createServiceRoleClient()

    // 1) Load report (site, date)
    const { data: report, error: repErr } = await svc
      .from('daily_reports')
      .select('id, site_id, work_date')
      .eq('id', reportId)
      .maybeSingle()
    if (repErr || !report) {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 })
    }

    // 2) Load material usage rows for this report
    const { data: usages, error: usageErr } = await svc
      .from('material_usage')
      .select('material_type, quantity, unit')
      .eq('daily_report_id', reportId)
    if (usageErr) throw usageErr

    // Nothing to apply
    if (!Array.isArray(usages) || usages.length === 0) {
      return NextResponse.json({ success: true, data: { updated: 0 } })
    }

    let updated = 0

    for (const u of usages) {
      const matType = String(u?.material_type || '').trim()
      const qty = Math.max(0, Number(u?.quantity) || 0)
      if (!matType || qty <= 0) continue

      // 3) Resolve materials master by code or name (NPC-1000 etc.)
      const { data: material } = await svc
        .from('materials')
        .select('id, code, name, unit')
        .or(`code.eq.${matType},name.eq.${matType}`)
        .limit(1)
        .maybeSingle()
      if (!material) continue

      // 4) Find existing transaction for this report+material (idempotency)
      const { data: existing } = await svc
        .from('material_transactions')
        .select('id, quantity')
        .eq('site_id', report.site_id)
        .eq('material_id', material.id)
        .eq('reference_type', 'daily_report')
        .eq('reference_id', reportId)
        .limit(1)
        .maybeSingle()

      // 5) Ensure inventory row
      const { data: invRow } = await svc
        .from('material_inventory')
        .select('id, current_stock, minimum_stock')
        .eq('site_id', report.site_id)
        .eq('material_id', material.id)
        .maybeSingle()

      const currentStock = Number(invRow?.current_stock ?? 0)
      const minimumStock = Number(invRow?.minimum_stock ?? 0)

      if (existing) {
        // Update quantity and adjust inventory by delta
        const prev = Number(existing.quantity || 0)
        const delta = qty - prev // positive means additional usage
        if (delta !== 0) {
          const { error: updErr } = await svc
            .from('material_transactions')
            .update({
              quantity: qty,
              transaction_date: report.work_date,
              notes: 'Updated from daily report usage',
            })
            .eq('id', existing.id)
          if (updErr) throw updErr

          // Adjust inventory (subtract delta)
          const newStock = currentStock - delta
          const { error: invErr } = await svc.from('material_inventory').upsert({
            id: invRow?.id,
            site_id: report.site_id,
            material_id: material.id,
            current_stock: newStock,
            updated_at: new Date().toISOString(),
          } as any)
          if (invErr) throw invErr

          await logInventoryChange('usage', {
            siteId: report.site_id,
            quantity: Math.abs(delta),
            previousStock: currentStock,
            newStock,
            reason: 'daily_report_update',
            recordId: String(invRow?.id || ''),
          })

          // Low-stock notification (NPC-1000 only)
          if (minimumStock > 0 && newStock < minimumStock) {
            const materialLabel = material.name || material.code || matType
            await notifyLowMaterialStock(
              String(report.site_id),
              materialLabel || '자재',
              newStock,
              minimumStock,
              material.unit || null
            )
          }
        }
      } else {
        // Insert transaction and subtract from inventory
        const { error: insErr } = await svc.from('material_transactions').insert({
          transaction_type: 'out',
          site_id: report.site_id,
          material_id: material.id,
          quantity: qty,
          transaction_date: report.work_date,
          reference_type: 'daily_report',
          reference_id: reportId,
          notes: 'Applied from daily report usage',
        } as any)
        if (insErr) throw insErr

        const newStock = currentStock - qty
        const { error: invErr } = await svc.from('material_inventory').upsert({
          id: invRow?.id,
          site_id: report.site_id,
          material_id: material.id,
          current_stock: newStock,
          updated_at: new Date().toISOString(),
        } as any)
        if (invErr) throw invErr

        await logInventoryChange('usage', {
          siteId: report.site_id,
          quantity: qty,
          previousStock: currentStock,
          newStock,
          reason: 'daily_report_apply',
          recordId: String(invRow?.id || ''),
        })

        if (minimumStock > 0 && newStock < minimumStock) {
          const materialLabel = material.name || material.code || matType
          await notifyLowMaterialStock(
            String(report.site_id),
            materialLabel || '자재',
            newStock,
            minimumStock,
            material.unit || null
          )
        }
      }

      updated += 1
    }

    return NextResponse.json({ success: true, data: { updated } })
  } catch (e) {
    console.error('[mobile/daily-reports/:id/materials/apply-usage] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
