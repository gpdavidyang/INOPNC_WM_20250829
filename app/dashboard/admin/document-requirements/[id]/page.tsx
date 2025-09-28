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
  title: '필수 문서 유형 상세',
}

export default async function RequiredDocTypeDetailPage({ params }: { params: { id: string } }) {
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
      description,
      file_types,
      max_file_size,
      is_active,
      sort_order,
      role_mappings:required_documents_by_role(
        role_type,
        is_required
      ),
      site_customizations:site_required_documents(
        site_id,
        is_required,
        due_days,
        notes,
        sites(name)
      )
    `
    )
    .eq('id', params.id)
    .maybeSingle()

  const docType = data || null

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">필수 문서 유형 상세</h1>
        <p className="text-sm text-muted-foreground">역할별/현장별 요구사항을 확인합니다.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{docType?.name_ko || docType?.name_en || '-'}</CardTitle>
          <CardDescription>{docType?.code}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <div>허용 확장자: {(docType?.file_types || []).join(', ') || '-'}</div>
          <div>
            최대 크기:{' '}
            {docType?.max_file_size
              ? `${Math.round(docType.max_file_size / (1024 * 1024))} MB`
              : '-'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>역할별 요구사항</CardTitle>
          <CardDescription>role → required 매핑</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>역할</TableHead>
                <TableHead>필수 여부</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!docType?.role_mappings || docType.role_mappings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-sm text-muted-foreground py-8">
                    설정된 역할 매핑이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                docType.role_mappings.map((m: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell>{m.role_type}</TableCell>
                    <TableCell>{m.is_required ? '필수' : '선택'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>현장별 커스터마이징</CardTitle>
          <CardDescription>site → required/due_days/notes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>현장</TableHead>
                <TableHead>필수 여부</TableHead>
                <TableHead>마감일(일)</TableHead>
                <TableHead>메모</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!docType?.site_customizations || docType.site_customizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                    설정된 현장 매핑이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                docType.site_customizations.map((s: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell>{s.sites?.name || s.site_id}</TableCell>
                    <TableCell>{s.is_required ? '필수' : '선택'}</TableCell>
                    <TableCell>{s.due_days ?? '-'}</TableCell>
                    <TableCell className="truncate max-w-[360px]" title={s.notes || ''}>
                      {s.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
