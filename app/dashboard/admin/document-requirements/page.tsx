
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function DocumentRequirementsPage() {
  const supabase = await createClient()
  
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

    // system_admin 또는 admin 권한 확인
    if (!['system_admin', 'admin'].includes(profile.role)) {
      redirect('/dashboard')
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">필수서류 설정</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            작업자와 현장관리자가 제출해야 할 필수 서류를 설정하고 관리합니다.
          </p>
        </div>
        
        <RequiredDocumentTypesAdmin />
      </div>
    )
  } catch (error) {
    console.error('Error loading document requirements page:', error)
    redirect('/auth/login')
  }
}
