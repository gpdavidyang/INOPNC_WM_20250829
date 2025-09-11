import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canAccessDocumentCategory } from '@/lib/document-permissions'
import RequiredDocumentTypeDetailPage from '@/components/admin/documents/RequiredDocumentTypeDetailPage'

interface DocumentTypePageProps {
  params: { documentType: string }
}

export default async function DocumentTypeDetailPage({ params }: DocumentTypePageProps) {
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

    const documentType = decodeURIComponent(params.documentType)

    return (
      <div className="space-y-6">
        <RequiredDocumentTypeDetailPage documentType={documentType} />
      </div>
    )
  } catch (error) {
    console.error('Error loading document type detail page:', error)
    redirect('/auth/login')
  }
}