import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import DownloadLinkButton from '@/components/admin/DownloadLinkButton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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

  return (
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
          <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>키</TableHead>
                  <TableHead>값</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  ['id', doc?.id],
                  [
                    'created_at',
                    doc?.created_at ? new Date(doc.created_at).toLocaleString('ko-KR') : '-',
                  ],
                  [
                    'updated_at',
                    doc?.updated_at ? new Date(doc.updated_at).toLocaleString('ko-KR') : '-',
                  ],
                  ['description', doc?.description || '-'],
                  ['mime_type', doc?.mime_type || '-'],
                ].map(([k, v]) => (
                  <TableRow key={k as string}>
                    <TableCell className="font-medium text-foreground">{k as string}</TableCell>
                    <TableCell className="truncate max-w-[560px]" title={String(v ?? '-')}>
                      {String(v ?? '-')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>버전</CardTitle>
          <CardDescription>최신순</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>버전</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead>작성자</TableHead>
                  <TableHead>생성일</TableHead>
                  <TableHead>최신</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-sm text-muted-foreground py-8"
                    >
                      버전 정보가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  versions.map((v: any) => (
                    <TableRow key={v.id}>
                      <TableCell>{v.version_number ?? v.version ?? '-'}</TableCell>
                      <TableCell>{v.title || '-'}</TableCell>
                      <TableCell>{v.created_by?.full_name || v.created_by?.email || '-'}</TableCell>
                      <TableCell>
                        {v.created_at ? new Date(v.created_at).toLocaleString('ko-KR') : '-'}
                      </TableCell>
                      <TableCell>{v.is_latest_version ? '예' : ''}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>변경 이력</CardTitle>
          <CardDescription>최근 기록</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>일시</TableHead>
                  <TableHead>변경</TableHead>
                  <TableHead>요약</TableHead>
                  <TableHead>사용자</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-sm text-muted-foreground py-8"
                    >
                      이력이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((h: any) => (
                    <TableRow key={h.id}>
                      <TableCell>
                        {h.changed_at ? new Date(h.changed_at).toLocaleString('ko-KR') : '-'}
                      </TableCell>
                      <TableCell>{h.change_type || '-'}</TableCell>
                      <TableCell className="truncate max-w-[420px]" title={h.change_summary || ''}>
                        {h.change_summary || '-'}
                      </TableCell>
                      <TableCell>{h.user?.full_name || h.user?.email || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
