import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import DownloadLinkButton from '@/components/admin/DownloadLinkButton'

export const metadata: Metadata = {
  title: '사진대지 상세',
}

export default async function AdminPhotoGridDetailPage({ params }: { params: { id: string } }) {
  await requireAdminProfile()

  const [detailRes, versionsRes] = await Promise.all([
    fetch(`/api/admin/documents/photo-grid/${params.id}`, { cache: 'no-store' }),
    fetch(`/api/admin/documents/photo-grid/${params.id}/versions`, { cache: 'no-store' }),
  ])
  const detailJson = await detailRes.json().catch(() => ({}))
  const versionsJson = await versionsRes.json().catch(() => ({}))
  const doc = detailJson?.data || null
  const versions = versionsJson?.data?.versions || []

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">사진대지 상세</h1>
        <p className="text-sm text-muted-foreground">ID: {params.id}</p>
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="text-lg font-semibold text-foreground">{doc?.title || '-'}</div>
        <div className="text-sm text-muted-foreground">{doc?.site?.name || '-'}</div>
        <div className="mt-2 text-sm text-muted-foreground space-y-1">
          <div>
            상태: <span className="text-foreground font-medium">{doc?.status || '-'}</span>
          </div>
          <div>
            파일: {doc?.file_name || '-'}{' '}
            {doc?.file_size ? `(${Math.round((Number(doc.file_size) || 0) / 1024)} KB)` : ''}
          </div>
          <div className="flex items-center gap-3">
            {doc?.file_url && (
              <a
                href={String(doc.file_url)}
                target="_blank"
                rel="noreferrer"
                className="underline text-blue-600"
              >
                파일 열기
              </a>
            )}
            <DownloadLinkButton
              endpoint={`/api/admin/documents/photo-grid/${params.id}/download`}
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="text-sm font-semibold mb-2">버전</div>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-3 py-2">버전</th>
              <th className="px-3 py-2">생성자</th>
              <th className="px-3 py-2">생성일</th>
              <th className="px-3 py-2">최신</th>
            </tr>
          </thead>
          <tbody>
            {versions.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={4}>
                  버전 정보가 없습니다.
                </td>
              </tr>
            ) : (
              versions.map((v: any) => (
                <tr key={v.id} className="border-t">
                  <td className="px-3 py-2">{v.version_number ?? v.version ?? '-'}</td>
                  <td className="px-3 py-2">
                    {v.created_by?.full_name || v.created_by?.email || '-'}
                  </td>
                  <td className="px-3 py-2">
                    {v.created_at ? new Date(v.created_at).toLocaleString('ko-KR') : '-'}
                  </td>
                  <td className="px-3 py-2">{v.is_latest_version ? '예' : ''}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
