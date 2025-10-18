import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'

export const metadata: Metadata = {
  title: '자재 관리 설정',
}

export default async function AdminMaterialsSettingsPage() {
  await requireAdminProfile()

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="자재 관리 설정"
        description="자재(품목) 및 기초 마스터를 관리합니다."
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '자재 관리', href: '/dashboard/admin/materials' },
          { label: '설정' },
        ]}
        showBackButton
        backButtonHref="/dashboard/admin/materials"
      />

      <div className="px-4 sm:px-6 lg:px-8 py-8 grid gap-4 md:grid-cols-2">
        <a href="/dashboard/admin/materials/settings/materials">
          <Card className="p-6 hover:bg-accent/50 transition-colors">
            <div className="font-semibold mb-1">품목 관리</div>
            <div className="text-sm text-muted-foreground">
              자재 코드/명/단위 등을 등록·수정합니다.
            </div>
          </Card>
        </a>

        <a href="/dashboard/admin/materials/settings/payment-methods">
          <Card className="p-6 hover:bg-accent/50 transition-colors">
            <div className="font-semibold mb-1">배송결제방식 관리</div>
            <div className="text-sm text-muted-foreground">
              청구·배송·선불/착불 방식을 등록하고 관리합니다.
            </div>
          </Card>
        </a>
      </div>
    </div>
  )
}
