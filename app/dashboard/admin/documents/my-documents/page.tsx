import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import MyDocumentsTable from '@/components/admin/MyDocumentsTable'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = {
  title: '내 문서 관리',
}

export default async function AdminMyDocumentsPage() {
  const profile = await requireAdminProfile()
  const supabase = createClient()

  const { data } = await supabase
    .from('unified_document_system')
    .select('id,title,category_type,status,created_at,site:sites(name)')
    .eq('uploaded_by', profile.id)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(50)
  const docs = Array.isArray(data) ? data : []

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="내 문서"
        description="본인이 업로드한 최근 문서"
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '문서 관리', href: '/dashboard/admin/documents' }, { label: '내 문서' }]}
        showBackButton
        backButtonHref="/dashboard/admin/documents"
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
          <MyDocumentsTable docs={docs} />
        </div>
      </div>
    </div>
  )
}
