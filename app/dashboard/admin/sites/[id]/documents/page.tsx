import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import SiteDocumentsTable from '@/components/admin/SiteDocumentsTable'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">현장 문서</h1>
        <p className="text-sm text-muted-foreground">{site?.name || params.id} - 최신 50개</p>
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
        <SiteDocumentsTable docs={docs} />
      </div>
    </div>
  )
}
