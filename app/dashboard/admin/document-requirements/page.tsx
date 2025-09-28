import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: '필수 문서 유형',
}

export default async function AdminDocumentRequirementsPage() {
  await requireAdminProfile()
  const supabase = createClient()

  const { data } = await supabase
    .from('required_document_types')
    .select(
      `
      id,
      code,
      name_ko,
      name_en,
      file_types,
      max_file_size,
      is_active,
      sort_order,
      created_at
    `
    )
    .order('sort_order', { ascending: true })

  const types = Array.isArray(data) ? data : []

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">필수 문서 유형</h1>
        <p className="text-sm text-muted-foreground">
          역할/현장 요구사항은 내부 상세 화면에서 관리 예정
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>코드</TableHead>
              <TableHead>이름(국문)</TableHead>
              <TableHead>허용 확장자</TableHead>
              <TableHead className="text-right">최대 크기</TableHead>
              <TableHead>활성</TableHead>
              <TableHead className="text-right">정렬</TableHead>
              <TableHead>생성일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {types.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-10">
                  표시할 문서 유형이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              types.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium text-foreground">{t.code}</TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/admin/document-requirements/${t.id}`}
                      className="underline text-blue-600"
                    >
                      {t.name_ko || t.name_en || '-'}
                    </Link>
                  </TableCell>
                  <TableCell
                    className="truncate max-w-[260px]"
                    title={(t.file_types || []).join(', ')}
                  >
                    {(t.file_types || []).join(', ') || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {t.max_file_size ? `${Math.round(t.max_file_size / (1024 * 1024))} MB` : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.is_active ? 'default' : 'outline'}>
                      {t.is_active ? '활성' : '비활성'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{t.sort_order ?? 0}</TableCell>
                  <TableCell>
                    {t.created_at ? new Date(t.created_at).toLocaleDateString('ko-KR') : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
