import DailyReportDetailClient from '@/components/admin/daily-reports/DailyReportDetailClient'
import { PageHeader } from '@/components/ui/page-header'
import { requireAuth } from '@/lib/auth/ultra-simple'
import { getUnifiedDailyReportForAdmin } from '@/lib/daily-reports/server'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

export const metadata: Metadata = { title: '작업일지 상세' }

interface PartnerDailyReportPageProps {
  params: {
    id: string // siteId
    reportId: string // dailyReportId
  }
}

export default async function PartnerDailyReportDetailPage({
  params,
}: PartnerDailyReportPageProps) {
  const auth = await requireAuth()
  const supabase = createClient()
  const siteId = params.id
  const reportId = params.reportId

  // 1. Check Site Access
  const { data: me } = await supabase
    .from('profiles')
    .select('role, partner_company_id, organization_id')
    .eq('id', auth.userId)
    .single()

  const role = me?.role || ''
  const isInternal = ['admin', 'system_admin', 'site_manager'].includes(role)

  if (!isInternal) {
    const partnerCompanyId: string | null =
      (me as any)?.partner_company_id || me?.organization_id || null

    if (!partnerCompanyId) {
      redirect('/partner')
    }

    const { data: mapping } = await supabase
      .from('partner_site_mappings')
      .select('id')
      .eq('site_id', siteId)
      .eq('partner_company_id', partnerCompanyId)
      .limit(1)
      .maybeSingle()

    if (!mapping) {
      redirect('/partner') // No access to this site
    }
  }

  // 2. Fetch Report Basic Info to check permissions
  const { data: reportBase } = await supabase
    .from('daily_reports')
    .select('id, site_id, status, created_by, work_date')
    .eq('id', reportId)
    .single()

  if (!reportBase) {
    notFound()
  }

  if (reportBase.site_id !== siteId) {
    notFound() // Report does not belong to this site
  }

  // 3. Permission Check (Replicate logic from Site Page)
  // If restricted partner, can only see 'approved' OR their own reports?
  // The Site Page logic was: if (restrictedPartner) reportsQuery = reportsQuery.eq('status', 'approved')
  // This implies they CANNOT see drafts even if they own them?
  // Let's assume they SHOULD see their own drafts.
  if (!isInternal) {
    const isOwner = reportBase.created_by === auth.userId
    if (reportBase.status !== 'approved' && !isOwner) {
      // If not approved and not owner, deny access?
      // Or maybe show limited view?
      // For now, let's redirect to site page with error? Or just 404.
      // Let's go safe and show 404 or redirect.
      redirect(`/partner/sites/${siteId}`)
    }
  }

  // 4. Fetch Full Data
  // reusing Admin fetcher because the UI component needs unified structure
  const unifiedReport = await getUnifiedDailyReportForAdmin(reportId)

  if (!unifiedReport) {
    return <div className="p-8 text-center text-muted-foreground">데이터를 불러올 수 없습니다.</div>
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <PageHeader
        title="작업일지 상세"
        breadcrumbs={[
          { label: '현장 목록', href: '/partner' },
          { label: '현장 상세', href: `/partner/sites/${siteId}` },
          { label: '작업일지 상세' },
        ]}
        showBackButton
        backButtonHref={`/partner/sites/${siteId}`}
      />

      <DailyReportDetailClient
        reportId={reportId}
        siteName={unifiedReport.siteName}
        workDate={unifiedReport.workDate}
        status={unifiedReport.status}
        author={unifiedReport.authorName}
        initialReport={unifiedReport}
      />
    </div>
  )
}
