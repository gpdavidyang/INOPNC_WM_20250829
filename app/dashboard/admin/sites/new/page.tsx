import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import NewSiteClient from '@/components/admin/sites/NewSiteClient'
import { buttonVariants } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '새 현장 등록' }

export default async function NewSitePage() {
  await requireAdminProfile()

  return (
    <div className="px-0 pb-8 space-y-6">
      <PageHeader
        title="새 현장 등록"
        subtitle="현장 정보를 입력해 새로운 현장을 생성합니다."
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '현장 관리', href: '/dashboard/admin/sites' },
          { label: '새 현장 등록' },
        ]}
        actions={
          <a
            href="/dashboard/admin/sites"
            className={`${buttonVariants({ variant: 'outline', size: 'standard' })} rounded-xl`}
            role="button"
          >
            목록으로
          </a>
        }
      />
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border bg-card p-6 shadow-sm">
          <NewSiteClient />
        </div>
      </div>
    </div>
  )
}
