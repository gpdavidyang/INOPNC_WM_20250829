import { getSites } from '@/app/actions/admin/sites'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { SitesContent } from '@/components/admin/sites/SitesContent'
import { buttonVariants } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '현장 관리',
}

const DEFAULT_PAGE_SIZE = 50

export default async function AdminSitesPage() {
  await requireAdminProfile()
  const initialResult = await getSites(1, DEFAULT_PAGE_SIZE)

  const initialSites = initialResult.success ? (initialResult.data?.sites ?? []) : []
  const initialTotal = initialResult.success ? (initialResult.data?.total ?? 0) : 0
  const initialPages = initialResult.success ? (initialResult.data?.pages ?? 1) : 1

  return (
    <div className="px-0 pb-8 space-y-6">
      <PageHeader
        title="현장 관리"
        description="현장 목록을 관리하고 세부 정보를 확인합니다."
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '현장 관리' }]}
        actions={
          <div className="flex items-center gap-3">
            <a
              href="/dashboard/admin/sites/new"
              className={`${buttonVariants({ variant: 'primary', size: 'standard' })} rounded-xl`}
              role="button"
            >
              현장 등록
            </a>
            <a
              href="/dashboard/admin/sites"
              className={`${buttonVariants({ variant: 'outline', size: 'standard' })} rounded-xl`}
              role="button"
            >
              새로고침
            </a>
          </div>
        }
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <SitesContent
          initialSites={initialSites}
          initialTotal={initialTotal}
          initialPages={initialPages}
          pageSize={DEFAULT_PAGE_SIZE}
          initialLoadErrored={!initialResult.success}
          hideHeader
        />
      </div>
    </div>
  )
}
