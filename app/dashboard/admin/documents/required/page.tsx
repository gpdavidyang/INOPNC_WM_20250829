import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canAccessDocumentCategory } from '@/lib/document-permissions'
import RealRequiredDocumentsManagement from '@/components/admin/documents/RealRequiredDocumentsManagement'

export default async function AdminRequiredDocumentsPage() {
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

    // 필수제출서류함 접근 권한 확인
    if (!canAccessDocumentCategory(profile.role as any, 'required')) {
      redirect('/dashboard')
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">필수 제출 서류 관리</h1>
          <p className="text-gray-600 mt-1">작업자별 필수 제출 서류를 조회, 등록, 수정, 삭제할 수 있습니다.</p>
        </div>
        
        <RealRequiredDocumentsManagement />
      </div>
    )
  } catch (error) {
    console.error('Error loading required documents page:', error)
    redirect('/auth/login')
  }
}