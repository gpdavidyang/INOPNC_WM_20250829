import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import InvoiceDocumentsManagement from '@/components/admin/documents/InvoiceDocumentsManagement'

export default async function AdminInvoiceDocumentsPage() {
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
          <h1 className="text-2xl font-bold text-gray-900">기성청구함 관리</h1>
          <p className="text-gray-600 mt-1">파트너사별 기성청구 관련 서류를 관리합니다.</p>
        </div>
        
        <InvoiceDocumentsManagement />
      </div>
    )
  } catch (error) {
    console.error('Error loading invoice documents page:', error)
    redirect('/auth/login')
  }
}