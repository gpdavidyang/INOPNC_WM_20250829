import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import DataTable, { type Column } from '@/components/admin/DataTable'

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
    <div className="px-0 pb-8 space-y-6">
      <PageHeader
        title="출고 상세"
        description={`ID: ${params.id}`}
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '자재 관리', href: '/dashboard/admin/materials' },
          { label: '출고 상세' },
        ]}
        showBackButton
        backButtonHref="/dashboard/admin/materials?tab=shipments"
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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
            <DataTable<any>
              data={shipment?.shipment_items || []}
              rowKey={(it: any) => it.id}
              stickyHeader
              columns={
                [
                  {
                    key: 'name',
                    header: '자재',
                    sortable: true,
                    render: (it: any) => (
                      <span className="font-medium text-foreground">
                        {it?.materials?.name || '-'}
                      </span>
                    ),
                  },
                  {
                    key: 'code',
                    header: '코드',
                    sortable: true,
                    render: (it: any) => it?.materials?.code || '-',
                  },
                  {
                    key: 'quantity',
                    header: '수량',
                    sortable: true,
                    align: 'right',
                    render: (it: any) => it?.quantity ?? 0,
                  },
                  {
                    key: 'unit',
                    header: '단위',
                    sortable: true,
                    render: (it: any) => it?.materials?.unit || '-',
                  },
                ] as Column<any>[]
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
