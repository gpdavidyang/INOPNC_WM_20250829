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
  title: '내 문서 관리',
}

export default async function AdminMyDocumentsPage() {
  const profile = await requireAdminProfile()
  const supabase = createClient()

  const { data } = await supabase
    .from('unified_document_system')
    .select('id,title,category_type,status,created_at,site:sites(name)')
    .eq('uploaded_by', profile.id)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(50)
  const docs = Array.isArray(data) ? data : []

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">내 문서</h1>
        <p className="text-sm text-muted-foreground">본인이 업로드한 최근 문서</p>
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
                  <TableCell className="font-medium text-foreground">{d.title || '-'}</TableCell>
                  <TableCell>{d.category_type || '-'}</TableCell>
                  <TableCell>{d.site?.name || '-'}</TableCell>
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
