import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import SiteDocumentsTable from '@/components/admin/SiteDocumentsTable'
import { buttonVariants } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = { title: '현장 기성청구 문서' }

interface SiteDocumentsPageProps {
  params: {
    id: string
  }
}

export default async function AdminSiteDocumentsPage({ params }: SiteDocumentsPageProps) {
  await requireAdminProfile()

  const supabase = createClient()

  const { data: site } = await supabase
    .from('sites')
    .select('id,name')
    .eq('id', params.id)
    .maybeSingle()

  const { data } = await supabase
    .from('unified_document_system')
    .select('id,title,file_name,category_type,status,created_at,metadata,uploaded_by')
    .eq('site_id', params.id)
    .eq('category_type', 'invoice')
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(50)

  const docs = Array.isArray(data) ? data : []

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="현장 기성청구 문서"
        subtitle={`${site?.name || params.id} - 최신 기성 문서 50건`}
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '현장 관리', href: '/dashboard/admin/sites' },
          { label: '현장 기성청구 문서' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <a
              href="/dashboard/admin/documents/invoice"
              className={buttonVariants({ variant: 'outline', size: 'standard' })}
              role="button"
            >
              기성청구 관리로 이동
            </a>
            <a
              href={`/dashboard/admin/sites/${params.id}`}
              className={buttonVariants({ variant: 'secondary', size: 'standard' })}
              role="button"
            >
              현장 상세로
            </a>
          </div>
        }
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
          <SiteDocumentsTable docs={docs} />
        </div>
      </div>
    </div>
  )
}
