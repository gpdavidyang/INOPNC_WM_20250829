import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { getMarkupDocuments } from '@/app/actions/admin/markup'
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
  title: '브라우저 마크업 에디터',
}

export default async function AdminMarkupEditorPage() {
  await requireAdminProfile()

  const result = await getMarkupDocuments(1, 10)
  const docs = result.success && result.data ? (result.data as any).documents : []

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>브라우저 마크업 에디터</CardTitle>
          <CardDescription>다음 단계에서 에디터 UI를 연결합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard/admin/documents/markup" className="underline text-blue-600">
            마크업 문서 목록으로 이동
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>최근 문서</CardTitle>
          <CardDescription>열기 링크로 상세 페이지 이동</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>생성일</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead>현장</TableHead>
                  <TableHead>작성자</TableHead>
                  <TableHead>보기</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-sm text-muted-foreground py-8"
                    >
                      표시할 문서가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  docs.map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell>{new Date(d.created_at).toLocaleString('ko-KR')}</TableCell>
                      <TableCell className="font-medium text-foreground">
                        {d.title || '-'}
                      </TableCell>
                      <TableCell>{d.site?.name || '-'}</TableCell>
                      <TableCell>{d.creator?.full_name || d.creator?.email || '-'}</TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/admin/documents/markup/${d.id}`}
                          className="underline text-blue-600"
                        >
                          열기
                        </Link>
                      </TableCell>
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
