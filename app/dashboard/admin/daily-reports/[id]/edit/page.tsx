import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { PageHeader } from '@/components/ui/page-header'
import DailyReportForm from '@/components/daily-reports/daily-report-form'
import { unifiedReportToLegacyPayload } from '@/lib/daily-reports/unified'
import { getUnifiedDailyReportForAdmin } from '@/lib/daily-reports/server'

async function fetchSites() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('sites')
    .select('id, name')
    .eq('status', 'active')
    .order('name')

  if (error) {
    console.error('[AdminDailyReportEdit] failed to load sites:', error.message)
    return []
  }

  return data ?? []
}

async function fetchWorkers() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('role', ['worker', 'site_manager'])
    .order('full_name')

  if (error) {
    console.error('[AdminDailyReportEdit] failed to load workers:', error.message)
    return []
  }

  return data ?? []
}

async function fetchMaterials() {
  const supabase = createClient()
  const { data, error } = await supabase.from('materials').select('*').order('name')

  if (error) {
    console.error('[AdminDailyReportEdit] failed to load materials:', error.message)
    return []
  }

  return data ?? []
}

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { id: string }
}

export default async function AdminDailyReportEditPage({ params }: PageProps) {
  const profile = await requireAdminProfile()
  const [sites, workers, materials, unifiedReport] = await Promise.all([
    fetchSites(),
    fetchWorkers(),
    fetchMaterials(),
    getUnifiedDailyReportForAdmin(params.id),
  ])

  if (!unifiedReport) {
    redirect(`/dashboard/admin/daily-reports/${params.id}`)
  }

  const legacyPayload = unifiedReportToLegacyPayload(unifiedReport, { includeWorkers: true })

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="작업일지 수정"
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '작업일지 관리', href: '/dashboard/admin/daily-reports' },
          { label: '작업일지 수정' },
        ]}
        showBackButton
        backButtonHref={`/dashboard/admin/daily-reports/${params.id}`}
      />
      <div className="px-0">
        <DailyReportForm
          mode="edit"
          sites={(sites as any) || []}
          currentUser={profile as any}
          materials={(materials as any) || []}
          workers={(workers as any) || []}
          reportData={legacyPayload as any}
        />
      </div>
    </div>
  )
}
