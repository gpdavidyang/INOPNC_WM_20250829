import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import MyDocumentsTable from '@/components/admin/MyDocumentsTable'

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
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">내 문서</h1>
        <p className="text-sm text-muted-foreground">본인이 업로드한 최근 문서</p>
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
        <MyDocumentsTable docs={docs} />
      </div>
    </div>
  )
}
