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

  // Get materials (best-effort)
  const { data: materials } = await supabase.from('materials').select('*').order('name')

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
