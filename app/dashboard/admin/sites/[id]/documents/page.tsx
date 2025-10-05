import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import SiteDocumentsTable from '@/components/admin/SiteDocumentsTable'
import { Input } from '@/components/ui/input'
import { Button, buttonVariants } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = { title: '현장 문서' }

interface SiteDocumentsPageProps {
  params: {
    id: string
  }
}

export default async function AdminSiteDocumentsPage({ params }: SiteDocumentsPageProps) {
  await requireAdminProfile()

  const supabase = createClient()
  const searchParams = new URLSearchParams()
  // Server-side we will parse nothing (SSR only). Filters via GET

  const { data: site } = await supabase
    .from('sites')
    .select('id,name')
    .eq('id', params.id)
    .maybeSingle()

  const { data } = await supabase
    .from('unified_document_system')
    .select('id,title,category_type,status,created_at')
    .eq('site_id', params.id)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(50)

  const docs = Array.isArray(data) ? data : []

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="현장 문서"
        subtitle={`${site?.name || params.id} - 최신 50개`}
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '현장 관리', href: '/dashboard/admin/sites' },
          { label: '현장 문서' },
        ]}
        actions={
          <a
            href={`/dashboard/admin/sites/${params.id}`}
            className={buttonVariants({ variant: 'outline', size: 'standard' })}
            role="button"
          >
            현장 상세로
          </a>
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
