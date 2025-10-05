import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { getAuthForClient } from '@/lib/auth/ultra-simple'

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

  // Get materials
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

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">새 작업일지 작성</h2>
          <p className="text-gray-600">작업일지 작성 폼이 여기에 표시됩니다.</p>
          <div className="mt-4 p-4 border border-gray-200 rounded">
            <p className="text-sm text-gray-500">사이트: {sites?.length || 0}개</p>
            <p className="text-sm text-gray-500">작업자: {workers?.length || 0}명</p>
            <p className="text-sm text-gray-500">자재: {materials?.length || 0}개</p>
          </div>
        </div>
      </div>
    </div>
  )
}
