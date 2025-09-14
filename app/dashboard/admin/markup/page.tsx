import MarkupManagement from '@/components/admin/MarkupManagement'

export default async function MarkupManagementPage() {
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">도면 마킹 관리</h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">도면 마킹 문서 관리 및 권한 설정</p>
      </div>

      <MarkupManagement profile={profile} />
    </div>
  )
}