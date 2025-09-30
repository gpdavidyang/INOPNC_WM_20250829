import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const metadata: Metadata = { title: '출고 상세' }

export default async function AdminShipmentDetailPage({ params }: { params: { id: string } }) {
  await requireAdminProfile()
  const supabase = createClient()

  const { data: shipment } = await supabase
    .from('material_shipments')
    .select(
      `*, sites!site_id(name, address), creator:profiles!created_by(name), shipment_items(*, materials(name, code, unit))`
    )
    .eq('id', params.id)
    .maybeSingle()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">출고 상세</h1>
        <p className="text-sm text-muted-foreground">ID: {params.id}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{shipment?.shipment_number || shipment?.id}</CardTitle>
          <CardDescription>{shipment?.sites?.name || '-'}</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-3 text-sm text-muted-foreground">
          <div>
            <div className="text-xs">상태</div>
            <div className="text-foreground">{shipment?.status || '-'}</div>
          </div>
          <div>
            <div className="text-xs">출고일</div>
            <div className="text-foreground">
              {shipment?.shipment_date
                ? new Date(shipment.shipment_date).toLocaleDateString('ko-KR')
                : '-'}
            </div>
          </div>
          <div>
            <div className="text-xs">배송방식</div>
            <div className="text-foreground">{shipment?.carrier || '-'}</div>
          </div>
          <div>
            <div className="text-xs">운송장번호</div>
            <div className="text-foreground">{shipment?.tracking_number || '-'}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>출고 항목</CardTitle>
          <CardDescription>총 {(shipment?.shipment_items || []).length}개</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>자재</TableHead>
                  <TableHead>코드</TableHead>
                  <TableHead className="text-right">수량</TableHead>
                  <TableHead>단위</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(shipment?.shipment_items || []).map((it: any) => (
                  <TableRow key={it.id}>
                    <TableCell className="font-medium text-foreground">
                      {it.materials?.name || '-'}
                    </TableCell>
                    <TableCell>{it.materials?.code || '-'}</TableCell>
                    <TableCell className="text-right">{it.quantity ?? 0}</TableCell>
                    <TableCell>{it.materials?.unit || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
