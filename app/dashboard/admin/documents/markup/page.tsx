import { getDailyReports } from '@/app/actions/admin/daily-reports'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import AdminDrawingManagementContent from '@/components/admin/markup/AdminDrawingManagementContent'
import { PageHeader } from '@/components/ui/page-header'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '도면마킹 관리',
}

export default async function AdminMarkupDocumentsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  await requireAdminProfile()

  const page = Math.max(1, Number((searchParams?.page as string) || '1') || 1)
  const limitRaw = Number((searchParams?.limit as string) || '20') || 20
  const limit = Math.min(100, Math.max(10, limitRaw))
  const siteId = ((searchParams?.site_id as string) || '').trim()
  const search = ((searchParams?.search as string) || '').trim()
  const status = ((searchParams?.status as string) || '').trim()
  const dateFrom = ((searchParams?.date_from as string) || '').trim()
  const dateTo = ((searchParams?.date_to as string) || '').trim()

  // Fetch sites for filter
  const supabase = createClient()
  const { data: sitesData } = await supabase
    .from('sites')
    .select('id, name')
    .eq('is_deleted', false)
    .order('name', { ascending: true })
  
  const siteOptions = (sitesData || []).map(s => ({ id: s.id, name: s.name }))

  // Fetch daily reports
  const result = await getDailyReports({
    page,
    itemsPerPage: limit,
    site: siteId || undefined,
    search: search || undefined,
    status: status || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    sortField: 'work_date',
    sortDirection: 'desc',
  })

  const reports = result.success && (result.data as any)?.reports 
    ? (result.data as any).reports.map((r: any) => ({
        id: r.id,
        work_date: r.work_date,
        site_name: r.sites?.name || '미지정',
        site_id: r.site_id,
        member_name: r.member_name || r.component_name || '작업내역 미기재',
        status: r.status,
        author_name: r.created_by_profile?.full_name || '작성자'
      }))
    : []

  const total = result.success ? (result.data as any)?.totalCount || 0 : 0
  const pages = result.success ? (result.data as any)?.totalPages || 1 : 1

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <div className="flex-none p-6 pb-0">
        <PageHeader
          title="도면마킹 관리"
          description="현장별/작업별 도면 및 마킹을 통합 관리합니다"
          breadcrumbs={[
            { label: '대시보드', href: '/dashboard/admin' },
            { label: '문서 관리', href: '/dashboard/admin/documents' },
            { label: '도면마킹 통합관리' }
          ]}
          showBackButton
          backButtonHref="/dashboard/admin/documents"
        />
      </div>
      
      <div className="flex-1 min-h-0 px-6 py-6 overflow-y-auto custom-scrollbar">
        <AdminDrawingManagementContent 
          initialReports={reports}
          siteOptions={siteOptions}
          totalCount={total}
          currentPage={page}
          totalPages={pages}
        />
      </div>
    </div>
  )
}
