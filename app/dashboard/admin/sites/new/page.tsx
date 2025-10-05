import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import NewSiteClient from '@/components/admin/sites/NewSiteClient'
import { PageHeader } from '@/components/ui/page-header'
import { buttonVariants } from '@/components/ui/button'

export const metadata: Metadata = { title: '새 현장 등록' }

export default async function NewSitePage() {
  await requireAdminProfile()

  return (
    <div className="px-0 pb-8">
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
            className={buttonVariants({ variant: 'outline', size: 'standard' })}
            role="button"
          >
            목록으로
          </a>
        }
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <NewSiteClient />
        </div>
      </div>
    </div>
  )
}
