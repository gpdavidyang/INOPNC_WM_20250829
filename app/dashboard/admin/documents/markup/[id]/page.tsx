import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
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
  const supabase = createClient()

  const { data } = await supabase
    .from('markup_documents')
    .select(
      `
      *,
      creator:profiles!markup_documents_created_by_fkey(full_name, email),
      site:sites(name)
    `
    )
    .eq('id', params.id)
    .maybeSingle()

  const doc = data || null

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
            {doc?.file_size ? `(${Math.round((doc.file_size as number) / 1024)} KB)` : ''}
          </div>
          {doc?.file_url && (
            <div>
              <a
                href={doc.file_url as string}
                target="_blank"
                rel="noreferrer"
                className="underline text-blue-600"
              >
                파일 열기
              </a>
            </div>
          )}
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
    </div>
  )
}
