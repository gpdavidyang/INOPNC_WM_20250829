import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminAccountSettings } from './admin-account-settings'
import { getAuthForClient } from '@/lib/auth/ultra-simple'
import { PageHeader } from '@/components/ui/page-header'

export const dynamic = 'force-dynamic'

export default async function AdminAccountPage() {
  const supabase = createClient()

  // Get the current user
  const auth = await getAuthForClient(supabase)

  if (!auth) {
    redirect('/auth/login')
  }

  // Get the user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', auth.userId)
    .single()

  if (profileError || !profile) {
    redirect('/auth/login')
  }

  // Check if user has admin permissions
  if (!['admin', 'system_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="계정 설정"
        description="개인 정보 및 보안 설정 관리"
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '계정 설정' }]}
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <AdminAccountSettings profile={profile} />
      </div>
    </div>
  )
}
