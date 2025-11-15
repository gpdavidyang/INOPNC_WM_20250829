import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { headers } from 'next/headers'
import { PageHeader } from '@/components/ui/page-header'
import { createClient } from '@/lib/supabase/server'
import EditClient from './EditClient'

export const metadata: Metadata = {
  title: '마크업 문서 편집',
}

export default async function AdminMarkupEditPage({ params }: { params: { id: string } }) {
  await requireAdminProfile()

  const h = headers()
  const supabase = createClient()
  const proto = h.get('x-forwarded-proto') || 'http'
  const host = h.get('host') || process.env.VERCEL_URL || 'localhost:3000'
  const base = host.startsWith('http') ? host : `${proto}://${host}`
  const res = await fetch(new URL(`/api/markup-documents/${params.id}`, base).toString(), {
    cache: 'no-store',
    headers: { cookie: h.get('cookie') || '' },
  }).catch(() => null)
  const json = (await res?.json().catch(() => ({}))) as any
  const doc = json?.data || null

  const { data: siteRows } = await supabase
    .from('sites')
    .select('id, name')
    .eq('is_deleted', false)
    .order('name', { ascending: true })

  const siteOptions =
    siteRows?.map(site => ({
      id: site.id as string,
      name: (site.name as string) || '이름없음',
    })) || []

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="마크업 문서 편집"
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '문서 관리', href: '/dashboard/admin/documents' },
          { label: '마크업', href: '/dashboard/admin/documents/markup' },
          { label: '편집' },
        ]}
        showBackButton
        backButtonHref="/dashboard/admin/documents/markup"
      />
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {doc ? (
          <EditClient document={doc} siteOptions={siteOptions} />
        ) : (
          <div className="rounded border bg-card p-6 text-sm text-muted-foreground">문서를 불러올 수 없습니다.</div>
        )}
      </div>
    </div>
  )
}
