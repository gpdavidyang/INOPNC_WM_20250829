import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import WorkOptionsEditor from '@/components/admin/work-options/WorkOptionsEditor'

export const metadata: Metadata = {
  title: '작업 옵션 관리',
}

export default async function WorkOptionsPage() {
  await requireAdminProfile()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
  const [componentsRes, processesRes] = await Promise.all([
    fetch(`${baseUrl}/api/admin/work-options?option_type=component_type`, { cache: 'no-store' })
      .then(r => r.json())
      .catch(() => []),
    fetch(`${baseUrl}/api/admin/work-options?option_type=process_type`, { cache: 'no-store' })
      .then(r => r.json())
      .catch(() => []),
  ])

  const components = Array.isArray(componentsRes) ? componentsRes : []
  const processes = Array.isArray(processesRes) ? processesRes : []

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <WorkOptionsEditor />

      <Card>
        <CardHeader>
          <CardTitle>부재명 옵션</CardTitle>
          <CardDescription>component_type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>값</TableHead>
                  <TableHead>라벨</TableHead>
                  <TableHead>정렬</TableHead>
                  <TableHead>활성</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {components.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-sm text-muted-foreground py-8"
                    >
                      등록된 옵션이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  components.map((o: any) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium text-foreground">
                        {o.option_value}
                      </TableCell>
                      <TableCell>{o.option_label}</TableCell>
                      <TableCell>{o.display_order ?? 0}</TableCell>
                      <TableCell>{o.is_active ? '활성' : '비활성'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>작업공정 옵션</CardTitle>
          <CardDescription>process_type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>값</TableHead>
                  <TableHead>라벨</TableHead>
                  <TableHead>정렬</TableHead>
                  <TableHead>활성</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-sm text-muted-foreground py-8"
                    >
                      등록된 옵션이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  processes.map((o: any) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium text-foreground">
                        {o.option_value}
                      </TableCell>
                      <TableCell>{o.option_label}</TableCell>
                      <TableCell>{o.display_order ?? 0}</TableCell>
                      <TableCell>{o.is_active ? '활성' : '비활성'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
