import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import DownloadLinkButton from '@/components/admin/DownloadLinkButton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import DataTable, { type Column } from '@/components/admin/DataTable'

export const metadata: Metadata = {
  title: '마크업 문서 상세',
}

export default async function AdminMarkupDocumentDetailPage({
  params,
}: {
  params: { id: string }
}) {
  await requireAdminProfile()
  const res = await fetch(`/api/admin/documents/markup/${params.id}`, { cache: 'no-store' })
  const json = await res.json()
  const doc = json?.data || null

  const [versionsRes, historyRes] = await Promise.all([
    fetch(`/api/admin/documents/markup/${params.id}/versions`, { cache: 'no-store' }),
    fetch(`/api/admin/documents/markup/${params.id}/history`, { cache: 'no-store' }),
  ])
  const versionsJson = await versionsRes.json().catch(() => ({}))
  const historyJson = await historyRes.json().catch(() => ({}))
  const versions = versionsJson?.data?.versions || []
  const history = historyJson?.data?.history || []

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
        title="마크업 문서 상세"
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '문서 관리', href: '/dashboard/admin/documents' },
          { label: '마크업', href: '/dashboard/admin/documents/markup' },
          { label: '상세' },
        ]}
        showBackButton
        backButtonHref="/dashboard/admin/documents/markup"
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

      <Card>
        <CardHeader>
          <CardTitle>메타데이터</CardTitle>
          <CardDescription>기본 필드</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable<{ key: string; value: string }>
            data={([
              { key: 'id', value: String(doc?.id ?? '-') },
              {
                key: 'created_at',
                value: doc?.created_at ? new Date(doc.created_at).toLocaleString('ko-KR') : '-',
              },
              {
                key: 'updated_at',
                value: doc?.updated_at ? new Date(doc.updated_at).toLocaleString('ko-KR') : '-',
              },
              { key: 'description', value: String(doc?.description ?? '-') },
              { key: 'mime_type', value: String(doc?.mime_type ?? '-') },
            ])}
            rowKey={r => r.key}
            stickyHeader
            columns={([
              { key: 'key', header: '키', sortable: true, render: r => <span className="font-medium text-foreground">{r.key}</span> },
              { key: 'value', header: '값', sortable: true, render: r => <span className="truncate inline-block max-w-[560px]" title={r.value}>{r.value}</span> },
            ] as Column<{ key: string; value: string }>)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>버전</CardTitle>
          <CardDescription>최신순</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable<any>
            data={versions}
            rowKey={(v: any) => v.id}
            stickyHeader
            emptyMessage="버전 정보가 없습니다."
            columns={([
              { key: 'version', header: '버전', sortable: true, render: (v: any) => v?.version_number ?? v?.version ?? '-' },
              { key: 'title', header: '제목', sortable: true, render: (v: any) => v?.title || '-' },
              { key: 'author', header: '작성자', sortable: true, render: (v: any) => v?.created_by?.full_name || v?.created_by?.email || '-' },
              { key: 'created_at', header: '생성일', sortable: true, render: (v: any) => (v?.created_at ? new Date(v.created_at).toLocaleString('ko-KR') : '-') },
              { key: 'latest', header: '최신', sortable: true, render: (v: any) => (v?.is_latest_version ? '예' : '') },
            ] as Column<any>[])}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>변경 이력</CardTitle>
          <CardDescription>최근 기록</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable<any>
            data={history}
            rowKey={(h: any) => h.id}
            stickyHeader
            emptyMessage="이력이 없습니다."
            columns={([
              { key: 'changed_at', header: '일시', sortable: true, render: (h: any) => (h?.changed_at ? new Date(h.changed_at).toLocaleString('ko-KR') : '-') },
              { key: 'change_type', header: '변경', sortable: true, render: (h: any) => h?.change_type || '-' },
              { key: 'summary', header: '요약', sortable: false, render: (h: any) => <span className="truncate inline-block max-w-[420px]" title={h?.change_summary || ''}>{h?.change_summary || '-'}</span> },
              { key: 'user', header: '사용자', sortable: true, render: (h: any) => h?.user?.full_name || h?.user?.email || '-' },
            ] as Column<any>[])}
          />
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
