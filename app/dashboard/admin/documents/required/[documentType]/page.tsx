import type { Metadata } from 'next'
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

export const metadata: Metadata = {
  title: '필수 문서 상세',
}

interface DocumentTypePageProps {
  params: {
    documentType: string
  }
}

export default async function RequiredDocumentTypePage({ params }: DocumentTypePageProps) {
  await requireAdminProfile()
  const supabase = createClient()
  const type = decodeURIComponent(params.documentType)

  const { data } = await supabase
    .from('unified_document_system')
    .select(
      'id, title, status, created_at, uploaded_by, profiles:profiles!unified_document_system_uploaded_by_fkey(full_name,email)'
    )
    .in('category_type', ['required', 'required_user_docs'])
    .eq('sub_category', type)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  const docs = Array.isArray(data) ? data : []

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">필수 문서 – {type}</h1>
        <p className="text-sm text-muted-foreground">유형별 제출 문서 목록</p>
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제출일</TableHead>
              <TableHead>문서명</TableHead>
              <TableHead>제출자</TableHead>
              <TableHead>상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {docs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-10">
                  표시할 문서가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              docs.map((d: any) => (
                <TableRow key={d.id}>
                  <TableCell>{new Date(d.created_at).toLocaleDateString('ko-KR')}</TableCell>
                  <TableCell className="font-medium text-foreground">{d.title || '-'}</TableCell>
                  <TableCell>{d.profiles?.full_name || d.profiles?.email || '-'}</TableCell>
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
