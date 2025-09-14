import { createClient } from "@/lib/supabase/server"

export default async function AdminDocumentsPage() {
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

    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">문서 관리</h1>
          <p className="text-gray-600">
            역할에 따라 접근 가능한 문서함을 관리할 수 있습니다.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 문서함 네비게이션 */}
          <div className="lg:col-span-1">
            <DocumentNavigation />
          </div>
          
          {/* 통합 문서 관리 */}
          <div className="lg:col-span-2">
            <UnifiedDocumentManagement />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading documents page:', error)
    redirect('/auth/login')
  }
}