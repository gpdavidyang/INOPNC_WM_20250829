import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { headers } from 'next/headers'
import { PageHeader } from '@/components/ui/page-header'
import EditClient from './EditClient'

export const metadata: Metadata = {
  title: '마크업 문서 편집',
}

export default async function AdminMarkupEditPage({ params }: { params: { id: string } }) {
  await requireAdminProfile()

  const h = headers()
  const proto = h.get('x-forwarded-proto') || 'http'
  const host = h.get('host') || process.env.VERCEL_URL || 'localhost:3000'
  const base = host.startsWith('http') ? host : `${proto}://${host}`
  const res = await fetch(new URL(`/api/markup-documents/${params.id}`, base).toString(), {
    cache: 'no-store',
    headers: { cookie: h.get('cookie') || '' },
  }).catch(() => null)
  const json = (await res?.json().catch(() => ({}))) as any
  const doc = json?.data || null

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
        backButtonHref={`/dashboard/admin/documents/markup/${params.id}`}
      />
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {doc ? (
          <EditClient document={doc} />
        ) : (
          <div className="rounded border bg-card p-6 text-sm text-muted-foreground">문서를 불러올 수 없습니다.</div>
        )}
      </div>
    </div>
  )
}
