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

const interpretMaterialFlag = (value: unknown): boolean | null => {
  if (value === null || value === undefined) return null
  if (typeof value === 'boolean') return value
  const normalized = String(value).trim().toLowerCase()
  if (['true', '1', 'y', 'yes', 'active', 'enabled'].includes(normalized)) return true
  if (['false', '0', 'n', 'no', 'inactive', 'disabled'].includes(normalized)) return false
  return null
}

const isMaterialSelectable = (material: any): boolean => {
  const activeFlag = interpretMaterialFlag(material?.is_active)
  if (activeFlag !== null) return activeFlag

  const useFlag = interpretMaterialFlag(
    material?.use_yn ??
      material?.useYn ??
      material?.use_flag ??
      material?.useFlag ??
      material?.is_use ??
      material?.isUse
  )
  if (useFlag !== null) return useFlag

  const statusFlag = interpretMaterialFlag(material?.status)
  if (statusFlag !== null) return statusFlag

  return true
}

async function fetchMaterials() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('materials')
    .select('id, name, code, unit, is_active, use_yn, use_flag, status')
    .order('name')

  if (error) {
    console.error('[AdminDailyReportEdit] failed to load materials:', error.message)
    return []
  }

  const items = Array.isArray(data) ? data : []
  return items.filter(isMaterialSelectable)
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
