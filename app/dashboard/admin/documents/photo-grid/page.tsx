
export default async function AdminPhotoGridDocumentsPage() {
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

    // 사진대지문서함 접근 권한 확인
    if (!canAccessDocumentCategory(profile.role as unknown, 'photo_grid')) {
      redirect('/dashboard')
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">사진대지 관리</h1>
          <p className="text-gray-600 mt-1">
            {profile.role === 'customer_manager' 
              ? '자사 현장의 사진대지 문서를 관리합니다.'
              : '현장별 사진대지 문서를 관리합니다.'
            }
          </p>
        </div>
        
        <PhotoGridDocumentsManagement />
      </div>
    )
  } catch (error) {
    console.error('Error loading photo grid documents page:', error)
    redirect('/auth/login')
  }
}