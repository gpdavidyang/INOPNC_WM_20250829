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
      const data = rows.map(r => ({
        출고번호: r.shipment_number || r.id,
        현장: r.sites?.name || '-',
        상태: r.status || '-',
        출고일: r.shipment_date || '-',
        배송방식: r.carrier || '-',
        항목수: (r.shipment_items || []).length,
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      XLSX.utils.book_append_sheet(wb, ws, '출고배송')
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
