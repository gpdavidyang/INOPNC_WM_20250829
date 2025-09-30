import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">입고요청 상세</h1>
        <p className="text-sm text-muted-foreground">ID: {params.id}</p>
      </div>

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
          <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>자재</TableHead>
                  <TableHead>코드</TableHead>
                  <TableHead>규격</TableHead>
                  <TableHead>단위</TableHead>
                  <TableHead className="text-right">요청수량</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(rq?.material_request_items || []).map((it: any) => (
                  <TableRow key={it.id}>
                    <TableCell className="font-medium text-foreground">
                      {it.material_name || '-'}
                    </TableCell>
                    <TableCell>{it.material_code || '-'}</TableCell>
                    <TableCell>{it.specification || '-'}</TableCell>
                    <TableCell>{it.unit || '-'}</TableCell>
                    <TableCell className="text-right">{it.requested_quantity ?? 0}</TableCell>
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
