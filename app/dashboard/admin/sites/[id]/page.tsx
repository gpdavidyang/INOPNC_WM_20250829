import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
// integrated overview SSR via internal API
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import SiteDetailTabs from '@/components/admin/sites/SiteDetailTabs'
import SiteDetailActions from '@/components/admin/sites/SiteDetailActions'

export const metadata: Metadata = { title: '현장 상세' }

interface SitePageProps {
  params: {
    id: string
  }
}

export default async function AdminSiteDetailPage({ params }: SitePageProps) {
  await requireAdminProfile()
  const supabase = createClient()

  const { data: site } = await supabase
    .from('sites')
    .select('*')
    .eq('id', params.id)
    .eq('is_deleted', false)
    .maybeSingle()

  const h = headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
  const baseUrl = `${proto}://${host}`
  const res = await fetch(`${baseUrl}/api/admin/sites/${params.id}/integrated`, {
    cache: 'no-store',
  })
  const integrated = await res.json().catch(() => ({}))
  const docs = Array.isArray(integrated?.data?.docs) ? integrated.data.docs : []
  const reports = Array.isArray(integrated?.data?.reports) ? integrated.data.reports : []
  const assignments = Array.isArray(integrated?.data?.assignments)
    ? integrated.data.assignments
    : []
  const requests = Array.isArray(integrated?.data?.requests) ? integrated.data.requests : []

  return (
    <div className="px-0 pb-8 space-y-6">
      <PageHeader
        title="현장 상세"
        description={`ID: ${params.id}`}
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '현장 관리', href: '/dashboard/admin/sites' },
          { label: '현장 상세' },
        ]}
        actions={<SiteDetailActions siteId={params.id} />}
      />

      <Card>
        <CardHeader>
          <CardTitle>{site?.name || '-'}</CardTitle>
          <CardDescription>{site?.address || '-'}</CardDescription>
        </CardHeader>
        <CardContent>
          <SiteDetailTabs
            siteId={params.id}
            site={site}
            initialDocs={Array.isArray(docs) ? docs : []}
            initialReports={Array.isArray(reports) ? reports : []}
            initialAssignments={assignments}
            initialRequests={requests}
          />
        </CardContent>
      </Card>
    </div>
  )
}
