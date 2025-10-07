import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import OrganizationCreateForm from '@/components/admin/organizations/OrganizationCreateForm'

export const metadata: Metadata = { title: '시공업체 등록' }

export default async function AdminOrganizationCreatePage() {
  await requireAdminProfile()

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="신규 시공업체 등록"
        description="필수 항목만 입력해 시공업체(소속사)를 생성합니다"
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '시공업체 관리', href: '/dashboard/admin/organizations' },
          { label: '신규 등록' },
        ]}
        showBackButton
        backButtonHref="/dashboard/admin/organizations"
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>신규 시공업체 등록</CardTitle>
            <CardDescription>필수 항목만 입력해 시공업체를 생성합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <OrganizationCreateForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
