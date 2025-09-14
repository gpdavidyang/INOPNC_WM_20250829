
export default async function AdminMarkupDocumentsPage() {
  const supabase = createClient()
  
  try {
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

    // 도면마킹문서함 접근 권한 확인
    if (!canAccessDocumentCategory(profile.role as unknown, 'markup')) {
      redirect('/dashboard')
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">도면마킹 관리</h1>
          <p className="text-gray-600 mt-1">현장별 도면마킹 문서를 관리합니다.</p>
        </div>
        
        <MarkupDocumentsManagement />
      </div>
    )
  } catch (error) {
    console.error('Error loading markup documents page:', error)
    redirect('/auth/login')
  }
}