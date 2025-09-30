import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getSiteAssignments } from '@/app/actions/admin/sites'
import { getMaterialRequests } from '@/app/actions/admin/materials'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import SiteDetailTabs from '@/components/admin/sites/SiteDetailTabs'

export const metadata: Metadata = { title: '현장 상세' }

interface SitePageProps {
  params: {
    id: string
  }
}

export default async function AdminSiteDetailPage({ params }: SitePageProps) {
  await requireAdminProfile()
  const supabase = createClient()
  let svc
  try {
    svc = createServiceClient()
  } catch {
    svc = null
  }

  const { data: site } = await supabase.from('sites').select('*').eq('id', params.id).maybeSingle()

  const { data: docs } = await (svc || supabase)
    .from('unified_document_system')
    .select(
      'id, title, category_type, sub_category, document_type, status, file_url, mime_type, metadata, created_at'
    )
    .eq('site_id', params.id)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: reports } = await (svc || supabase)
    .from('daily_reports')
    .select('id, work_date, status, profiles:profiles!daily_reports_user_id_fkey(full_name)')
    .eq('site_id', params.id)
    .order('work_date', { ascending: false })
    .limit(10)

  const [assignRes, reqRes] = await Promise.all([
    getSiteAssignments(params.id),
    getMaterialRequests(1, 5, '', undefined, params.id),
  ])
  const assignments = assignRes.success && Array.isArray(assignRes.data) ? assignRes.data : []
  const requests = reqRes.success && reqRes.data ? (reqRes.data as any).requests : []

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">현장 상세</h1>
        <p className="text-sm text-muted-foreground">ID: {params.id}</p>
      </div>

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
