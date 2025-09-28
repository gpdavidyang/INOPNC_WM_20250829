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
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: '문서 관리',
}

export default async function AdminDocumentsPage() {
  await requireAdminProfile()
  const supabase = createClient()

  // 통합 문서 시스템에서 최근 문서 20건 조회 (읽기 전용)
  const { data } = await supabase
    .from('unified_document_system')
    .select(
      `
      id,
      title,
      category_type,
      status,
      created_at,
      site:sites(id,name)
    `
    )
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(20)

  const docs = Array.isArray(data) ? data : []

  const categoryLabel = (t?: string) => {
    switch (t) {
      case 'required':
        return '필수서류'
      case 'markup':
        return '도면마킹'
      case 'photo_grid':
        return '사진대지'
      case 'invoice':
        return '정산문서'
      case 'shared':
        return '공유문서'
      default:
        return t || '-'
    }
  }

  const statusLabel = (s?: string) => {
    switch (s) {
      case 'uploaded':
        return '업로드'
      case 'pending':
        return '대기'
      case 'approved':
        return '승인'
      case 'rejected':
        return '반려'
      default:
        return s || '-'
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">문서 관리</h1>
        <p className="text-sm text-muted-foreground">최근 등록된 통합 문서 목록입니다.</p>
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>등록일</TableHead>
              <TableHead>문서명</TableHead>
              <TableHead>유형</TableHead>
              <TableHead>현장</TableHead>
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
                  <TableCell>{new Date(d.created_at).toLocaleDateString('ko-KR')}</TableCell>
                  <TableCell className="font-medium text-foreground">
                    <a
                      href={`/dashboard/admin/documents/${d.id}`}
                      className="underline text-blue-600"
                    >
                      {d.title || '-'}
                    </a>
                  </TableCell>
                  <TableCell>{categoryLabel(d.category_type)}</TableCell>
                  <TableCell>{d.site?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={d.status === 'approved' ? 'default' : 'outline'}>
                      {statusLabel(d.status)}
                    </Badge>
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
