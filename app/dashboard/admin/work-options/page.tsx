import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import WorkOptionsTable from '@/components/admin/WorkOptionsTable'
import { PageHeader } from '@/components/ui/page-header'
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
    <div className="px-0 pb-8 space-y-6">
      <PageHeader
        title="작업 옵션 관리"
        description="부재명/작업공정 옵션 관리"
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '작업 옵션' }]}
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <WorkOptionsEditor />

        <Card>
          <CardHeader>
            <CardTitle>부재명 옵션</CardTitle>
            <CardDescription>component_type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
              <WorkOptionsTable items={components} />
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
              <WorkOptionsTable items={processes} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
