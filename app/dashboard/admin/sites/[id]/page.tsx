import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import SiteDetailActions from '@/components/admin/sites/SiteDetailActions'
import SiteDetailTabs from '@/components/admin/sites/SiteDetailTabs'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getIntegratedSiteDetail } from '@/lib/admin/site-detail'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '현장 상세' }

interface SitePageProps {
  params: {
    id: string
  }
  searchParams: {
    tab?: string
  }
}

export default async function AdminSiteDetailPage({ params, searchParams }: SitePageProps) {
  await requireAdminProfile()

  // Fetch all site data in one optimized pass
  const data = await getIntegratedSiteDetail(params.id)

  if (!data) {
    return (
      <div className="px-0 pb-8 space-y-6">
        <PageHeader
          title="현장 상세"
          description="현장 정보를 불러올 수 없습니다."
          breadcrumbs={[
            { label: '대시보드', href: '/dashboard/admin' },
            { label: '현장 관리', href: '/dashboard/admin/sites' },
            { label: '현장 상세' },
          ]}
        />
        <div className="p-8 text-center bg-white rounded-3xl border border-dashed text-gray-400">
          현장이 존재하지 않거나 접근 권한이 없습니다.
        </div>
      </div>
    )
  }

  const { site, organization, docs, reports, assignments, requests, stats } = data

  return (
    <div className="px-0 pb-8 space-y-6">
      <PageHeader
        title="현장 상세"
        description={
          site?.name || organization?.name
            ? `${site?.name || '현장명 미지정'} · ${organization?.name || '소속사 미지정'}`
            : '현장 정보를 불러올 수 없습니다.'
        }
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '현장 관리', href: '/dashboard/admin/sites' },
          { label: '현장 상세' },
        ]}
        actions={<SiteDetailActions siteId={params.id} />}
      />

      <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/50">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-transparent">
          <CardTitle className="text-2xl">{site?.name || '-'}</CardTitle>
          <CardDescription className="text-sm">{site?.address || '-'}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <SiteDetailTabs
            siteId={params.id}
            site={site}
            organization={organization}
            initialDocs={docs}
            initialReports={reports}
            initialAssignments={assignments}
            initialRequests={requests}
            initialStats={stats}
            initialTab={searchParams.tab}
          />
        </CardContent>
      </Card>
    </div>
  )
}
