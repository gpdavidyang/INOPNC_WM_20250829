import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getAuthForClient } from '@/lib/auth/ultra-simple'

export const dynamic = "force-dynamic"

export default async function BackupPage() {
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
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<div>Loading backup dashboard...</div>}>
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold mb-4">백업 관리</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              시스템 데이터 백업 및 복원을 관리합니다.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2">데이터베이스 백업</h3>
                <p className="text-sm text-gray-600">최신 데이터베이스 백업을 생성합니다.</p>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2">파일 백업</h3>
                <p className="text-sm text-gray-600">업로드된 파일들을 백업합니다.</p>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2">복원</h3>
                <p className="text-sm text-gray-600">백업에서 데이터를 복원합니다.</p>
              </div>
            </div>
          </div>
        </div>
      </Suspense>
    </div>
  )
}
