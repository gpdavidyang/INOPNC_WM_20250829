
import { createClient } from "@/lib/supabase/server"
import AdminPermissionValidator from '@/components/admin/AdminPermissionValidator'

export const dynamic = "force-dynamic"

export default async function TestPermissionsPage() {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
    <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">권한 테스트</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">관리자 권한 검증 및 기능 테스트</p>
    </div>

      <AdminPermissionValidator profile={profile as any} />
    </div>
  )
}
