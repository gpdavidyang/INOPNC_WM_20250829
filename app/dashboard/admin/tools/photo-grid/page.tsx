import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAuthForClient } from '@/lib/auth/ultra-simple'
import { PageHeader } from '@/components/ui/page-header'

export const dynamic = 'force-dynamic'

export default async function PhotoGridToolPage() {
  const supabase = createClient()

  const auth = await getAuthForClient(supabase)

  if (!auth) {
    redirect('/auth/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', auth.userId)
    .single()

  if (profileError || !profile) {
    redirect('/auth/login')
  }

  if (!profile.role || !['admin', 'system_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="포토 그리드 도구"
        description="사진을 그리드 형태로 관리/편집"
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '도구', href: '/dashboard/admin/tools/markup' },
          { label: '포토 그리드' },
        ]}
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">도구 개요</h2>
            <p className="text-gray-600 mb-6">사진을 그리드 형태로 관리하고 편집하는 도구입니다.</p>
            <div className="p-4 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-500">
                포토 그리드 관리 인터페이스가 여기에 표시됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
