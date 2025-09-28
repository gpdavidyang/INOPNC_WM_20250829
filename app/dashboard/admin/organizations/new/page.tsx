import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import OrganizationCreateForm from '@/components/admin/organizations/OrganizationCreateForm'

export const metadata: Metadata = { title: '조직 등록' }

export default async function AdminOrganizationCreatePage() {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader>
          <CardTitle>신규 조직 등록</CardTitle>
          <CardDescription>필수 필드만 입력해 조직을 생성합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationCreateForm />
        </CardContent>
      </Card>
    </div>
  )
}
