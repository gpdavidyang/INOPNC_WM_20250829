import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { getSites } from '@/app/actions/admin/sites'
import { SitesContent } from '@/components/admin/sites/SitesContent'

export const metadata: Metadata = {
  title: '현장 관리',
}

const DEFAULT_PAGE_SIZE = 10

export default async function AdminSitesPage() {
  await requireAdminProfile()
  const initialResult = await getSites(1, DEFAULT_PAGE_SIZE)

  const initialSites = initialResult.success ? initialResult.data?.sites ?? [] : []
  const initialTotal = initialResult.success ? initialResult.data?.total ?? 0 : 0
  const initialPages = initialResult.success ? initialResult.data?.pages ?? 1 : 1

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <SitesContent
        initialSites={initialSites}
        initialTotal={initialTotal}
        initialPages={initialPages}
        pageSize={DEFAULT_PAGE_SIZE}
        initialLoadErrored={!initialResult.success}
      />
    </div>
  )
}
