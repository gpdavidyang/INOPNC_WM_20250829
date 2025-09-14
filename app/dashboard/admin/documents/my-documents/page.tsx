import { createClient } from "@/lib/supabase/server"

export default async function AdminMyDocumentsPage() {
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

    if (profile.role !== 'admin') {
      redirect('/dashboard')
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">내문서함 관리</h1>
          <p className="text-gray-600 mt-1">모든 사용자의 개인 문서함을 관리합니다.</p>
        </div>
        
        <MyDocumentsManagement />
      </div>
    )
  } catch (error) {
    console.error('Error loading my documents page:', error)
    redirect('/auth/login')
  }
}