import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import DataTable, { type Column } from '@/components/admin/DataTable'

export const metadata: Metadata = { title: '입고요청 상세' }

export default async function AdminMaterialRequestDetailPage({
  params,
}: {
  params: { id: string }
}) {
  await requireAdminProfile()
  const supabase = createClient()

  const { data: rq } = await supabase
    .from('material_requests')
    .select(
      `*, sites!site_id(name), requester:profiles!material_requests_requested_by_fkey(full_name), material_request_items(*)`
    )
    .eq('id', params.id)
    .maybeSingle()

  return (
    <div className="px-0 pb-8 space-y-6">
      <PageHeader
        title="입고요청 상세"
        description={`ID: ${params.id}`}
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '자재 관리', href: '/dashboard/admin/materials' },
          { label: '입고요청 상세' },
        ]}
        showBackButton
        backButtonHref="/dashboard/admin/materials?tab=requests"
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{rq?.request_number || rq?.id}</CardTitle>
            <CardDescription>{rq?.sites?.name || '-'}</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-4 gap-3 text-sm text-muted-foreground">
            <div>
              <div className="text-xs">상태</div>
              <div className="text-foreground">{rq?.status || '-'}</div>
            </div>
            <div>
              <div className="text-xs">요청일</div>
              <div className="text-foreground">
                {rq?.request_date ? new Date(rq.request_date).toLocaleDateString('ko-KR') : '-'}
              </div>
            </div>
            <div>
              <div className="text-xs">요청자</div>
              <div className="text-foreground">{rq?.requester?.full_name || '-'}</div>
            </div>
            <div>
              <div className="text-xs">비고</div>
              <div className="text-foreground">{rq?.notes || '-'}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>요청 항목</CardTitle>
            <CardDescription>총 {(rq?.material_request_items || []).length}개</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable<any>
              data={rq?.material_request_items || []}
              rowKey={(it: any) => it.id}
              stickyHeader
              columns={
                [
                  {
                    key: 'material_name',
                    header: '자재',
                    sortable: true,
                    render: (it: any) => (
                      <span className="font-medium text-foreground">{it.material_name || '-'}</span>
                    ),
                  },
                  {
                    key: 'material_code',
                    header: '코드',
                    sortable: true,
                    render: (it: any) => it.material_code || '-',
                  },
                  {
                    key: 'spec',
                    header: '규격',
                    sortable: true,
                    render: (it: any) => it.specification || '-',
                  },
                  {
                    key: 'unit',
                    header: '단위',
                    sortable: true,
                    render: (it: any) => it.unit || '-',
                  },
                  {
                    key: 'qty',
                    header: '요청수량',
                    sortable: true,
                    align: 'right',
                    render: (it: any) => it.requested_quantity ?? 0,
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
