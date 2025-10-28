import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { getAuthForClient } from '@/lib/auth/ultra-simple'
import DailyReportForm from '@/components/daily-reports/daily-report-form'

export const dynamic = 'force-dynamic'

export default async function AdminNewDailyReportPage() {
  const supabase = createClient()

  // Check authentication and admin role
  const auth = await getAuthForClient(supabase)
  if (!auth) {
    redirect('/auth/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', auth.userId)
    .single()

  if (!profile || !['admin', 'system_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  // Get all sites for admin
  const { data: sites } = await supabase
    .from('sites')
    .select('*')
    .eq('status', 'active')
    .order('name')

  // Get all workers
  const { data: workers } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['worker', 'site_manager'])
    .order('full_name')

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

  // Get materials (best-effort)
  const { data: materialsData } = await supabase
    .from('materials')
    .select('id, name, code, unit, is_active, use_yn, use_flag, status')
    .order('name')
  const materials = Array.isArray(materialsData) ? materialsData.filter(isMaterialSelectable) : []

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="새 작업일지 작성"
        description="관리자 권한으로 새 작업일지를 작성"
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '작업일지 관리', href: '/dashboard/admin/daily-reports' },
          { label: '새 작업일지' },
        ]}
        showBackButton
        backButtonHref="/dashboard/admin/daily-reports"
      />

      <div className="px-0">
        {/* 모바일 작성 플로우와 동일한 통합 폼 컴포넌트 사용 */}
        <DailyReportForm
          mode="create"
          sites={(sites as any) || []}
          currentUser={profile as any}
          materials={(materials as any) || []}
          workers={(workers as any) || []}
        />
      </div>
    </div>
  )
}
