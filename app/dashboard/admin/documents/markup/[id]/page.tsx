import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { headers } from 'next/headers'
import DownloadLinkButton from '@/components/admin/DownloadLinkButton'
import DeleteMarkupButton from './DeleteButton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import DetailTablesClient from './DetailTablesClient'

export const metadata: Metadata = {
  title: '도면마킹 문서 상세',
}

export default async function AdminMarkupDocumentDetailPage({
  params,
}: {
  params: { id: string }
}) {
  await requireAdminProfile()
  const h = headers()
  const proto = h.get('x-forwarded-proto') || 'http'
  const host = h.get('host') || process.env.VERCEL_URL || 'localhost:3000'
  const base = host.startsWith('http') ? host : `${proto}://${host}`
  const res = await fetch(new URL(`/api/admin/documents/markup/${params.id}`, base).toString(), {
    cache: 'no-store',
    headers: { cookie: h.get('cookie') || '' },
  })
  const json = await res.json()
  const doc = json?.data || null

  const [versionsRes, historyRes] = await Promise.all([
    fetch(new URL(`/api/admin/documents/markup/${params.id}/versions`, base).toString(), {
      cache: 'no-store',
      headers: { cookie: h.get('cookie') || '' },
    }),
    fetch(new URL(`/api/admin/documents/markup/${params.id}/history`, base).toString(), {
      cache: 'no-store',
      headers: { cookie: h.get('cookie') || '' },
    }),
  ])
  const versionsJson = await versionsRes.json().catch(() => ({}))
  const historyJson = await historyRes.json().catch(() => ({}))
  const versionsRaw = versionsJson?.data?.versions || []
  const historyRaw = historyJson?.data?.history || []

  // Signed preview URL for source file
  let previewUrl: string | null = null
  if (doc?.file_url) {
    try {
      const r = await fetch(`/api/files/signed-url?url=${encodeURIComponent(String(doc.file_url))}`, {
        cache: 'no-store',
      })
      const j = await r.json().catch(() => ({}))
      previewUrl = (j?.url as string) || String(doc.file_url)
    } catch {
      previewUrl = String(doc.file_url)
    }
  }

  return (
    <div className="px-0 pb-8 space-y-6">
      <PageHeader
        title="도면마킹 문서 상세"
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '문서 관리', href: '/dashboard/admin/documents' },
          { label: '마크업', href: '/dashboard/admin/documents/markup' },
          { label: '상세' },
        ]}
        showBackButton
        backButtonHref="/dashboard/admin/documents/markup"
        actions={
          <div className="flex items-center gap-2">
            <a
              href={`/dashboard/admin/documents/markup/${params.id}/edit`}
              className="inline-flex items-center rounded-md border px-3 py-2 text-sm"
              role="button"
            >
              편집
            </a>
            <DeleteMarkupButton id={params.id} />
          </div>
        }
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{doc?.title || '-'}</CardTitle>
          <CardDescription>{doc?.site?.name || '-'}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <div>작성자: {doc?.creator?.full_name || doc?.creator?.email || '-'}</div>
          <div>
            상태: <span className="text-foreground font-medium">{doc?.status || '-'}</span>
          </div>
          <div>
            파일: {doc?.file_name || '-'}{' '}
            {doc?.file_size ? `(${Math.round((Number(doc.file_size) || 0) / 1024)} KB)` : ''}
          </div>
          <div className="flex items-center gap-3">
            {previewUrl && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="underline text-blue-600"
              >
                파일 열기
              </a>
            )}
            <DownloadLinkButton endpoint={`/api/admin/documents/markup/${params.id}/download`} />
          </div>
        </CardContent>
      </Card>

      {(() => {
        const versions = (versionsRaw || []).map((v: any) => ({
          id: v?.id,
          version: v?.version_number ?? v?.version ?? '-',
          title: v?.title || '-',
          author: v?.created_by?.full_name || v?.created_by?.email || '-',
          created_at_str: v?.created_at ? new Date(v.created_at).toLocaleString('ko-KR') : '-',
          latest_label: v?.is_latest_version ? '예' : '',
        }))

        const history = (historyRaw || []).map((h: any) => ({
          id: h?.id,
          changed_at_str: h?.changed_at ? new Date(h.changed_at).toLocaleString('ko-KR') : '-',
          change_type: h?.change_type || '-',
          summary: h?.change_summary || '-',
          user_label: h?.user?.full_name || h?.user?.email || '-',
        }))

        return <DetailTablesClient versions={versions} history={history} />
      })()}
      </div>
    </div>
  )
}
