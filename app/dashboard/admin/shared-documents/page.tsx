import DocumentManagement from '@/components/admin/DocumentManagement'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SharedDocumentsManagementPage() {
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">공유 문서함 관리</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">공유 문서 업로드, 카테고리 관리 및 권한 설정</p>
    </div>

      <DocumentManagement profile={profile as any} />
    </div>
  )
}