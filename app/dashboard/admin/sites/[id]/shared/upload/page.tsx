import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import SiteSharedDocumentUploadForm from '@/components/admin/sites/SiteSharedDocumentUploadForm'
import { PageHeader } from '@/components/ui/page-header'

interface UploadPageProps {
  params: {
    id: string
  }
}

export const metadata: Metadata = {
  title: '공유자료 업로드',
}

export default async function SiteSharedUploadPage({ params }: UploadPageProps) {
  await requireAdminProfile()

  const supabase = createClient()
  const siteId = params.id

  const { data: site } = await supabase
    .from('sites')
    .select('id, name, address')
    .eq('id', siteId)
    .maybeSingle()

  return (
    <div className="px-0 pb-12">
      <PageHeader
        title="공유자료 업로드"
        subtitle={site?.name ? `${site.name} 공유문서를 추가합니다.` : `현장 ID: ${siteId}`}
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '현장 관리', href: '/dashboard/admin/sites' },
          { label: site?.name || siteId, href: `/dashboard/admin/sites/${siteId}` },
          { label: '공유자료 업로드' },
        ]}
      />
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-6 rounded-lg border bg-card p-6 shadow-sm">
          <SiteSharedDocumentUploadForm
            siteId={siteId}
            siteName={site?.name}
            redirectTo={`/dashboard/admin/sites/${siteId}?tab=shared`}
          />
        </div>
      </div>
    </div>
  )
}
