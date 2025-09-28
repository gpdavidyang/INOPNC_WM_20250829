import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: '필수 문서 관리',
}

export default async function AdminRequiredDocumentsPage() {
  await requireAdminProfile()

  // 서버에서 내부 API 호출(권한/RLS 반영)
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/admin/documents/required`,
    { cache: 'no-store' }
  ).catch(() => null)
  const json = await res?.json().catch(() => null)
  const docs: any[] = Array.isArray(json?.documents) ? json.documents : []

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">필수 문서 관리</h1>
        <p className="text-sm text-muted-foreground">역할/현장 요구 문서 제출 현황</p>
      </div>

      <div className="mb-6 rounded-lg border bg-card p-4 shadow-sm">
        <form method="GET" className="flex items-center gap-2">
          <Input name="search" placeholder="문서명/유형/작성자 검색(클라이언트 필터 예정)" />
          <Button type="submit" variant="outline">
            검색
          </Button>
        </form>
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제출일</TableHead>
              <TableHead>문서명</TableHead>
              <TableHead>유형</TableHead>
              <TableHead>제출자</TableHead>
              <TableHead>상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {docs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-10">
                  표시할 문서가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              docs.map((d: any) => (
                <TableRow key={d.id}>
                  <TableCell>
                    {d.submission_date
                      ? new Date(d.submission_date).toLocaleDateString('ko-KR')
                      : '-'}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{d.title || '-'}</TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/admin/documents/required/${encodeURIComponent(d.document_type || 'unknown')}`}
                      className="underline text-blue-600"
                    >
                      {d.document_type || 'unknown'}
                    </Link>
                  </TableCell>
                  <TableCell>{d.submitted_by?.full_name || d.submitted_by?.email || '-'}</TableCell>
                  <TableCell>{d.status || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
