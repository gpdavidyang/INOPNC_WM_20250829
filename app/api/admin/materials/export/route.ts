import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { getMaterialRequests, getMaterialShipments } from '@/app/actions/admin/materials'
import { getNPC1000BySite } from '@/app/actions/admin/materials'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    if (!['admin', 'system_admin', 'site_manager'].includes(auth.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const tab = (searchParams.get('tab') || 'inventory') as 'inventory' | 'requests' | 'shipments'

    const wb = XLSX.utils.book_new()

    if (tab === 'inventory') {
      const res = await getNPC1000BySite(1, 10000, (searchParams.get('search') || undefined) as any)
      const rows = (res.success && res.data ? (res.data as any).sites : []) as any[]
      const data = rows.map(r => ({
        현장: r.site_name || '-',
        최근일: r.latest_date || '-',
        입고: r.incoming ?? 0,
        사용: r.used ?? 0,
        잔여: r.remaining ?? 0,
        상태: r.status || '-',
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      XLSX.utils.book_append_sheet(wb, ws, '현장별재고')
    }

    if (tab === 'requests') {
      const res = await getMaterialRequests(1, 10000, (searchParams.get('search') || '') as any)
      const rows = (res.success && res.data ? (res.data as any).requests : []) as any[]
      const data = rows.map(r => ({
        요청번호: r.request_number || r.id,
        현장: r.sites?.name || '-',
        요청자: r.requester?.full_name || '-',
        상태: r.status || '-',
        요청일: r.request_date || '-',
        항목수: (r.items || r.material_request_items || []).length,
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      XLSX.utils.book_append_sheet(wb, ws, '입고요청')
    }

    if (tab === 'shipments') {
      const res = await getMaterialShipments(1, 10000)
      const rows = (res.success && res.data ? (res.data as any).shipments : []) as any[]

      // Detail sheet
      const detail = rows.map(r => {
        const total = Number(r.total_amount || 0)
        const paid = (r.payments || []).reduce(
          (acc: number, p: any) => acc + (Number(p?.amount) || 0),
          0
        )
        const outstanding = Math.max(0, total - paid)
        return {
          출고번호: r.shipment_number || r.id,
          현장: r.sites?.name || '-',
          상태: r.status || '-',
          출고일: r.shipment_date || '-',
          배송방식: r.carrier || '-',
          금액KRW: total || '',
          수금KRW: paid || '',
          미수KRW: outstanding || '',
          항목수: (r.shipment_items || []).length,
        }
      })
      const wsDetail = XLSX.utils.json_to_sheet(detail)
      XLSX.utils.book_append_sheet(wb, wsDetail, '출고배송')

      // Per-site summary sheet
      const bySite = new Map<string, { count: number; total: number; paid: number }>()
      rows.forEach(r => {
        const site = (r.sites?.name as string) || '-'
        const total = Number(r.total_amount || 0)
        const paid = (r.payments || []).reduce(
          (acc: number, p: any) => acc + (Number(p?.amount) || 0),
          0
        )
        const agg = bySite.get(site) || { count: 0, total: 0, paid: 0 }
        agg.count += 1
        agg.total += total
        agg.paid += paid
        bySite.set(site, agg)
      })

      const summary = Array.from(bySite.entries())
        .map(([site, v]) => ({
          현장: site,
          출고건수: v.count,
          총액KRW: Math.round(v.total),
          수금KRW: Math.round(v.paid),
          미수KRW: Math.max(0, Math.round(v.total - v.paid)),
        }))
        .sort((a, b) => a.현장.localeCompare(b.현장))

      const wsSummary = XLSX.utils.json_to_sheet(summary)
      XLSX.utils.book_append_sheet(wb, wsSummary, '출고결제요약')
    }

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="materials_${tab}.xlsx"`,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Export failed' }, { status: 500 })
  }
}
