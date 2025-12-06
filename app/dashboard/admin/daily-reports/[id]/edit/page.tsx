import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { PageHeader } from '@/components/ui/page-header'
import { ToggleAllSectionsButton } from '@/components/daily-reports/ToggleAllSectionsButton'
import DailyReportForm from '@/components/daily-reports/daily-report-form'
import { unifiedReportToLegacyPayload } from '@/lib/daily-reports/unified'
import { getUnifiedDailyReportForAdmin } from '@/lib/daily-reports/server'
import type { Profile } from '@/types'

async function fetchSites(preferredSiteId?: string) {
  const supabase = createClient()
  let query = supabase.from('sites').select('id, name, status')

  if (preferredSiteId) {
    query = query.or(`status.eq.active,id.eq.${preferredSiteId}`)
  } else {
    query = query.eq('status', 'active')
  }

  const { data, error } = await query.order('name', { ascending: true })

  if (error) {
    console.error('[AdminDailyReportEdit] failed to load sites:', error.message)
    return []
  }

  const items = Array.isArray(data) ? data : []
  const uniq = new Map<string, (typeof items)[number]>()
  for (const item of items) {
    if (!item?.id) continue
    uniq.set(item.id, item)
  }
  return Array.from(uniq.values())
}

async function fetchWorkers(currentProfile?: Profile | null) {
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

  const workers = Array.isArray(data) ? [...data] : []

  if (currentProfile?.id && currentProfile?.full_name) {
    const alreadyExists = workers.some(worker => worker?.id === currentProfile.id)
    if (!alreadyExists) {
      workers.unshift({
        id: currentProfile.id,
        full_name: currentProfile.full_name,
        role: currentProfile.role,
      })
    }
  }

  return workers
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
  const supabase = (() => {
    try {
      return createServiceRoleClient()
    } catch {
      return createClient()
    }
  })()
  const { data, error } = await supabase
    .from('materials')
    .select('id, name, code, unit, is_active, use_yn, use_flag, status, is_deleted')
    .order('name', { ascending: true })

  if (error) {
    console.error('[AdminDailyReportEdit] failed to load materials:', error.message)
    return []
  }

  const items = Array.isArray(data) ? data : []
  console.info('[AdminDailyReportEdit] materials fetched', items.length)
  return items.filter(item => {
    if (typeof item?.is_deleted === 'boolean' && item.is_deleted) return false
    return isMaterialSelectable(item)
  })
}

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { id: string }
}

export default async function AdminDailyReportEditPage({ params }: PageProps) {
  const profile = await requireAdminProfile()
  const unifiedReport = await getUnifiedDailyReportForAdmin(params.id)

  if (!unifiedReport) {
    redirect(`/dashboard/admin/daily-reports/${params.id}`)
  }

  const [sites, workers, materials] = await Promise.all([
    fetchSites(unifiedReport.siteId),
    fetchWorkers(profile),
    fetchMaterials(),
  ])

  const legacyPayload = unifiedReportToLegacyPayload(unifiedReport, { includeWorkers: true })

  const workLogs = Array.isArray(unifiedReport.workEntries)
    ? unifiedReport.workEntries.map(entry => ({
        id: entry.id || `work-${Math.random().toString(36).slice(2, 8)}`,
        component_type: entry.memberName || '',
        component_type_other: entry.memberNameOther || '',
        process_type: entry.processType || '',
        process_type_other: entry.processTypeOther || '',
        work_section: entry.workSection || '',
      }))
    : Array.isArray((legacyPayload as any).work_entries)
      ? ((legacyPayload as any).work_entries as any[]).map(entry => ({
          id: entry.id || `work-${Math.random().toString(36).slice(2, 8)}`,
          component_type: entry.component_type || entry.memberName || '',
          component_type_other: entry.component_type_other || entry.memberNameOther || '',
          process_type: entry.process_type || entry.processType || '',
          process_type_other: entry.process_type_other || entry.processTypeOther || '',
          work_section: entry.work_section || entry.workSection || '',
        }))
      : []

  const materialUsage = Array.isArray(unifiedReport.materials)
    ? unifiedReport.materials.map(material => ({
        id: material.id || `material-${Math.random().toString(36).slice(2, 8)}`,
        materialId: material.materialId ?? material.materialCode ?? null,
        materialCode: material.materialCode ?? null,
        materialName: material.materialName ?? material.materialCode ?? '',
        unit: material.unit ?? null,
        quantity: material.quantity ?? '',
        notes: material.notes ?? '',
      }))
    : Array.isArray((legacyPayload as any).materials)
      ? ((legacyPayload as any).materials as any[]).map(material => ({
          id: material.id || `material-${Math.random().toString(36).slice(2, 8)}`,
          materialId: material.materialId ?? material.material_code ?? material.materialId ?? null,
          materialCode: material.materialCode ?? material.material_code ?? null,
          materialName:
            material.materialName ||
            material.material_name ||
            material.materialCode ||
            material.material_code ||
            '',
          unit: material.unit ?? material.unit_name ?? null,
          quantity:
            material.quantity !== undefined && material.quantity !== null ? material.quantity : '',
          notes: material.notes ?? '',
        }))
      : []

  const normalizedReportData = {
    ...legacyPayload,
    site_id: legacyPayload.site_id || unifiedReport.siteId || '',
    work_logs: workLogs,
    worker_entries: Array.isArray((legacyPayload as any).worker_entries)
      ? (legacyPayload as any).worker_entries
      : [],
    material_usage: materialUsage,
    additional_photos: Array.isArray(unifiedReport.additionalPhotos)
      ? unifiedReport.additionalPhotos
      : [],
  }

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
        actions={<ToggleAllSectionsButton />}
      />
      <div className="px-0">
        <DailyReportForm
          mode="edit"
          sites={(sites as any) || []}
          currentUser={profile as any}
          materials={(materials as any) || []}
          workers={(workers as any) || []}
          reportData={normalizedReportData as any}
          initialUnifiedReport={unifiedReport as any}
          hideHeader={true}
        />
      </div>
    </div>
  )
}
