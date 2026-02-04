import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import PartnerCreateForm from '@/components/admin/partners/PartnerCreateForm'

export const metadata: Metadata = { title: '자재거래처 등록' }

export default async function AdminPartnerCreatePage() {
  await requireAdminProfile()

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="자재거래처 등록"
        description="필수 정보를 입력하여 새로운 자재거래처를 등록합니다."
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '자재거래처 관리', href: '/dashboard/admin/partners' },
          { label: '거래처 등록' },
        ]}
        showBackButton
        backButtonHref="/dashboard/admin/partners"
      />
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/40 overflow-hidden">
          <CardContent className="p-6 sm:p-10">
            <PartnerCreateForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
