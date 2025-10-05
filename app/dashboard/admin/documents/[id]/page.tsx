import type { Metadata } from 'next'
import Image from 'next/image'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/page-header'
import DownloadLinkButton from '@/components/admin/DownloadLinkButton'

export const metadata: Metadata = { title: '문서 상세' }

export default async function AdminDocumentDetailPage({ params }: { params: { id: string } }) {
  await requireAdminProfile()
  const supabase = createClient()

  const { data: doc } = await supabase
    .from('unified_document_system')
    .select(
      'id, title, category_type, sub_category, document_type, status, file_url, file_name, file_size, mime_type, site:sites(name), created_at'
    )
    .eq('id', params.id)
    .maybeSingle()

  // Build preview URL (signed if possible)
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
        title="문서 상세"
        description={`ID: ${params.id}`}
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '문서 관리', href: '/dashboard/admin/documents' },
          { label: '상세' },
        ]}
        showBackButton
        backButtonHref="/dashboard/admin/documents"
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="text-lg font-semibold text-foreground">{doc?.title || '-'}</div>
          <div className="text-sm text-muted-foreground">{(doc as any)?.site?.name || '-'}</div>
          <div className="mt-2 text-sm text-muted-foreground space-y-1">
            <div>
              유형: <span className="text-foreground font-medium">{doc?.document_type || '-'}</span>
            </div>
            <div>
              카테고리: <span className="text-foreground font-medium">{doc?.category_type || '-'}</span>
            </div>
            <div>
              상태: <span className="text-foreground font-medium">{doc?.status || '-'}</span>
            </div>
            <div>
              업로드일:{' '}
              <span className="text-foreground font-medium">
                {doc?.created_at ? new Date(doc.created_at).toLocaleString('ko-KR') : '-'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {previewUrl && (
                <a href={previewUrl} target="_blank" rel="noreferrer" className="underline text-blue-600">
                  파일 열기
                </a>
              )}
              <DownloadLinkButton endpoint={`/api/admin/documents/${params.id}/download`} />
            </div>
          </div>
        </div>

        {/* Inline preview for images/PDF */}
        {previewUrl && (
          <div className="rounded-lg border bg-card p-2 shadow-sm">
            {String(doc?.mime_type || '').startsWith('image/') ? (
              <div className="relative mx-auto aspect-[4/3] w-full max-w-3xl">
                <Image
                  src={previewUrl}
                  alt={String(doc?.title || 'document')}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
