import type { Metadata } from 'next'
import { SitesContent } from '@/components/admin/sites/SitesContent'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: '현장 관리' }

const DEFAULT_PAGE_SIZE = 10

export default async function PartnerSitesPage() {
  // Fetch initial data from partner API to mirror admin SSR behavior
  let initialSites: any[] = []
  let initialTotal = 0
  let initialPages = 1
  let initialLoadErrored = false

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/partner/sites?page=1&limit=${DEFAULT_PAGE_SIZE}`,
      {
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
      }
    )
    const json = await res.json()
    if (res.ok && json?.success) {
      initialSites = json.data?.sites ?? []
      initialTotal = json.data?.total ?? 0
      initialPages = json.data?.pages ?? 1
    } else {
      initialLoadErrored = true
    }
  } catch (e) {
    initialLoadErrored = true
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <SitesContent
        initialSites={initialSites as any}
        initialTotal={initialTotal}
        initialPages={initialPages}
        pageSize={DEFAULT_PAGE_SIZE}
        initialLoadErrored={initialLoadErrored}
        fetchBaseUrl="/api/partner/sites"
        assignmentsBaseUrl="/api/partner/sites"
      />
    </div>
  )
}
