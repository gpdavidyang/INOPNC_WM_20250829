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

export const metadata: Metadata = { title: '문서 상세' }

export default async function AdminUnifiedDocumentDetailPage({
  params,
}: {
  params: { id: string }
}) {
  await requireAdminProfile()
  const id = params.id
  const supabase = createClient()

  // 1) 기본: unified_document_system에서 조회
  const { data: base } = await supabase
    .from('unified_document_system')
    .select(
      `
      *,
      uploader:profiles!unified_document_system_uploaded_by_fkey(full_name,email),
      approver:profiles!unified_document_system_approved_by_fkey(full_name,email),
      site:sites(name)
    `
    )
    .eq('id', id)
    .maybeSingle()

  // 2) 이력: v2 API에서 history 가져오기 시도 (실패 시 무시)
  let history: any[] = []
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
    const res = await fetch(`${baseUrl}/api/unified-documents/v2/${id}`, { cache: 'no-store' })
    const json = await res.json()
    if (res.ok && json?.history) history = json.history
  } catch (_) {
    history = []
  }

  // 3) 접근 로그 최근 10개 (존재 시)
  let accessLogs: any[] = []
  try {
    const { data: logs } = await supabase
      .from('document_access_logs')
      .select('created_at, action, user_id')
      .eq('document_id', id)
      .order('created_at', { ascending: false })
      .limit(10)
    accessLogs = logs || []
  } catch (_) {
    accessLogs = []
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{base?.title || '-'}</CardTitle>
          <CardDescription>{base?.site?.name || '-'}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <div>
            유형: <span className="text-foreground font-medium">{base?.category_type || '-'}</span>
          </div>
          <div>상태: {base?.status || '-'}</div>
          <div>작성자: {base?.uploader?.full_name || base?.uploader?.email || '-'}</div>
          <div>승인자: {base?.approver?.full_name || base?.approver?.email || '-'}</div>
          <div>
            등록일: {base?.created_at ? new Date(base.created_at).toLocaleString('ko-KR') : '-'}
          </div>
          <div>
            수정일: {base?.updated_at ? new Date(base.updated_at).toLocaleString('ko-KR') : '-'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>이력</CardTitle>
          <CardDescription>최근 변경 10건</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>일시</TableHead>
                  <TableHead>동작</TableHead>
                  <TableHead>사용자</TableHead>
                  <TableHead>메모</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-sm text-muted-foreground py-10"
                    >
                      표시할 이력이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((h: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>
                        {h.changed_at ? new Date(h.changed_at).toLocaleString('ko-KR') : '-'}
                      </TableCell>
                      <TableCell>{h.action || '-'}</TableCell>
                      <TableCell>{h.user?.full_name || h.user?.email || '-'}</TableCell>
                      <TableCell className="truncate max-w-[420px]" title={h.comment || ''}>
                        {h.comment || '-'}
                      </TableCell>
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
          <CardTitle>접근 로그</CardTitle>
          <CardDescription>최근 10개</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>시간</TableHead>
                  <TableHead>동작</TableHead>
                  <TableHead>사용자</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accessLogs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-sm text-muted-foreground py-10"
                    >
                      표시할 로그가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  accessLogs.map((l: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>
                        {l.created_at ? new Date(l.created_at).toLocaleString('ko-KR') : '-'}
                      </TableCell>
                      <TableCell>{l.action || '-'}</TableCell>
                      <TableCell>{l.user_id || '-'}</TableCell>
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
