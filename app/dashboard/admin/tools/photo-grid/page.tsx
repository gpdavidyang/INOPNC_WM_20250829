import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = "force-dynamic"

export default async function PhotoGridToolPage() {
  const supabase = createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/auth/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/auth/login')
  }

  if (!profile.role || !['admin', 'system_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4">포토 그리드 도구</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            사진을 그리드 형태로 관리하고 편집하는 도구입니다.
          </p>
          <div className="p-4 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-500">포토 그리드 관리 인터페이스가 여기에 표시됩니다.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
